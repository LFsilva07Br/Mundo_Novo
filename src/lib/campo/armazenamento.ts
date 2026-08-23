/**
 * Armazenamento persistente do App de Campo.
 *
 * Sem `navigator.storage.persist()`, o navegador pode APAGAR o IndexedDB
 * sozinho quando o aparelho fica sem espaço — levando junto visitas ainda
 * não sincronizadas. Pedir persistência é a única defesa do lado do app.
 *
 * A função nunca lança: navegador sem a API, permissão negada ou erro
 * interno viram apenas um estado que a interface explica ao consultor.
 */

export type EstadoArmazenamento =
  /** O navegador garante que os dados só saem se o consultor mandar. */
  | "persistente"
  /** A API existe, mas o navegador não concedeu — dados podem ser apagados. */
  | "temporario"
  /** Navegador sem a API de persistência (ou fora do navegador). */
  | "indisponivel";

export const TEXTO_ARMAZENAMENTO: Record<EstadoArmazenamento, string> = {
  persistente:
    "Protegido: o navegador não vai apagar as visitas deste aparelho para " +
    "liberar espaço.",
  temporario:
    "Sem proteção: se o aparelho ficar sem espaço, o navegador pode apagar " +
    "visitas ainda não enviadas. Instale o app na tela de início e sincronize " +
    "sempre que houver sinal.",
  indisponivel:
    "Este navegador não informa se os dados estão protegidos. Sincronize " +
    "sempre que houver sinal para não depender do aparelho.",
};

/**
 * Pede ao navegador que o banco local seja persistente. Consulta
 * `persisted()` antes para não repetir o pedido (e não reabrir prompt em
 * navegadores que perguntam ao usuário).
 */
export async function garantirArmazenamentoPersistente(): Promise<EstadoArmazenamento> {
  if (typeof navigator === "undefined" || !navigator.storage) {
    return "indisponivel";
  }
  const { persist, persisted } = navigator.storage;
  if (typeof persist !== "function" || typeof persisted !== "function") {
    return "indisponivel";
  }

  try {
    if (await navigator.storage.persisted()) return "persistente";
  } catch {
    return "indisponivel";
  }

  try {
    return (await navigator.storage.persist()) ? "persistente" : "temporario";
  } catch {
    return "indisponivel";
  }
}
