/**
 * Regras de negócio da comercialização de café (funções puras, testáveis):
 * - Saldo disponível do lote = sacas do lote − sacas em negociações fechadas;
 * - Negociação nunca pode passar do saldo disponível;
 * - Negociação fechada que zera o saldo muda o lote para "negociado";
 * - Lote só é marcado como entregue com ao menos uma negociação fechada;
 * - KPIs do painel (estoque, negociadas na safra, preço médio, receita).
 */

export const STATUS_LOTE = ["estoque", "negociado", "entregue"] as const;
export type StatusLote = (typeof STATUS_LOTE)[number];

export const ROTULO_STATUS_LOTE: Record<StatusLote, string> = {
  estoque: "Em estoque",
  negociado: "Negociado",
  entregue: "Entregue",
};

export const STATUS_NEGOCIACAO = ["proposta", "fechada", "cancelada"] as const;
export type StatusNegociacao = (typeof STATUS_NEGOCIACAO)[number];

export const ROTULO_STATUS_NEGOCIACAO: Record<StatusNegociacao, string> = {
  proposta: "Proposta",
  fechada: "Fechada",
  cancelada: "Cancelada",
};

type NegociacaoParaSaldo = { sacas: number; status: StatusNegociacao };
type NegociacaoParaPreco = NegociacaoParaSaldo & {
  precoPorSaca: number;
  data: string;
};

const formatoSacas = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});
const formatoPreco = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatarSacas(valor: number): string {
  return formatoSacas.format(valor);
}

export function formatarPreco(valor: number): string {
  return formatoPreco.format(valor);
}

/** Total de sacas comprometidas em negociações fechadas. */
export function sacasFechadas(negociacoes: NegociacaoParaSaldo[]): number {
  return negociacoes
    .filter((n) => n.status === "fechada")
    .reduce((total, n) => total + n.sacas, 0);
}

/** Saldo do lote livre para novas negociações (propostas não abatem saldo). */
export function saldoDisponivel(
  sacasDoLote: number,
  negociacoes: NegociacaoParaSaldo[],
): number {
  return sacasDoLote - sacasFechadas(negociacoes);
}

/**
 * Valida a quantidade de sacas de uma negociação contra o saldo do lote.
 * Retorna a mensagem de erro (linguagem de negócio) ou null quando válida.
 */
export function validarSacasNegociacao(
  sacasPedidas: number,
  sacasDoLote: number,
  negociacoes: NegociacaoParaSaldo[],
): string | null {
  if (!Number.isFinite(sacasPedidas) || sacasPedidas <= 0) {
    return "A quantidade de sacas da negociação deve ser maior que zero.";
  }
  const saldo = saldoDisponivel(sacasDoLote, negociacoes);
  if (sacasPedidas > saldo) {
    return `Saldo insuficiente: o lote tem ${formatarSacas(saldo)} sacas disponíveis (${formatarSacas(sacasDoLote)} no lote − ${formatarSacas(sacasFechadas(negociacoes))} já fechadas) e a negociação pede ${formatarSacas(sacasPedidas)}.`;
  }
  return null;
}

/**
 * Status do lote após qualquer mudança nas negociações:
 * saldo zerado por negociações fechadas → "negociado";
 * saldo liberado (ex.: fechamento cancelado) → volta para "estoque".
 * Lote entregue não muda mais de status por negociação.
 */
export function statusLoteAposNegociacoes(
  statusAtual: StatusLote,
  sacasDoLote: number,
  negociacoes: NegociacaoParaSaldo[],
): StatusLote {
  if (statusAtual === "entregue") return "entregue";
  const fechadas = sacasFechadas(negociacoes);
  if (fechadas > 0 && saldoDisponivel(sacasDoLote, negociacoes) <= 0) {
    return "negociado";
  }
  return "estoque";
}

/** A entrega só pode ser registrada com ao menos uma negociação fechada. */
export function podeMarcarEntregue(
  negociacoes: NegociacaoParaSaldo[],
): boolean {
  return negociacoes.some((n) => n.status === "fechada");
}

/** O lote não pode ser reduzido abaixo do que já foi negociado (fechadas). */
export function podeReduzirSacas(
  novasSacas: number,
  negociacoes: NegociacaoParaSaldo[],
): boolean {
  return novasSacas >= sacasFechadas(negociacoes);
}

function negociacoesAtivas(
  negociacoes: NegociacaoParaPreco[],
): NegociacaoParaPreco[] {
  return negociacoes.filter((n) => n.status !== "cancelada");
}

/** Melhor preço por saca entre as negociações ativas (propostas e fechadas). */
export function melhorPreco(negociacoes: NegociacaoParaPreco[]): number | null {
  const ativas = negociacoesAtivas(negociacoes);
  if (ativas.length === 0) return null;
  return Math.max(...ativas.map((n) => n.precoPorSaca));
}

/** Preço da negociação ativa mais recente (pela data da negociação). */
export function ultimoPreco(negociacoes: NegociacaoParaPreco[]): number | null {
  const ativas = negociacoesAtivas(negociacoes);
  if (ativas.length === 0) return null;
  const maisRecente = [...ativas].sort((a, b) =>
    a.data.localeCompare(b.data),
  )[ativas.length - 1];
  return maisRecente.precoPorSaca;
}

// ------------------------------------------------------------------
// KPIs do painel de comercialização
// ------------------------------------------------------------------

export type LoteParaKpi = {
  status: StatusLote;
  sacas: number;
  safraRotulo: string | null;
  negociacoes: NegociacaoParaPreco[];
};

export type KpisComercializacao = {
  /** Soma do saldo disponível dos lotes não entregues. */
  sacasEmEstoque: number;
  /** Sacas em negociações fechadas dos lotes da safra mais recente. */
  sacasNegociadasSafra: number;
  /** Rótulo da safra usada no KPI de negociadas (a mais recente com lote). */
  safraDasNegociacoes: string | null;
  /** Preço médio ponderado por saca das negociações fechadas (todas). */
  precoMedioFechadas: number | null;
  /** Receita estimada: soma de sacas × preço das negociações fechadas. */
  receitaEstimada: number;
};

export function calcularKpis(lotes: LoteParaKpi[]): KpisComercializacao {
  const sacasEmEstoque = lotes
    .filter((l) => l.status !== "entregue")
    .reduce((total, l) => total + saldoDisponivel(l.sacas, l.negociacoes), 0);

  const safraDasNegociacoes =
    lotes
      .map((l) => l.safraRotulo)
      .filter((rotulo): rotulo is string => Boolean(rotulo))
      .sort()
      .at(-1) ?? null;

  const lotesDaSafra = safraDasNegociacoes
    ? lotes.filter((l) => l.safraRotulo === safraDasNegociacoes)
    : lotes;
  const sacasNegociadasSafra = lotesDaSafra.reduce(
    (total, l) => total + sacasFechadas(l.negociacoes),
    0,
  );

  const fechadas = lotes.flatMap((l) =>
    l.negociacoes.filter((n) => n.status === "fechada"),
  );
  const totalSacasFechadas = fechadas.reduce((total, n) => total + n.sacas, 0);
  const receitaEstimada = fechadas.reduce(
    (total, n) => total + n.sacas * n.precoPorSaca,
    0,
  );
  const precoMedioFechadas =
    totalSacasFechadas > 0 ? receitaEstimada / totalSacasFechadas : null;

  return {
    sacasEmEstoque,
    sacasNegociadasSafra,
    safraDasNegociacoes,
    precoMedioFechadas,
    receitaEstimada,
  };
}
