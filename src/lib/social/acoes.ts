"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  calcularVenceEm,
  esquemaAtualizarTrabalhador,
  esquemaDesativarTrabalhador,
  esquemaMoradia,
  esquemaMorador,
  esquemaParticipacao,
  esquemaTrabalhador,
  primeiraMensagem,
  type DadosTrabalhador,
} from "./validacao";

/**
 * Server Actions do módulo Social & Colaboradores.
 * Sem Supabase conectado (modo demonstração) nada é gravado — a ação
 * devolve uma mensagem clara em vez de falhar.
 */

export type EstadoAcao =
  | { ok: true; mensagem: string }
  | { ok: false; erro: string }
  | null;

const AVISO_DEMONSTRACAO =
  "Modo demonstração: conecte o banco de dados para gravar as alterações.";

function texto(formData: FormData, campo: string): string | undefined {
  const valor = formData.get(campo);
  if (typeof valor !== "string") return undefined;
  const limpo = valor.trim();
  return limpo === "" ? undefined : limpo;
}

function marcado(formData: FormData, campo: string): boolean {
  return formData.get(campo) !== null;
}

function lista(formData: FormData, campo: string): string[] {
  return formData
    .getAll(campo)
    .filter((v): v is string => typeof v === "string" && v.trim() !== "");
}

function dadosTrabalhador(formData: FormData) {
  return {
    clienteId: texto(formData, "clienteId"),
    nome: texto(formData, "nome"),
    vinculo: texto(formData, "vinculo"),
    funcao: texto(formData, "funcao"),
    cbo: texto(formData, "cbo"),
    salario: texto(formData, "salario"),
    admissao: texto(formData, "admissao"),
    nascimento: texto(formData, "nascimento"),
    genero: texto(formData, "genero"),
    moradia: marcado(formData, "moradia"),
    alimentacao: marcado(formData, "alimentacao"),
    transporte: marcado(formData, "transporte"),
    cestaBasica: marcado(formData, "cestaBasica"),
    gratificacoes: marcado(formData, "gratificacoes"),
    insalubridade: marcado(formData, "insalubridade"),
    periculosidade: marcado(formData, "periculosidade"),
    funcoesHabilitadas: lista(formData, "funcoesHabilitadas"),
  };
}

function colunasTrabalhador(dados: DadosTrabalhador) {
  return {
    cliente_id: dados.clienteId,
    nome: dados.nome,
    vinculo: dados.vinculo,
    funcao: dados.funcao,
    cbo: dados.cbo ?? null,
    salario: dados.salario ?? null,
    admissao: dados.admissao ?? null,
    nascimento: dados.nascimento ?? null,
    genero: dados.genero ?? null,
    moradia: dados.moradia,
    alimentacao: dados.alimentacao,
    transporte: dados.transporte,
    cesta_basica: dados.cestaBasica,
    gratificacoes: dados.gratificacoes,
    insalubridade: dados.insalubridade,
    periculosidade: dados.periculosidade,
    funcoes_habilitadas: dados.funcoesHabilitadas,
  };
}

export async function criarTrabalhador(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const resultado = esquemaTrabalhador.safeParse(dadosTrabalhador(formData));
  if (!resultado.success) {
    return { ok: false, erro: primeiraMensagem(resultado.error) };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: AVISO_DEMONSTRACAO };

  const { error } = await supabase
    .from("trabalhadores")
    .insert(colunasTrabalhador(resultado.data));
  if (error) {
    return { ok: false, erro: `Não foi possível salvar: ${error.message}` };
  }

  revalidatePath("/painel/social");
  return { ok: true, mensagem: `Colaborador ${resultado.data.nome} cadastrado.` };
}

export async function atualizarTrabalhador(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const resultado = esquemaAtualizarTrabalhador.safeParse({
    id: texto(formData, "id"),
    ...dadosTrabalhador(formData),
  });
  if (!resultado.success) {
    return { ok: false, erro: primeiraMensagem(resultado.error) };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: AVISO_DEMONSTRACAO };

  const { id, ...dados } = resultado.data;
  const { error } = await supabase
    .from("trabalhadores")
    .update(colunasTrabalhador(dados))
    .eq("id", id);
  if (error) {
    return { ok: false, erro: `Não foi possível atualizar: ${error.message}` };
  }

  revalidatePath("/painel/social");
  return { ok: true, mensagem: `Dados de ${dados.nome} atualizados.` };
}

