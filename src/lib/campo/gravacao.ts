import { salvarVisitaLocal } from "./banco-local";
import type { VisitaLocal } from "./tipos";

/**
 * Porta única de gravação da visita no aparelho.
 *
 * Antes, cada tela chamava `void salvarVisitaLocal(...)`: se o IndexedDB
 * estivesse cheio, bloqueado pelo navegador anônimo ou corrompido, a falha
 * sumia e o consultor seguia respondendo o checklist achando que estava tudo
 * salvo. Aqui a falha SEMPRE vira uma mensagem para a tela mostrar.
 */

export const MENSAGEM_FALHA_GRAVACAO =
  "Não foi possível salvar no aparelho — anote os dados desta visita antes " +
  "de fechar o app e avise o escritório.";

export type ResultadoGravacao =
  | { ok: true }
  | { ok: false; mensagem: string; detalhe: string | null };

/** Detalhe técnico curto (nome do erro) para o consultor repassar ao suporte. */
function detalharErro(excecao: unknown): string | null {
  if (excecao instanceof Error) {
    const nome = excecao.name || "Erro";
    return excecao.message ? `${nome}: ${excecao.message}` : nome;
  }
  return null;
}

/**
 * Grava a visita e devolve o resultado — nunca lança e nunca falha em
 * silêncio. Quem chama é obrigado a decidir o que fazer com o `ok: false`.
 */
export async function gravarVisita(
  visita: VisitaLocal,
): Promise<ResultadoGravacao> {
  try {
    await salvarVisitaLocal(visita);
    return { ok: true };
  } catch (excecao) {
    return {
      ok: false,
      mensagem: MENSAGEM_FALHA_GRAVACAO,
      detalhe: detalharErro(excecao),
    };
  }
}
