import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { PacoteCampo, VisitaLocal } from "./tipos";

/**
 * Banco local do App de Campo (IndexedDB via `idb`).
 *
 * Três gavetas:
 * - `pacote`: os dados baixados do servidor (clientes, checklist, tarefas)
 *   e metadados como a data da última sincronização;
 * - `visitas_locais`: visitas em andamento ou concluídas no aparelho,
 *   aguardando envio (rascunho contínuo — cada mudança é gravada aqui);
 * - `config`: preferências do aparelho (ex.: credencial da biometria).
 */

const NOME_BANCO = "mundo-novo-campo";
const VERSAO = 2;

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
  config: {
    key: string;
    value: unknown;
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
      if (!banco.objectStoreNames.contains("config")) {
        banco.createObjectStore("config");
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

/** Dias que uma visita já sincronizada permanece no aparelho por padrão. */
export const DIAS_RETENCAO_PADRAO = 30;

/**
 * Decisão pura da limpeza: a visita pode ser removida quando já foi
 * sincronizada há mais de `diasRetencao` dias (contados de `agora`).
 * Visitas nunca sincronizadas ficam sempre no aparelho.
 */
export function visitaExpirada(
  visita: Pick<VisitaLocal, "sincronizadaEm">,
  diasRetencao: number,
  agora: Date = new Date(),
): boolean {
  if (!visita.sincronizadaEm) return false;
  const sincronizadaEm = new Date(visita.sincronizadaEm).getTime();
  if (Number.isNaN(sincronizadaEm)) return false;
  const limite = agora.getTime() - diasRetencao * 24 * 60 * 60 * 1000;
  return sincronizadaEm < limite;
}

/**
 * Remove do aparelho as visitas já sincronizadas há mais de `diasRetencao`
 * dias, liberando espaço (fotos e assinaturas pesam). Devolve quantas
 * visitas foram removidas.
 */
export async function limparVisitasSincronizadas(
  diasRetencao: number = DIAS_RETENCAO_PADRAO,
): Promise<number> {
  if (!temIndexedDb()) return 0;
  const agora = new Date();
  const visitas = await listarVisitasLocais();
  const expiradas = visitas.filter((v) => visitaExpirada(v, diasRetencao, agora));
  for (const visita of expiradas) {
    await removerVisitaLocal(visita.idLocal);
  }
  return expiradas.length;
}

// ------------------------------------------------------------------
// Configurações do aparelho
// ------------------------------------------------------------------

export async function gravarConfigLocal(
  chave: string,
  valor: unknown,
): Promise<void> {
  if (!temIndexedDb()) return;
  const banco = await abrirBanco();
  await banco.put("config", valor, chave);
}

export async function obterConfigLocal<T>(chave: string): Promise<T | null> {
  if (!temIndexedDb()) return null;
  const banco = await abrirBanco();
  const valor = await banco.get("config", chave);
  return (valor as T | undefined) ?? null;
}

export async function removerConfigLocal(chave: string): Promise<void> {
  if (!temIndexedDb()) return;
  const banco = await abrirBanco();
  await banco.delete("config", chave);
}
