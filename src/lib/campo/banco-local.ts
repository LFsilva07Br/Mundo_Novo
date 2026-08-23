import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { PacoteCampo, VisitaLocal } from "./tipos";

/**
 * Banco local do App de Campo (IndexedDB via `idb`).
 *
 * Duas gavetas:
 * - `pacote`: os dados baixados do servidor (clientes, checklist, tarefas)
 *   e metadados como a data da última sincronização;
 * - `visitas_locais`: visitas em andamento ou concluídas no aparelho,
 *   aguardando envio (rascunho contínuo — cada mudança é gravada aqui).
 */

const NOME_BANCO = "mundo-novo-campo";
const VERSAO = 1;

const CHAVE_PACOTE = "atual";
const CHAVE_ULTIMA_SINCRONIZACAO = "ultima-sincronizacao";

interface EsquemaCampo extends DBSchema {
  pacote: {
    key: string;
    value: PacoteCampo | string;
  };
  visitas_locais: {
    key: string;
    value: VisitaLocal;
  };
}

/** IndexedDB só existe no navegador — no servidor tudo vira no-op. */
function temIndexedDb(): boolean {
  return typeof indexedDB !== "undefined";
}

let bancoPromise: Promise<IDBPDatabase<EsquemaCampo>> | null = null;

function abrirBanco(): Promise<IDBPDatabase<EsquemaCampo>> {
  bancoPromise ??= openDB<EsquemaCampo>(NOME_BANCO, VERSAO, {
    upgrade(banco) {
      if (!banco.objectStoreNames.contains("pacote")) {
        banco.createObjectStore("pacote");
      }
      if (!banco.objectStoreNames.contains("visitas_locais")) {
        banco.createObjectStore("visitas_locais", { keyPath: "idLocal" });
      }
    },
  });
  return bancoPromise;
}

// ------------------------------------------------------------------
// Pacote de dados
// ------------------------------------------------------------------

export async function salvarPacoteLocal(pacote: PacoteCampo): Promise<void> {
  if (!temIndexedDb()) return;
  const banco = await abrirBanco();
  await banco.put("pacote", pacote, CHAVE_PACOTE);
}

export async function obterPacoteLocal(): Promise<PacoteCampo | null> {
  if (!temIndexedDb()) return null;
  const banco = await abrirBanco();
  const pacote = await banco.get("pacote", CHAVE_PACOTE);
  return (pacote as PacoteCampo | undefined) ?? null;
}

export async function gravarUltimaSincronizacao(quando: string): Promise<void> {
  if (!temIndexedDb()) return;
  const banco = await abrirBanco();
  await banco.put("pacote", quando, CHAVE_ULTIMA_SINCRONIZACAO);
}

export async function obterUltimaSincronizacao(): Promise<string | null> {
  if (!temIndexedDb()) return null;
  const banco = await abrirBanco();
  const valor = await banco.get("pacote", CHAVE_ULTIMA_SINCRONIZACAO);
  return typeof valor === "string" ? valor : null;
}

// ------------------------------------------------------------------
// Visitas locais (fila offline)
// ------------------------------------------------------------------

export async function salvarVisitaLocal(visita: VisitaLocal): Promise<void> {
  if (!temIndexedDb()) return;
  const banco = await abrirBanco();
  await banco.put("visitas_locais", visita);
}

export async function obterVisitaLocal(
  idLocal: string,
): Promise<VisitaLocal | null> {
  if (!temIndexedDb()) return null;
  const banco = await abrirBanco();
  return (await banco.get("visitas_locais", idLocal)) ?? null;
}

export async function listarVisitasLocais(): Promise<VisitaLocal[]> {
  if (!temIndexedDb()) return [];
  const banco = await abrirBanco();
  const visitas = await banco.getAll("visitas_locais");
  return visitas.sort((a, b) => b.iniciadaEm.localeCompare(a.iniciadaEm));
}

export async function removerVisitaLocal(idLocal: string): Promise<void> {
  if (!temIndexedDb()) return;
  const banco = await abrirBanco();
  await banco.delete("visitas_locais", idLocal);
}
