"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  montarCaminhoEvidencia,
  validarArquivoEvidencia,
} from "@/lib/evidencias/regras";
import { supabaseUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  esquemaConviteProdutor,
  esquemaEvidenciaPortal,
  primeiroErro,
  type DadosConviteProdutor,
} from "./validacao";

/**
 * Server Actions do Portal do Produtor.
 *
 * - Convite do produtor: feito pela equipe (gestor/diretoria) na ficha do
 *   cliente, via Admin API do Supabase (mesmo padrão de src/lib/equipe/acoes.ts).
 *   O perfil criado recebe `cliente_id` — é isso que o torna usuário do portal.
 * - Evidência do produtor: o registro em `capa_evidencias` usa o client do
 *   próprio produtor (o RLS da migration 0010 garante que só entra evidência
 *   nas CAPAs do próprio cliente); o arquivo sobe pelo servidor porque o
 *   bucket 'evidencias' só aceita escrita da equipe.
 */

export type ResultadoAcao =
  | { ok: true; mensagem: string }
  | { ok: false; erro: string };

const BUCKET = "evidencias";

const ERRO_SEM_BANCO =
  "Modo demonstração: o banco de dados ainda não foi conectado.";
const ERRO_SEM_PERMISSAO =
  "Você não tem permissão para convidar produtores. Fale com a gestão.";
const ERRO_SEM_CHAVE =
  "O convite por e-mail estará disponível no ambiente publicado.";
const ERRO_CONVITE =
  "Não foi possível enviar o convite. Tente novamente em instantes.";

type ClienteSupabase = NonNullable<Awaited<ReturnType<typeof createClient>>>;

/** O solicitante logado precisa ser gestor ou diretoria da equipe, ativo. */
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

function cabecalhosServico(chaveServico: string): Record<string, string> {
  return {
    apikey: chaveServico,
    Authorization: `Bearer ${chaveServico}`,
    "Content-Type": "application/json",
  };
}

type RespostaConvite =
  | { ok: true; idConvidado: string | null }
  | { ok: false; erro: string };

