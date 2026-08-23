/**
 * Regras puras do módulo Agroquímicos (Fase 10).
 *
 * A NC mais comum da carteira envolve defensivos: produto da lista de
 * banidos da Rainforest Alliance e aplicador sem treinamento NR-31 válido.
 * Estas funções não tocam banco nem rede — são usadas nas consultas, nas
 * Server Actions e nos testes.
 */

export const ALERTA_PRODUTO_PROIBIDO = "PRODUTO PROIBIDO PELA RA";
export const ALERTA_SEM_TREINAMENTO =
  "Aplicador sem treinamento NR-31 válido";

/** Nome do treinamento que habilita a aplicação de defensivos (NR-31). */
export const TREINAMENTO_DEFENSIVOS = "Defensivos";

export type ParticipacaoTreinamento = {
  /** Data em que a turma foi realizada (ISO aaaa-mm-dd). */
  realizadoEm: string;
  /** Vencimento da participação (ISO aaaa-mm-dd) — null quando não expira. */
  venceEm: string | null;
};

export type SituacaoTreinamento = "valido" | "vencido" | "sem-registro";

/**
 * Situação do treinamento do aplicador NA DATA da aplicação:
 * - "valido": alguma participação realizada até a data e ainda não vencida;
 * - "vencido": houve participação, mas nenhuma cobria a data;
 * - "sem-registro": o aplicador nunca participou do treinamento.
 *
 * Comparações por string ISO (aaaa-mm-dd ordena igual a data).
 */
export function situacaoTreinamentoNaData(
  participacoes: ParticipacaoTreinamento[],
  dataAplicacao: string,
): SituacaoTreinamento {
  if (participacoes.length === 0) return "sem-registro";

  const cobre = participacoes.some(
    (p) =>
      p.realizadoEm <= dataAplicacao &&
      (p.venceEm === null || p.venceEm >= dataAplicacao),
  );
  return cobre ? "valido" : "vencido";
}

/** O aplicador tinha treinamento NR-31 válido na data da aplicação? */
export function treinamentoValidoNaData(
  participacoes: ParticipacaoTreinamento[],
  dataAplicacao: string,
): boolean {
  return situacaoTreinamentoNaData(participacoes, dataAplicacao) === "valido";
}

/**
 * Avalia uma aplicação de defensivo e devolve a lista de alertas de
 * conformidade — vazia quando está tudo certo.
 */
export function avaliarAplicacao({
  produtoProibido,
  treinamentoValido,
}: {
  produtoProibido: boolean;
  treinamentoValido: boolean;
}): string[] {
  const alertas: string[] = [];
  if (produtoProibido) alertas.push(ALERTA_PRODUTO_PROIBIDO);
  if (!treinamentoValido) alertas.push(ALERTA_SEM_TREINAMENTO);
  return alertas;
}
