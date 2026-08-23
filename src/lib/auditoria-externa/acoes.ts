"use server";

import { revalidatePath } from "next/cache";
import { criarCapa } from "@/lib/certificacao/acoes";
import type { StatusCapa } from "@/lib/certificacao/consultas";
import { createClient } from "@/lib/supabase/server";
import { podeFecharAchado } from "./regras";
import {
  esquemaAchado,
  esquemaAtualizarStatusAchado,
  primeiraMensagem,
  type DadosAchado,
} from "./validacao";

/**
 * Server Actions da gestão de auditoria externa. Toda regra é validada aqui,
 * no servidor — esconder um botão na tela nunca é a única proteção.
 */

export type ResultadoAcao = { ok: true } | { ok: false; erro: string };

const ERRO_DEMO =
  "Modo demonstração: conecte o Supabase para gravar alterações de verdade.";

/**
 * Registra um achado da certificadora. Com "criar CAPA interna vinculada",
 * a CAPA nasce junto (mesma regra do sistema: NC nunca fica sem plano) e o
 * achado sai vinculado a ela.
 */
export async function registrarAchado(
  dados: DadosAchado,
): Promise<ResultadoAcao> {
  const entrada = esquemaAchado.safeParse(dados);
  if (!entrada.success) {
    return { ok: false, erro: primeiraMensagem(entrada.error) };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: ERRO_DEMO };

  let capaId: string | null = null;
  if (entrada.data.criarCapa) {
    const capa = await criarCapa({
      clienteId: entrada.data.clienteId,
      descricao: entrada.data.descricao,
      severidade: entrada.data.severidade,
      responsavel: entrada.data.responsavelCapa ?? "",
      prazo: entrada.data.prazo,
      origem: "escritorio",
      itemCodigo: entrada.data.itemNorma,
    });
    if (!capa.ok) return capa;
    capaId = capa.id ?? null;
  }

  const { error } = await supabase.from("achados_externos").insert({
    cliente_id: entrada.data.clienteId,
    certificadora: entrada.data.certificadora,
    codigo: entrada.data.codigo,
    item_norma: entrada.data.itemNorma || null,
    descricao: entrada.data.descricao,
    severidade: entrada.data.severidade,
    prazo: entrada.data.prazo,
    status: "aberta",
    capa_id: capaId,
    encontrado_em: entrada.data.encontradoEm,
  });
  if (error) {
    return {
      ok: false,
      erro: `Não foi possível registrar o achado: ${error.message}`,
    };
  }

  revalidatePath("/painel/auditoria-externa");
  return { ok: true };
}

/**
 * Atualiza o status do achado. Fechar só é permitido quando a CAPA interna
 * vinculada (se houver) já estiver fechada.
 */
export async function atualizarStatusAchado(
  achadoId: string,
  status: string,
): Promise<ResultadoAcao> {
  const entrada = esquemaAtualizarStatusAchado.safeParse({ achadoId, status });
  if (!entrada.success) {
    return { ok: false, erro: primeiraMensagem(entrada.error) };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: ERRO_DEMO };

  const { data: achado, error: erroBusca } = await supabase
    .from("achados_externos")
    .select("id, status, capa:capas ( status )")
    .eq("id", entrada.data.achadoId)
    .maybeSingle();
  if (erroBusca || !achado) {
    return { ok: false, erro: "Achado da certificadora não encontrado." };
  }

  if (entrada.data.status === "fechada") {
    const capa = achado.capa as unknown as { status: StatusCapa } | null;
    const regra = podeFecharAchado(capa);
    if (!regra.ok) return regra;
  }

  const { error } = await supabase
    .from("achados_externos")
    .update({ status: entrada.data.status })
    .eq("id", entrada.data.achadoId);
  if (error) {
    return {
      ok: false,
      erro: `Não foi possível atualizar o achado: ${error.message}`,
    };
  }

  revalidatePath("/painel/auditoria-externa");
  return { ok: true };
}
