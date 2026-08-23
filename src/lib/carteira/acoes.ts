"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  deFormData,
  esquemaCliente,
  esquemaClienteExistente,
  esquemaContato,
  esquemaGrupo,
  esquemaGrupoExistente,
  esquemaRegistroContato,
  esquemaRemocaoContato,
  primeiroErro,
} from "./validacao";

/**
 * Ações de escrita da carteira (Server Actions).
 * Sem o Supabase conectado (modo demonstração), as ações retornam um
 * aviso amigável — nada é gravado.
 */

export type EstadoAcao =
  | { ok: true; mensagem: string }
  | { ok: false; erro: string }
  | null;

const ERRO_DEMO = {
  ok: false,
  erro: "O banco de dados ainda não foi conectado — no modo demonstração as alterações não são salvas.",
} as const;

function erroBanco(oQue: string): EstadoAcao {
  return {
    ok: false,
    erro: `Não foi possível salvar ${oQue}. Tente novamente em instantes.`,
  };
}

export async function criarGrupo(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const analise = esquemaGrupo.safeParse(deFormData(formData));
  if (!analise.success) return { ok: false, erro: primeiroErro(analise.error) };

  const supabase = await createClient();
  if (!supabase) return ERRO_DEMO;

  const dados = analise.data;
  const { error } = await supabase.from("grupos").insert({
    nome: dados.nome,
    administracao: dados.administracao,
    nome_administrador: dados.nomeAdministrador ?? null,
    cidade: dados.cidade ?? null,
    uf: dados.uf ?? null,
  });
  if (error) return erroBanco("o grupo");

  revalidatePath("/painel/grupos");
  revalidatePath("/painel/clientes");
  return { ok: true, mensagem: `Grupo "${dados.nome}" criado.` };
}

export async function atualizarGrupo(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const analise = esquemaGrupoExistente.safeParse(deFormData(formData));
  if (!analise.success) return { ok: false, erro: primeiroErro(analise.error) };

  const supabase = await createClient();
  if (!supabase) return ERRO_DEMO;

  const dados = analise.data;
  const { error } = await supabase
    .from("grupos")
    .update({
      nome: dados.nome,
      administracao: dados.administracao,
      nome_administrador: dados.nomeAdministrador ?? null,
      cidade: dados.cidade ?? null,
      uf: dados.uf ?? null,
    })
    .eq("id", dados.id);
  if (error) return erroBanco("o grupo");

  revalidatePath("/painel/grupos");
  revalidatePath("/painel/clientes");
  return { ok: true, mensagem: `Grupo "${dados.nome}" atualizado.` };
}

export async function criarCliente(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const analise = esquemaCliente.safeParse(deFormData(formData));
  if (!analise.success) return { ok: false, erro: primeiroErro(analise.error) };

  const supabase = await createClient();
  if (!supabase) return ERRO_DEMO;

  const dados = analise.data;
  const { error } = await supabase.from("clientes").insert({
    nome: dados.nome,
    tipo: dados.tipo,
    grupo_id: dados.grupoId ?? null,
    produtor: dados.produtor ?? null,
    cidade: dados.cidade,
    uf: dados.uf,
    regiao: dados.regiao,
    // Regra do produto: todo cliente novo começa na fase de implantação.
    fase: "implantacao",
  });
  if (error) return erroBanco("o cliente");

  revalidatePath("/painel/clientes");
  revalidatePath("/painel/grupos");
  return { ok: true, mensagem: `Cliente "${dados.nome}" criado em fase de implantação.` };
}

export async function atualizarCliente(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const analise = esquemaClienteExistente.safeParse(deFormData(formData));
  if (!analise.success) return { ok: false, erro: primeiroErro(analise.error) };

  const supabase = await createClient();
  if (!supabase) return ERRO_DEMO;

  const dados = analise.data;
  const { error } = await supabase
    .from("clientes")
    .update({
      nome: dados.nome,
      tipo: dados.tipo,
      grupo_id: dados.grupoId ?? null,
      produtor: dados.produtor ?? null,
      cidade: dados.cidade,
      uf: dados.uf,
      regiao: dados.regiao,
      fase: dados.fase,
    })
    .eq("id", dados.id);
  if (error) return erroBanco("o cliente");

  revalidatePath("/painel/clientes");
  revalidatePath(`/painel/clientes/${dados.id}`);
  revalidatePath("/painel/grupos");
  return { ok: true, mensagem: `Cliente "${dados.nome}" atualizado.` };
}

export async function adicionarContato(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const analise = esquemaContato.safeParse(deFormData(formData));
  if (!analise.success) return { ok: false, erro: primeiroErro(analise.error) };

  const supabase = await createClient();
  if (!supabase) return ERRO_DEMO;

  const dados = analise.data;
  const { error } = await supabase.from("contatos_cliente").insert({
    cliente_id: dados.clienteId,
    nome: dados.nome,
    area: dados.area,
    telefone: dados.telefone ?? null,
    email: dados.email ?? null,
  });
  if (error) return erroBanco("o contato");

  revalidatePath(`/painel/clientes/${dados.clienteId}`);
  return { ok: true, mensagem: `Contato "${dados.nome}" adicionado.` };
}

export async function removerContato(
  clienteId: string,
  nome: string,
  area: string,
): Promise<EstadoAcao> {
  const analise = esquemaRemocaoContato.safeParse({ clienteId, nome, area });
  if (!analise.success) return { ok: false, erro: primeiroErro(analise.error) };

  const supabase = await createClient();
  if (!supabase) return ERRO_DEMO;

  const dados = analise.data;
  const { error } = await supabase
    .from("contatos_cliente")
    .delete()
    .eq("cliente_id", dados.clienteId)
    .eq("nome", dados.nome)
    .eq("area", dados.area);
  if (error) {
    return {
      ok: false,
      erro: "Não foi possível remover o contato. Tente novamente em instantes.",
    };
  }

  revalidatePath(`/painel/clientes/${dados.clienteId}`);
  return { ok: true, mensagem: `Contato "${dados.nome}" removido.` };
}

export async function registrarContato(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const analise = esquemaRegistroContato.safeParse(deFormData(formData));
  if (!analise.success) return { ok: false, erro: primeiroErro(analise.error) };

  const supabase = await createClient();
  if (!supabase) return ERRO_DEMO;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const dados = analise.data;
  const { error } = await supabase.from("registros_contato").insert({
    cliente_id: dados.clienteId,
    tipo: dados.tipo,
    assunto: dados.assunto,
    detalhes: dados.detalhes ?? null,
    duracao_minutos: dados.duracaoMinutos ?? null,
    autor_id: user?.id ?? null,
    ocorrido_em: new Date(dados.ocorridoEm).toISOString(),
  });
  if (error) return erroBanco("o registro de contato");

  revalidatePath(`/painel/clientes/${dados.clienteId}`);
  return { ok: true, mensagem: "Contato registrado no histórico do cliente." };
}