/** Convida o produtor por e-mail via Admin API (service key só no servidor). */
async function enviarConviteAdmin(
  chaveServico: string,
  email: string,
  nome: string,
): Promise<RespostaConvite> {
  const resposta = await fetch(`${supabaseUrl()}/auth/v1/invite`, {
    method: "POST",
    headers: cabecalhosServico(chaveServico),
    body: JSON.stringify({
      email,
      data: { nome },
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

/**
 * Marca o perfil recém-convidado como produtor do portal: grava `cliente_id`
 * (o vínculo que define o acesso) e o papel 'consultor'. Usa a service key
 * porque o RLS de `perfis` não prevê essa escrita pelo client comum.
 */
async function vincularPerfilAoCliente(
  chaveServico: string,
  perfilId: string,
  clienteId: string,
): Promise<boolean> {
  const resposta = await fetch(
    `${supabaseUrl()}/rest/v1/perfis?id=eq.${encodeURIComponent(perfilId)}`,
    {
      method: "PATCH",
      headers: {
        ...cabecalhosServico(chaveServico),
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ cliente_id: clienteId, papel: "consultor" }),
      cache: "no-store",
    },
  );
  return resposta.ok;
}

/** Convida o produtor do cliente para o Portal do Produtor. */
export async function convidarProdutor(
  dados: DadosConviteProdutor,
): Promise<ResultadoAcao> {
  const validacao = esquemaConviteProdutor.safeParse(dados);
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

  const { clienteId, nome, email } = validacao.data;
  const convite = await enviarConviteAdmin(chaveServico, email, nome);
  if (!convite.ok) return convite;

  // Sem o vínculo o produtor cairia no painel da equipe — é parte essencial.
  if (!convite.idConvidado) {
    return {
      ok: false,
      erro:
        "O convite foi enviado, mas não conseguimos vincular o produtor ao cliente. Fale com o suporte.",
    };
  }
  const vinculado = await vincularPerfilAoCliente(
    chaveServico,
    convite.idConvidado,
    clienteId,
  );
  if (!vinculado) {
    return {
      ok: false,
      erro:
        "O convite foi enviado, mas não conseguimos vincular o produtor ao cliente. Fale com o suporte.",
    };
  }

  revalidatePath(`/painel/clientes/${clienteId}`);
  return {
    ok: true,
    mensagem: `Convite do portal enviado para ${email}.`,
  };
}

function extrairArquivo(formData: FormData): File | null {
  const arquivo = formData.get("arquivo");
  return arquivo instanceof File ? arquivo : null;
}

/** Sobe o arquivo com a service key (o bucket só aceita escrita da equipe). */
async function subirComChaveDeServico(
  chaveServico: string,
  caminho: string,
  arquivo: File,
): Promise<boolean> {
  const resposta = await fetch(
    `${supabaseUrl()}/storage/v1/object/${BUCKET}/${caminho}`,
    {
      method: "POST",
      headers: {
        apikey: chaveServico,
        Authorization: `Bearer ${chaveServico}`,
        "Content-Type": arquivo.type,
      },
      body: arquivo,
      cache: "no-store",
    },
  );
  return resposta.ok;
}

async function removerComChaveDeServico(
  chaveServico: string,
  caminho: string,
): Promise<void> {
  await fetch(`${supabaseUrl()}/storage/v1/object/${BUCKET}/${caminho}`, {
    method: "DELETE",
    headers: {
      apikey: chaveServico,
      Authorization: `Bearer ${chaveServico}`,
    },
    cache: "no-store",
  }).catch(() => undefined);
}

/**
 * O produtor anexa uma foto de evidência a uma pendência (CAPA) — o envio
 * já marca a ação como "enviada para verificação"; quem confere e conclui
 * continua sendo o consultor.
 *
 * A autorização vem do RLS: a CAPA só é visível (e o insert em
 * `capa_evidencias` só passa) se pertencer ao cliente do produtor logado.
 */
export async function enviarEvidenciaProdutor(
  capaId: string,
  acaoId: string | null,
  formData: FormData,
  descricao?: string,
): Promise<ResultadoAcao> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      ok: false,
      erro: "O envio de evidências estará disponível no ambiente publicado.",
    };
  }

  const ids = esquemaEvidenciaPortal.safeParse({ capaId, acaoId, descricao });
  if (!ids.success) return { ok: false, erro: primeiroErro(ids.error) };

  const arquivo = extrairArquivo(formData);
  if (!arquivo) return { ok: false, erro: "Escolha uma foto para enviar." };

  const validacao = validarArquivoEvidencia(arquivo);
  if (!validacao.ok) return validacao;

  // RLS: o produtor só enxerga as próprias CAPAs — se não achou, não é dele.
  const { data: capa } = await supabase
    .from("capas")
    .select("id, status")
    .eq("id", ids.data.capaId)
    .maybeSingle();
  if (!capa) return { ok: false, erro: "Pendência não encontrada." };
  if (capa.status === "fechada") {
    return {
      ok: false,
      erro: "Esta pendência já foi resolvida — não precisa enviar mais fotos.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sua sessão expirou — entre de novo." };

  const chaveServico = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chaveServico) {
    return {
      ok: false,
      erro: "O envio de evidências estará disponível no ambiente publicado.",
    };
  }

  const caminho = montarCaminhoEvidencia("capas", ids.data.capaId, arquivo.type);
  const subiu = await subirComChaveDeServico(chaveServico, caminho, arquivo);
  if (!subiu) {
    return { ok: false, erro: "Falha ao enviar a foto. Tente novamente." };
  }

  // O registro usa o client do produtor — o RLS valida o vínculo de verdade.
  const { error } = await supabase.from("capa_evidencias").insert({
    capa_id: ids.data.capaId,
    acao_id: ids.data.acaoId,
    caminho,
    descricao: ids.data.descricao || null,
    autor_id: user.id,
  });
  if (error) {
    // Não deixa arquivo órfão no bucket se o registro falhar.
    await removerComChaveDeServico(chaveServico, caminho);
    return {
      ok: false,
      erro: "Não foi possível registrar a evidência. Tente novamente.",
    };
  }

  revalidatePath("/portal/pendencias");
  return {
    ok: true,
    mensagem:
      "Foto enviada para verificação — o consultor vai conferir e concluir a ação.",
  };
}
