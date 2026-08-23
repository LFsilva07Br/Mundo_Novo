"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { supabaseUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  esquemaAtualizacaoPerfil,
  esquemaConvite,
  esquemaEmailConvite,
  esquemaIdPerfil,
  primeiroErro,
  type DadosAtualizacaoPerfil,
  type DadosConvite,
} from "./validacao";

/**
 * Server Actions de Usuários & Permissões.
 * Regras: só gestor/diretoria ativos gerenciam usuários; o convite por e-mail
 * usa a Admin API do Supabase (SUPABASE_SERVICE_ROLE_KEY, somente no servidor).
 */

export type ResultadoAcao =
  | { ok: true; mensagem: string }
  | { ok: false; erro: string };

const ERRO_SEM_BANCO =
  "Modo demonstração: o banco de dados ainda não foi conectado.";
const ERRO_SEM_PERMISSAO =
  "Você não tem permissão para gerenciar usuários. Fale com a gestão.";
const ERRO_SEM_CHAVE =
  "O convite por e-mail estará disponível no ambiente publicado.";
const ERRO_CONVITE =
  "Não foi possível enviar o convite. Tente novamente em instantes.";

type ClienteSupabase = NonNullable<Awaited<ReturnType<typeof createClient>>>;

/** O solicitante logado precisa ser gestor ou diretoria, e estar ativo. */
async function solicitanteEhGestao(supabase: ClienteSupabase): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("perfis")
    .select("papel, ativo")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !data) return false;

  return data.ativo && (data.papel === "gestor" || data.papel === "diretoria");
}

async function urlDoSite(): Promise<string> {
  const cabecalhos = await headers();
  const origem = cabecalhos.get("origin");
  if (origem) return origem;
  const host = cabecalhos.get("host");
  return host ? `https://${host}` : "";
}

type RespostaConvite =
  | { ok: true; idConvidado: string | null }
  | { ok: false; erro: string };

/** Chama a Admin API do Supabase para convidar por e-mail (service key só no servidor). */
async function enviarConviteAdmin(
  chaveServico: string,
  email: string,
  nome?: string,
): Promise<RespostaConvite> {
  const resposta = await fetch(`${supabaseUrl()}/auth/v1/invite`, {
    method: "POST",
    headers: {
      apikey: chaveServico,
      Authorization: `Bearer ${chaveServico}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      data: nome ? { nome } : {},
      redirect_to: `${await urlDoSite()}/definir-senha`,
    }),
    cache: "no-store",
  });

  if (!resposta.ok) {
    const corpo = (await resposta.json().catch(() => ({}))) as {
      msg?: string;
      message?: string;
      error_description?: string;
    };
    const detalhe = corpo.msg ?? corpo.message ?? corpo.error_description ?? "";
    if (/already.*(registered|been invited)|já/i.test(detalhe)) {
      return { ok: false, erro: "Este e-mail já possui cadastro no sistema." };
    }
    return { ok: false, erro: ERRO_CONVITE };
  }

  const corpo = (await resposta.json().catch(() => ({}))) as { id?: string };
  return { ok: true, idConvidado: corpo.id ?? null };
}

export async function convidarUsuario(
  dados: DadosConvite,
): Promise<ResultadoAcao> {
  const validacao = esquemaConvite.safeParse(dados);
  if (!validacao.success) {
    return { ok: false, erro: primeiroErro(validacao.error) };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: ERRO_SEM_BANCO };

  if (!(await solicitanteEhGestao(supabase))) {
    return { ok: false, erro: ERRO_SEM_PERMISSAO };
  }

  const chaveServico = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chaveServico) return { ok: false, erro: ERRO_SEM_CHAVE };

  const { nome, email, papel, alcadaAprovacao } = validacao.data;
  const convite = await enviarConviteAdmin(chaveServico, email, nome);
  if (!convite.ok) return convite;

  // O perfil é criado por trigger ao criar o usuário no Auth;
  // aqui só ajustamos papel e alçada com o client normal (RLS de gestão).
  if (convite.idConvidado) {
    const { error } = await supabase
      .from("perfis")
      .update({ papel, alcada_aprovacao: alcadaAprovacao })
      .eq("id", convite.idConvidado);
    if (error) {
      return {
        ok: false,
        erro:
          "O convite foi enviado, mas não conseguimos gravar papel e alçada. Ajuste direto na tabela.",
      };
    }
  }

  revalidatePath("/painel/usuarios");
  return { ok: true, mensagem: `Convite enviado para ${email}.` };
}

export async function atualizarPerfil(
  id: string,
  dados: DadosAtualizacaoPerfil,
): Promise<ResultadoAcao> {
  const validacaoId = esquemaIdPerfil.safeParse(id);
  if (!validacaoId.success) {
    return { ok: false, erro: primeiroErro(validacaoId.error) };
  }
  const validacao = esquemaAtualizacaoPerfil.safeParse(dados);
  if (!validacao.success) {
    return { ok: false, erro: primeiroErro(validacao.error) };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: ERRO_SEM_BANCO };

  if (!(await solicitanteEhGestao(supabase))) {
    return { ok: false, erro: ERRO_SEM_PERMISSAO };
  }

  const { papel, alcadaAprovacao, ativo } = validacao.data;
  const alteracoes: Record<string, unknown> = {};
  if (papel !== undefined) alteracoes.papel = papel;
  if (alcadaAprovacao !== undefined) alteracoes.alcada_aprovacao = alcadaAprovacao;
  if (ativo !== undefined) alteracoes.ativo = ativo;

  const { error } = await supabase
    .from("perfis")
    .update(alteracoes)
    .eq("id", validacaoId.data);
  if (error) {
    return {
      ok: false,
      erro: "Não foi possível salvar a alteração. Tente novamente.",
    };
  }

  revalidatePath("/painel/usuarios");
  return { ok: true, mensagem: "Perfil atualizado." };
}

export async function reenviarConvite(email: string): Promise<ResultadoAcao> {
  const validacao = esquemaEmailConvite.safeParse(email);
  if (!validacao.success) {
    return { ok: false, erro: primeiroErro(validacao.error) };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: ERRO_SEM_BANCO };

  if (!(await solicitanteEhGestao(supabase))) {
    return { ok: false, erro: ERRO_SEM_PERMISSAO };
  }

  const chaveServico = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chaveServico) return { ok: false, erro: ERRO_SEM_CHAVE };

  const convite = await enviarConviteAdmin(chaveServico, validacao.data);
  if (!convite.ok) return convite;

  return { ok: true, mensagem: `Convite reenviado para ${validacao.data}.` };
}
