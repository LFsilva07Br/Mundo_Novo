"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, getUsuarioAtual } from "@/lib/supabase/server";
import {
  ehEtapaValida,
  movimentoValido,
  podeFecharCapa,
  ROTULO_ETAPA,
  type EtapaProcesso,
} from "./regras";

/**
 * Server Actions do ciclo de certificação. Toda regra é validada aqui,
 * no servidor — esconder um botão na tela nunca é a única proteção.
 */

export type ResultadoAcao = { ok: true } | { ok: false; erro: string };

const ERRO_DEMO =
  "Modo demonstração: conecte o Supabase para gravar alterações de verdade.";

const CODIGO_CONFLITO_UNICO = "23505";

// ------------------------------------------------------------ workflow

export async function moverEtapa(
  processoId: string,
  novaEtapa: string,
): Promise<ResultadoAcao> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: ERRO_DEMO };

  const entrada = z
    .object({ processoId: z.uuid(), novaEtapa: z.string() })
    .safeParse({ processoId, novaEtapa });
  if (!entrada.success) {
    return { ok: false, erro: "Dados inválidos para mover o cliente de etapa." };
  }
  if (!ehEtapaValida(entrada.data.novaEtapa)) {
    return { ok: false, erro: "Etapa de destino desconhecida." };
  }
  const destino: EtapaProcesso = entrada.data.novaEtapa;

  const { data: processo, error: erroBusca } = await supabase
    .from("processos_certificacao")
    .select("id, etapa, cliente_id, clientes ( nome )")
    .eq("id", entrada.data.processoId)
    .maybeSingle();
  if (erroBusca || !processo) {
    return { ok: false, erro: "Processo de certificação não encontrado." };
  }

  const etapaAtual = processo.etapa as EtapaProcesso;
  if (!movimentoValido(etapaAtual, destino)) {
    return {
      ok: false,
      erro: `Movimento inválido: de "${ROTULO_ETAPA[etapaAtual]}" só é possível avançar ou voltar uma etapa por vez.`,
    };
  }

  const usuario = await getUsuarioAtual();

  const { error: erroAtualiza } = await supabase
    .from("processos_certificacao")
    .update({ etapa: destino, atualizado_por: usuario?.id ?? null })
    .eq("id", processo.id);
  if (erroAtualiza) {
    return { ok: false, erro: `Não foi possível mover o cliente: ${erroAtualiza.message}` };
  }

  const { error: erroMovimento } = await supabase.from("movimentos_workflow").insert({
    processo_id: processo.id,
    de: etapaAtual,
    para: destino,
    autor_id: usuario?.id ?? null,
  });
  if (erroMovimento) {
    return { ok: false, erro: `Movimento não registrado: ${erroMovimento.message}` };
  }

  // Motor de gatilhos por evento: chegou na certificadora → notifica o gestor.
  if (destino === "na_certificadora") {
    const nomeCliente =
      (processo.clientes as unknown as { nome: string } | null)?.nome ??
      "Cliente";
    const { error: erroTarefa } = await supabase.from("tarefas").insert({
      titulo: `Notificar gestor: ${nomeCliente} entrou na certificadora`,
      detalhe:
        "Dossiê enviado à certificadora. Avise o gestor do grupo e acompanhe o retorno da auditoria externa.",
      cliente_id: processo.cliente_id,
      origem: "evento",
      regra: "na-certificadora",
      vence_em: new Date().toISOString().slice(0, 10),
    });
    // Conflito de unicidade (regra + cliente + data) = tarefa já criada; ignora.
    if (erroTarefa && erroTarefa.code !== CODIGO_CONFLITO_UNICO) {
      return { ok: false, erro: `Tarefa de notificação não criada: ${erroTarefa.message}` };
    }
  }

  revalidatePath("/painel/workflow");
  return { ok: true };
}

// ------------------------------------------------------------ contratos

export async function decidirContrato(
  contratoId: string,
  decisao: "aprovado" | "rejeitado",
): Promise<ResultadoAcao> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: ERRO_DEMO };

  const entrada = z
    .object({ contratoId: z.uuid(), decisao: z.enum(["aprovado", "rejeitado"]) })
    .safeParse({ contratoId, decisao });
  if (!entrada.success) {
    return { ok: false, erro: "Dados inválidos para decidir o contrato." };
  }

  const usuario = await getUsuarioAtual();
  if (!usuario) {
    return { ok: false, erro: "Entre no sistema para decidir contratos." };
  }

  // Alçada é permissão: sem a flag, a decisão é recusada no servidor.
  const { data: perfil } = await supabase
    .from("perfis")
    .select("alcada_aprovacao")
    .eq("id", usuario.id)
    .maybeSingle();
  if (!perfil?.alcada_aprovacao) {
    return {
      ok: false,
      erro: "Você não possui alçada de aprovação — peça a decisão a quem tem a permissão.",
    };
  }

  const { error } = await supabase
    .from("contratos")
    .update({
      status: entrada.data.decisao,
      decidido_por: usuario.id,
      decidido_em: new Date().toISOString(),
    })
    .eq("id", entrada.data.contratoId)
    .eq("status", "aguardando_alcada");
  if (error) {
    return { ok: false, erro: `Não foi possível decidir o contrato: ${error.message}` };
  }

  revalidatePath("/painel/contratos");
  return { ok: true };
}

