/**
 * Cliente ativo do painel, guardado em cookie.
 *
 * Por que cookie e não localStorage: o cookie viaja junto com a navegação,
 * então uma tela do servidor consegue abrir já no cliente certo, sem
 * piscar a tela do cliente errado antes do JavaScript rodar.
 *
 * Como usar:
 *
 * - **Componente cliente** (ex.: `<SeletorCliente>`): chame
 *   `gravarClienteSelecionado(id)` ao trocar de cliente. O cookie é escrito
 *   e um evento é disparado para o cabeçalho do painel atualizar o nome.
 * - **Server Component / Server Action**: leia com
 *   `(await cookies()).get(COOKIE_CLIENTE_SELECIONADO)?.value` (`next/headers`)
 *   e passe por `resolverClienteSelecionado` para nunca confiar num id
 *   que saiu da carteira. Este arquivo não importa `next/headers` de
 *   propósito — assim ele continua utilizável dos dois lados.
 */

export const COOKIE_CLIENTE_SELECIONADO = "mundo-novo-cliente";

/** 180 dias: a seleção sobrevive às férias de quem cuida da carteira. */
export const VALIDADE_COOKIE_SEGUNDOS = 60 * 60 * 24 * 180;

/** Disparado no `window` quando o cliente ativo muda. */
export const EVENTO_CLIENTE_SELECIONADO = "mundo-novo:cliente-selecionado";

/** Lê o valor do cookie a partir de um `document.cookie` (ou header Cookie). */
export function lerCookie(
  cookies: string,
  nome: string = COOKIE_CLIENTE_SELECIONADO,
): string | null {
  for (const parte of cookies.split(";")) {
    const separador = parte.indexOf("=");
    if (separador < 0) continue;
    if (parte.slice(0, separador).trim() !== nome) continue;
    try {
      return decodeURIComponent(parte.slice(separador + 1).trim()) || null;
    } catch {
      // Cookie corrompido por outra origem: vale o mesmo que não ter cookie.
      return null;
    }
  }
  return null;
}

/** Monta o valor a atribuir em `document.cookie`. */
export function montarCookie(
  clienteId: string,
  nome: string = COOKIE_CLIENTE_SELECIONADO,
): string {
  return `${nome}=${encodeURIComponent(clienteId)}; path=/; max-age=${VALIDADE_COOKIE_SEGUNDOS}; samesite=lax`;
}

/**
 * Decide qual cliente está ativo.
 * O id salvo só vale se ainda existir na carteira — cliente removido ou
 * fora do alcance do usuário cai no primeiro da lista (ou em nenhum).
 */
export function resolverClienteSelecionado<T extends { id: string }>(
  clienteIdSalvo: string | null | undefined,
  clientes: readonly T[],
  clienteIdPreferido?: string | null,
): T | null {
  const preferido = clienteIdPreferido
    ? clientes.find((c) => c.id === clienteIdPreferido)
    : undefined;
  if (preferido) return preferido;

  const salvo = clienteIdSalvo
    ? clientes.find((c) => c.id === clienteIdSalvo)
    : undefined;
  if (salvo) return salvo;

  return clientes[0] ?? null;
}

/** Id do cliente ativo segundo o cookie do navegador. */
export function lerClienteSelecionado(): string | null {
  if (typeof document === "undefined") return null;
  return lerCookie(document.cookie);
}

/** Grava o cliente ativo e avisa quem exibe o nome dele. */
export function gravarClienteSelecionado(clienteId: string): void {
  if (typeof document === "undefined") return;
  document.cookie = montarCookie(clienteId);
  window.dispatchEvent(
    new CustomEvent(EVENTO_CLIENTE_SELECIONADO, { detail: clienteId }),
  );
}