export async function desativarTrabalhador(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const resultado = esquemaDesativarTrabalhador.safeParse({
    id: texto(formData, "id"),
  });
  if (!resultado.success) {
    return { ok: false, erro: primeiraMensagem(resultado.error) };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: AVISO_DEMONSTRACAO };

  const { error } = await supabase
    .from("trabalhadores")
    .update({ ativo: false })
    .eq("id", resultado.data.id);
  if (error) {
    return { ok: false, erro: `Não foi possível desativar: ${error.message}` };
  }

  revalidatePath("/painel/social");
  return { ok: true, mensagem: "Colaborador desativado (histórico preservado)." };
}

export async function criarMoradia(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const resultado = esquemaMoradia.safeParse({
    clienteId: texto(formData, "clienteId"),
    nome: texto(formData, "nome"),
    observacao: texto(formData, "observacao"),
  });
  if (!resultado.success) {
    return { ok: false, erro: primeiraMensagem(resultado.error) };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: AVISO_DEMONSTRACAO };

  const { error } = await supabase.from("moradias").insert({
    cliente_id: resultado.data.clienteId,
    nome: resultado.data.nome,
    observacao: resultado.data.observacao ?? null,
  });
  if (error) {
    return { ok: false, erro: `Não foi possível salvar: ${error.message}` };
  }

  revalidatePath("/painel/social");
  return { ok: true, mensagem: `Moradia ${resultado.data.nome} cadastrada.` };
}

export async function adicionarMorador(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const resultado = esquemaMorador.safeParse({
    moradiaId: texto(formData, "moradiaId"),
    trabalhadorId: texto(formData, "trabalhadorId"),
    nome: texto(formData, "nome"),
    parentesco: texto(formData, "parentesco"),
    nascimento: texto(formData, "nascimento"),
    genero: texto(formData, "genero"),
  });
  if (!resultado.success) {
    return { ok: false, erro: primeiraMensagem(resultado.error) };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: AVISO_DEMONSTRACAO };

  const { error } = await supabase.from("moradores").insert({
    moradia_id: resultado.data.moradiaId,
    trabalhador_id: resultado.data.trabalhadorId ?? null,
    nome: resultado.data.nome,
    parentesco: resultado.data.parentesco,
    nascimento: resultado.data.nascimento ?? null,
    genero: resultado.data.genero ?? null,
  });
  if (error) {
    return { ok: false, erro: `Não foi possível salvar: ${error.message}` };
  }

  revalidatePath("/painel/social");
  return { ok: true, mensagem: `Morador ${resultado.data.nome} adicionado.` };
}

export async function registrarParticipacaoTreinamento(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const resultado = esquemaParticipacao.safeParse({
    treinamentoId: texto(formData, "treinamentoId"),
    trabalhadorIds: lista(formData, "trabalhadorIds"),
    realizadoEm: texto(formData, "realizadoEm"),
    observacao: texto(formData, "observacao"),
  });
  if (!resultado.success) {
    return { ok: false, erro: primeiraMensagem(resultado.error) };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: AVISO_DEMONSTRACAO };

  const { data: treinamento, error: erroTreinamento } = await supabase
    .from("treinamentos")
    .select("id, nome, periodicidade_meses")
    .eq("id", resultado.data.treinamentoId)
    .maybeSingle();
  if (erroTreinamento) {
    return {
      ok: false,
      erro: `Não foi possível buscar o treinamento: ${erroTreinamento.message}`,
    };
  }
  if (!treinamento) {
    return { ok: false, erro: "Treinamento não encontrado." };
  }

  const venceEm = calcularVenceEm(
    resultado.data.realizadoEm,
    treinamento.periodicidade_meses,
  );

  const { error } = await supabase.from("treinamento_participacoes").upsert(
    resultado.data.trabalhadorIds.map((trabalhadorId) => ({
      treinamento_id: treinamento.id,
      trabalhador_id: trabalhadorId,
      realizado_em: resultado.data.realizadoEm,
      vence_em: venceEm,
      observacao: resultado.data.observacao ?? null,
    })),
    { onConflict: "treinamento_id,trabalhador_id,realizado_em" },
  );
  if (error) {
    return { ok: false, erro: `Não foi possível registrar: ${error.message}` };
  }

  revalidatePath("/painel/social");
  return {
    ok: true,
    mensagem: `Turma de ${treinamento.nome} registrada — válida até ${venceEm
      .split("-")
      .reverse()
      .join("/")}.`,
  };
}
