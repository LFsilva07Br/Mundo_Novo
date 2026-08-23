"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  esquemaAtualizarStatusCaso,
  esquemaCaso,
  esquemaPlanoGestao,
  esquemaTratarQueixa,
  esquemaTriagemQueixa,
  podeTratarQueixa,
  primeiraMensagem,
  ROTULOS_STATUS_CASO,
  ROTULOS_TIPO_CASO,
  type MetaPlano,
  type RiscoPlano,
} from "./validacao";

/**
 * Server Actions do módulo Compliance Social.
 * Sem Supabase conectado (modo demonstração) nada é gravado — a ação
 * devolve uma mensagem clara em vez de falhar.
 */

export type EstadoAcao =
  | { ok: true; mensagem: string }
  | { ok: false; erro: string }
  | null;

const AVISO_DEMONSTRACAO =
  "Modo demonstração: conecte o banco de dados para gravar as alterações.";

const ROTA_COMPLIANCE = "/painel/compliance";

function texto(formData: FormData, campo: string): string | undefined {
  const valor = formData.get(campo);
  if (typeof valor !== "string") return undefined;
  const limpo = valor.trim();
  return limpo === "" ? undefined : limpo;
}

function json(formData: FormData, campo: string): unknown {
  const valor = texto(formData, campo);
  if (!valor) return [];
  try {
    return JSON.parse(valor);
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------
// Casos sociais (avaliar-e-tratar, cap. 5.1)
// ------------------------------------------------------------------

export async function criarCaso(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const resultado = esquemaCaso.safeParse({
    clienteId: texto(formData, "clienteId"),
    tipo: texto(formData, "tipo"),
    origem: texto(formData, "origem"),
    descricao: texto(formData, "descricao"),
    remediacao: texto(formData, "remediacao"),
  });
  if (!resultado.success) {
    return { ok: false, erro: primeiraMensagem(resultado.error) };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: AVISO_DEMONSTRACAO };

  const { error } = await supabase.from("casos_sociais").insert({
    cliente_id: resultado.data.clienteId,
    tipo: resultado.data.tipo,
    origem: resultado.data.origem,
    descricao: resultado.data.descricao,
    remediacao: resultado.data.remediacao ?? null,
  });
  if (error) {
    return { ok: false, erro: `Não foi possível salvar: ${error.message}` };
  }

  revalidatePath(ROTA_COMPLIANCE);
  return {
    ok: true,
    mensagem: `Caso de ${ROTULOS_TIPO_CASO[resultado.data.tipo].toLowerCase()} aberto — acompanhe a remediação até o encerramento.`,
  };
}

export async function atualizarStatusCaso(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const resultado = esquemaAtualizarStatusCaso.safeParse({
    id: texto(formData, "id"),
    status: texto(formData, "status"),
    remediacao: texto(formData, "remediacao"),
  });
  if (!resultado.success) {
    return { ok: false, erro: primeiraMensagem(resultado.error) };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: AVISO_DEMONSTRACAO };

  const colunas: { status: string; remediacao?: string } = {
    status: resultado.data.status,
  };
  if (resultado.data.remediacao) {
    colunas.remediacao = resultado.data.remediacao;
  }

  const { error } = await supabase
    .from("casos_sociais")
    .update(colunas)
    .eq("id", resultado.data.id);
  if (error) {
    return { ok: false, erro: `Não foi possível atualizar: ${error.message}` };
  }

  revalidatePath(ROTA_COMPLIANCE);
  return {
    ok: true,
    mensagem: `Caso atualizado para "${ROTULOS_STATUS_CASO[resultado.data.status]}".`,
  };
}

// ------------------------------------------------------------------
// Queixas (canal 1.5.1)
// ------------------------------------------------------------------

export async function triarQueixa(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const resultado = esquemaTriagemQueixa.safeParse({
    queixaId: texto(formData, "queixaId"),
    clienteId: texto(formData, "clienteId"),
    tipo: texto(formData, "tipo"),
    descricao: texto(formData, "descricao"),
  });
  if (!resultado.success) {
    return { ok: false, erro: primeiraMensagem(resultado.error) };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: AVISO_DEMONSTRACAO };

  const { data: caso, error: erroCaso } = await supabase
    .from("casos_sociais")
    .insert({
      cliente_id: resultado.data.clienteId,
      tipo: resultado.data.tipo,
      origem: "queixa",
      descricao: resultado.data.descricao,
    })
    .select("id")
    .single();
  if (erroCaso || !caso) {
    return {
      ok: false,
      erro: `Não foi possível abrir o caso: ${erroCaso?.message ?? "erro desconhecido"}`,
    };
  }

  const { error: erroQueixa } = await supabase
    .from("queixas")
    .update({ caso_id: caso.id, status: "em_analise" })
    .eq("id", resultado.data.queixaId);
  if (erroQueixa) {
    return {
      ok: false,
      erro: `Caso aberto, mas a queixa não foi vinculada: ${erroQueixa.message}`,
    };
  }

  revalidatePath(ROTA_COMPLIANCE);
  return {
    ok: true,
    mensagem: `Queixa convertida em caso de ${ROTULOS_TIPO_CASO[resultado.data.tipo].toLowerCase()} — agora em análise.`,
  };
}

export async function marcarQueixaTratada(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const resultado = esquemaTratarQueixa.safeParse({
    queixaId: texto(formData, "queixaId"),
    justificativa: texto(formData, "justificativa"),
  });
  if (!resultado.success) {
    return { ok: false, erro: primeiraMensagem(resultado.error) };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: AVISO_DEMONSTRACAO };

  const { data: queixa, error: erroQueixa } = await supabase
    .from("queixas")
    .select("id, caso_id, casos_sociais ( status )")
    .eq("id", resultado.data.queixaId)
    .maybeSingle();
  if (erroQueixa) {
    return {
      ok: false,
      erro: `Não foi possível buscar a queixa: ${erroQueixa.message}`,
    };
  }
  if (!queixa) return { ok: false, erro: "Queixa não encontrada." };

  const casoVinculado = queixa.casos_sociais as unknown as {
    status: "aberto" | "em_remediacao" | "encerrado";
  } | null;

  const regra = podeTratarQueixa({
    statusCasoVinculado: casoVinculado?.status,
    justificativa: resultado.data.justificativa,
  });
  if (!regra.ok) return { ok: false, erro: regra.erro };

  const { error } = await supabase
    .from("queixas")
    .update({ status: "tratada" })
    .eq("id", resultado.data.queixaId);
  if (error) {
    return { ok: false, erro: `Não foi possível atualizar: ${error.message}` };
  }

  revalidatePath(ROTA_COMPLIANCE);
  return { ok: true, mensagem: "Queixa marcada como tratada." };
}

// ------------------------------------------------------------------
// Plano de gestão (cap. 1.3)
// ------------------------------------------------------------------

export async function salvarPlanoGestao(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const riscos = json(formData, "riscos");
  const metas = json(formData, "metas");
  if (riscos === null || metas === null) {
    return {
      ok: false,
      erro: "Não foi possível ler os riscos e metas — recarregue a página e tente de novo.",
    };
  }

  const resultado = esquemaPlanoGestao.safeParse({
    clienteId: texto(formData, "clienteId"),
    ano: texto(formData, "ano"),
    riscos,
    metas,
    observacao: texto(formData, "observacao"),
  });
  if (!resultado.success) {
    return { ok: false, erro: primeiraMensagem(resultado.error) };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: AVISO_DEMONSTRACAO };

  const { error } = await supabase.from("planos_gestao").upsert(
    {
      cliente_id: resultado.data.clienteId,
      ano: resultado.data.ano,
      riscos: resultado.data.riscos satisfies RiscoPlano[],
      metas: resultado.data.metas satisfies MetaPlano[],
      observacao: resultado.data.observacao ?? null,
    },
    { onConflict: "cliente_id,ano" },
  );
  if (error) {
    return { ok: false, erro: `Não foi possível salvar: ${error.message}` };
  }

  revalidatePath(ROTA_COMPLIANCE);
  return {
    ok: true,
    mensagem: `Plano de gestão ${resultado.data.ano} salvo com ${resultado.data.riscos.length} risco(s) e ${resultado.data.metas.length} meta(s).`,
  };
}