// ---------------------------------------------------------------- CAPAs

export async function concluirAcaoCapa(
  acaoId: string,
  concluida = true,
): Promise<ResultadoAcao> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: ERRO_DEMO };

  const entrada = z.uuid().safeParse(acaoId);
  if (!entrada.success) return { ok: false, erro: "Ação de CAPA inválida." };

  const { error } = await supabase
    .from("capa_acoes")
    .update({
      concluida,
      concluida_em: concluida ? new Date().toISOString().slice(0, 10) : null,
    })
    .eq("id", entrada.data);
  if (error) {
    return { ok: false, erro: `Não foi possível atualizar a ação: ${error.message}` };
  }

  revalidatePath("/painel/capas");
  return { ok: true };
}

export async function fecharCapa(capaId: string): Promise<ResultadoAcao> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: ERRO_DEMO };

  const entrada = z.uuid().safeParse(capaId);
  if (!entrada.success) return { ok: false, erro: "CAPA inválida." };

  const { data: acoes, error: erroAcoes } = await supabase
    .from("capa_acoes")
    .select("id, concluida")
    .eq("capa_id", entrada.data);
  if (erroAcoes) {
    return { ok: false, erro: `Não foi possível conferir as ações: ${erroAcoes.message}` };
  }

  if (!podeFecharCapa(acoes ?? [])) {
    return {
      ok: false,
      erro: "A CAPA só fecha com todas as ações concluídas — ainda há ação pendente.",
    };
  }

  const usuario = await getUsuarioAtual();
  const { error } = await supabase
    .from("capas")
    .update({
      status: "fechada",
      fechada_em: new Date().toISOString(),
      verificador_id: usuario?.id ?? null,
    })
    .eq("id", entrada.data);
  if (error) {
    return { ok: false, erro: `Não foi possível fechar a CAPA: ${error.message}` };
  }

  revalidatePath("/painel/capas");
  return { ok: true };
}

const esquemaNovaCapa = z.object({
  clienteId: z.uuid({ error: "Escolha o cliente da não conformidade." }),
  descricao: z
    .string()
    .trim()
    .min(10, "Descreva a não conformidade (mínimo de 10 caracteres)."),
  severidade: z.enum(["menor", "maior", "critica"], {
    error: "Escolha a severidade.",
  }),
  // NC nunca fica sem plano: responsável e prazo são obrigatórios.
  responsavel: z.string().trim().min(3, "Informe o responsável pelo plano de ação."),
  prazo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe o prazo do plano de ação."),
  origem: z.enum(["campo", "escritorio"], { error: "Escolha a origem." }),
  itemCodigo: z.string().trim().optional(),
  primeiraAcao: z.string().trim().optional(),
});

export type DadosNovaCapa = z.input<typeof esquemaNovaCapa>;

export async function criarCapa(dados: DadosNovaCapa): Promise<ResultadoAcao> {
  const entrada = esquemaNovaCapa.safeParse(dados);
  if (!entrada.success) {
    const primeiro = entrada.error.issues[0];
    return { ok: false, erro: primeiro?.message ?? "Dados da CAPA inválidos." };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: ERRO_DEMO };

  const { data: capa, error } = await supabase
    .from("capas")
    .insert({
      cliente_id: entrada.data.clienteId,
      item_codigo: entrada.data.itemCodigo || null,
      descricao: entrada.data.descricao,
      severidade: entrada.data.severidade,
      responsavel: entrada.data.responsavel,
      prazo: entrada.data.prazo,
      origem: entrada.data.origem,
      status: "aberta",
    })
    .select("id")
    .single();
  if (error || !capa) {
    return {
      ok: false,
      erro: `Não foi possível registrar a CAPA: ${error?.message ?? "erro desconhecido"}`,
    };
  }

  if (entrada.data.primeiraAcao) {
    await supabase.from("capa_acoes").insert({
      capa_id: capa.id,
      ordem: 1,
      descricao: entrada.data.primeiraAcao,
    });
  }

  revalidatePath("/painel/capas");
  return { ok: true };
}
