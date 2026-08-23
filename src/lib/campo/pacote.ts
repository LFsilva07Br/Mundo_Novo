"use client";

import { contarTarefasNovas, notificar } from "@/lib/notificacoes/local";
import { obterPacoteLocal, salvarPacoteLocal } from "./banco-local";
import type { PacoteCampo } from "./tipos";

/**
 * Pacote de dados do campo: o consultor baixa clientes, checklist publicado
 * e tarefas ANTES de ir a campo; as telas leem sempre do IndexedDB.
 */

export { obterPacoteLocal } from "./banco-local";

/**
 * Avisa no aparelho quando o pacote novo trouxe alertas que não existiam
 * no pacote anterior. Nunca quebra o download — notificação é cortesia.
 */
async function avisarTarefasNovas(
  anterior: PacoteCampo | null,
  atual: PacoteCampo,
): Promise<void> {
  try {
    const novas = contarTarefasNovas(anterior?.tarefas, atual.tarefas);
    if (novas === 0) return;
    await notificar(
      `${novas} novo${novas === 1 ? "" : "s"} alerta${novas === 1 ? "" : "s"} da Mundo Novo`,
      "Toque para ver os alertas atualizados no app de campo.",
    );
  } catch {
    // sem permissão ou sem suporte — segue o fluxo normalmente
  }
}

/** Baixa o pacote do servidor e grava no IndexedDB. Exige internet. */
export async function baixarPacote(): Promise<PacoteCampo> {
  const resposta = await fetch("/api/campo/pacote", { cache: "no-store" });
  if (!resposta.ok) {
    throw new Error(
      resposta.status === 401
        ? "Sessão expirada — entre novamente para baixar os dados."
        : "Não foi possível baixar o pacote de dados. Tente novamente.",
    );
  }
  const pacote = (await resposta.json()) as PacoteCampo;
  const anterior = await obterPacoteLocal();
  await salvarPacoteLocal(pacote);
  void avisarTarefasNovas(anterior, pacote);
  return pacote;
}

/**
 * Pacote para as telas: devolve o que está no aparelho; se não houver nada
 * e existir internet, baixa na hora (primeiro acesso).
 */
export async function obterOuBaixarPacote(): Promise<PacoteCampo | null> {
  const local = await obterPacoteLocal();
  if (local) return local;
  if (typeof navigator !== "undefined" && !navigator.onLine) return null;
  try {
    return await baixarPacote();
  } catch {
    return null;
  }
}
