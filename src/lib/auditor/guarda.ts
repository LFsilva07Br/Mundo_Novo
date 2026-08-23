import { ehAuditor } from "./sessao";

/**
 * Guarda de escrita do modo auditor.
 *
 * Aplicada no início das Server Actions de mutação mais críticas: se o
 * perfil logado é auditor externo, a ação é recusada com uma mensagem
 * amigável antes de tocar em qualquer dado. É a camada de UX — o RLS do
 * banco segue sendo a proteção real.
 */

export const ERRO_SOMENTE_LEITURA =
  "Modo auditor — somente leitura. Auditores externos podem consultar tudo, mas não alteram nenhum registro.";

export type BloqueioEscrita = { ok: false; erro: string };

/**
 * Devolve o bloqueio quando o usuário logado é auditor; `null` libera a
 * escrita. Uso no início da ação:
 *
 *   const bloqueio = await exigirEscrita();
 *   if (bloqueio) return bloqueio;
 */
export async function exigirEscrita(): Promise<BloqueioEscrita | null> {
  if (await ehAuditor()) {
    return { ok: false, erro: ERRO_SOMENTE_LEITURA };
  }
  return null;
}
