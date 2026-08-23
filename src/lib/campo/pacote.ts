"use client";

import { obterPacoteLocal, salvarPacoteLocal } from "./banco-local";
import type { PacoteCampo } from "./tipos";

/**
 * Pacote de dados do campo: o consultor baixa clientes, checklist publicado
 * e tarefas ANTES de ir a campo; as telas leem sempre do IndexedDB.
 */

export { obterPacoteLocal } from "./banco-local";

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
  await salvarPacoteLocal(pacote);
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
