import { DISPAROS_PADRAO_DIAS } from "./vencimentos";

/**
 * Régua de disparos do motor por data: padrão global validado com a
 * Mundo Novo (90/60/30/15/7) somado aos marcos longos (180/150/120),
 * com override por cliente previsto no modelo.
 */
export const REGUA_DISPAROS = [...DISPAROS_PADRAO_DIAS, 15, 7] as const;

/**
 * Menor marco da régua já cruzado para um vencimento a `dias` de distância.
 * Retorna null se nenhum marco foi atingido (vencimento ainda longe).
 * Vencimentos passados (dias < 0) sempre retornam o menor marco — o
 * alerta persiste até a pendência ser resolvida.
 */
export function marcoAtingido(
  dias: number,
  regua: readonly number[] = REGUA_DISPAROS,
): number | null {
  const atingidos = regua.filter((marco) => dias <= marco);
  return atingidos.length ? Math.min(...atingidos) : null;
}
