/**
 * Regras de negócio do financeiro da consultoria (funções puras, testáveis):
 * - Status da fatura pela data: paga (tem pagamento), atrasada (venceu e não
 *   foi paga) ou em aberto (ainda dentro do prazo — inclusive no dia);
 * - Competências esperadas de um contrato, mês a mês desde o início,
 *   com o primeiro mês proporcional (pró-rata) aos dias de contrato;
 * - Resumo financeiro do mês (a receber, recebido, atrasado, inadimplência);
 * - Recebimentos dos últimos meses para o gráfico do painel.
 */

export const STATUS_FATURA = ["em_aberto", "paga", "atrasada"] as const;
export type StatusFatura = (typeof STATUS_FATURA)[number];

export const ROTULO_STATUS_FATURA: Record<StatusFatura, string> = {
  em_aberto: "Em aberto",
  paga: "Paga",
  atrasada: "Atrasada",
};

/** Contrato de mensalidade da consultoria com um cliente da carteira. */
export type ContratoFinanceiro = {
  id: string;
  clienteId: string;
  clienteNome: string;
  descricao: string;
  valorMensal: number;
  /** Dia do mês em que a mensalidade vence (1 a 28). */
  diaVencimento: number;
  /** Início da vigência (AAAA-MM-DD). */
  inicio: string;
  /** Fim da vigência (AAAA-MM-DD) — vazio para contrato sem prazo. */
  fim?: string;
  ativo: boolean;
};

/** Fatura (mensalidade) de uma competência do contrato. */
export type Fatura = {
  id: string;
  contratoId: string;
  clienteId: string;
  clienteNome: string;
  /** Competência no formato AAAA-MM. */
  competencia: string;
  valor: number;
  /** Data de vencimento (AAAA-MM-DD). */
  vencimento: string;
  /** Data do pagamento (AAAA-MM-DD) — vazia enquanto não paga. */
  pagoEm?: string;
  status: StatusFatura;
};

const formatoMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatarMoeda(valor: number): string {
  return formatoMoeda.format(valor);
}

export function formatarPercentual(valor: number): string {
  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(valor)}%`;
}

const MESES_ABREVIADOS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

/** "2026-08" → "ago/2026" (rótulo curto de competência). */
export function rotuloCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split("-");
  return `${MESES_ABREVIADOS[Number(mes) - 1] ?? mes}/${ano}`;
}

/** "2026-08-05" → "05/08/2026". */
export function formatarData(data: string): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function arredondarCentavos(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/** Quantidade de dias do mês de uma competência ("2026-02" → 28). */
export function diasNoMes(competencia: string): number {
  const [ano, mes] = competencia.split("-").map(Number);
  return new Date(ano, mes, 0).getDate();
}

/** Competência seguinte ("2026-12" → "2027-01"). */
export function proximaCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split("-").map(Number);
  const proximoAno = mes === 12 ? ano + 1 : ano;
  const proximoMes = mes === 12 ? 1 : mes + 1;
  return `${proximoAno}-${String(proximoMes).padStart(2, "0")}`;
}

/** Data de vencimento dentro da competência, sem estourar o fim do mês. */
export function vencimentoDaCompetencia(
  competencia: string,
  diaVencimento: number,
): string {
  const dia = Math.min(diaVencimento, diasNoMes(competencia));
  return `${competencia}-${String(dia).padStart(2, "0")}`;
}

// ------------------------------------------------------------------
// Status da fatura
// ------------------------------------------------------------------

type FaturaParaStatus = { vencimento: string; pagoEm?: string | null };

/**
 * Status da fatura na data de referência:
 * paga quando há pagamento (mesmo que tenha sido depois do vencimento);
 * atrasada quando venceu e não foi paga; em aberto no restante —
 * no próprio dia do vencimento a fatura ainda está em aberto.
 */
export function statusFatura(
  fatura: FaturaParaStatus,
  hoje: string,
): StatusFatura {
  if (fatura.pagoEm) return "paga";
  return fatura.vencimento < hoje ? "atrasada" : "em_aberto";
}

// ------------------------------------------------------------------
// Pró-rata e competências esperadas
// ------------------------------------------------------------------

/**
 * Mensalidade do primeiro mês, proporcional aos dias de contrato:
 * valor × (dias do início ao fim do mês, inclusive) ÷ dias do mês.
 * Contrato iniciado no dia 1º paga o mês cheio.
 */
export function mensalidadeProRata(valorMensal: number, inicio: string): number {
  const diaInicio = Number(inicio.slice(8, 10));
  const totalDias = diasNoMes(inicio.slice(0, 7));
  const diasCobertos = totalDias - diaInicio + 1;
  return arredondarCentavos((valorMensal * diasCobertos) / totalDias);
}

export type ContratoParaCompetencias = Pick<
  ContratoFinanceiro,
  "valorMensal" | "diaVencimento" | "inicio" | "fim"
>;

export type FaturaEsperada = {
  competencia: string;
  valor: number;
  vencimento: string;
};

/**
 * Faturas esperadas do contrato, mês a mês, do início até a competência
 * limite (`ate`, AAAA-MM) — respeitando o fim da vigência quando houver.
 * O primeiro mês sai proporcional (pró-rata); se o dia de vencimento cair
 * antes do início do contrato, a primeira fatura vence no fim do mês.
 */
export function gerarCompetencias(
  contrato: ContratoParaCompetencias,
  ate: string,
): FaturaEsperada[] {
  const primeira = contrato.inicio.slice(0, 7);
  const fimVigencia = contrato.fim?.slice(0, 7);
  const limite = fimVigencia && fimVigencia < ate ? fimVigencia : ate;

  const faturas: FaturaEsperada[] = [];
  for (
    let competencia = primeira;
    competencia <= limite;
    competencia = proximaCompetencia(competencia)
  ) {
    const ehPrimeira = competencia === primeira;
    let vencimento = vencimentoDaCompetencia(
      competencia,
      contrato.diaVencimento,
    );
    if (ehPrimeira && vencimento < contrato.inicio) {
      vencimento = vencimentoDaCompetencia(competencia, 31);
    }
    faturas.push({
      competencia,
      valor: ehPrimeira
        ? mensalidadeProRata(contrato.valorMensal, contrato.inicio)
        : contrato.valorMensal,
      vencimento,
    });
  }
  return faturas;
}

// ------------------------------------------------------------------
// Resumo financeiro (KPIs do painel)
// ------------------------------------------------------------------

export type FaturaParaResumo = {
  clienteId: string;
  clienteNome: string;
  competencia: string;
  valor: number;
  vencimento: string;
  pagoEm?: string | null;
};

export type InadimplenciaCliente = {
  clienteId: string;
  clienteNome: string;
  /** Total das faturas já vencidas (pagas ou não). */
  valorVencido: number;
  /** Total das faturas vencidas e ainda não pagas. */
  valorAtrasado: number;
  /** valorAtrasado ÷ valorVencido, em %. */
  percentual: number;
};

export type ResumoFinanceiro = {
  /** Faturas do mês corrente ainda não pagas. */
  aReceberNoMes: number;
  /** Pagamentos que entraram dentro do mês corrente. */
  recebidoNoMes: number;
  /** Total vencido e não pago, de qualquer competência. */
  atrasadoTotal: number;
  /** atrasadoTotal ÷ total já vencido, em %. */
  inadimplenciaPercentual: number;
  /** Clientes com fatura vencida, os mais atrasados primeiro. */
  porCliente: InadimplenciaCliente[];
};

function percentual(parte: number, todo: number): number {
  if (todo <= 0) return 0;
  return Math.round((parte / todo) * 1000) / 10;
}

export function resumoFinanceiro(
  faturas: FaturaParaResumo[],
  hoje: string,
): ResumoFinanceiro {
  const mesAtual = hoje.slice(0, 7);
  let aReceberNoMes = 0;
  let recebidoNoMes = 0;
  let atrasadoTotal = 0;
  let vencidoTotal = 0;
  const porCliente = new Map<string, InadimplenciaCliente>();

  for (const fatura of faturas) {
    const status = statusFatura(fatura, hoje);

    if (fatura.competencia === mesAtual && status !== "paga") {
      aReceberNoMes += fatura.valor;
    }
    if (fatura.pagoEm && fatura.pagoEm.slice(0, 7) === mesAtual) {
      recebidoNoMes += fatura.valor;
    }

    const jaVenceu = fatura.vencimento < hoje;
    if (!jaVenceu) continue;

    vencidoTotal += fatura.valor;
    const item = porCliente.get(fatura.clienteId) ?? {
      clienteId: fatura.clienteId,
      clienteNome: fatura.clienteNome,
      valorVencido: 0,
      valorAtrasado: 0,
      percentual: 0,
    };
    item.valorVencido += fatura.valor;
    if (status === "atrasada") {
      item.valorAtrasado += fatura.valor;
      atrasadoTotal += fatura.valor;
    }
    porCliente.set(fatura.clienteId, item);
  }

  const lista = [...porCliente.values()]
    .map((item) => ({
      ...item,
      percentual: percentual(item.valorAtrasado, item.valorVencido),
    }))
    .sort(
      (a, b) =>
        b.valorAtrasado - a.valorAtrasado ||
        a.clienteNome.localeCompare(b.clienteNome, "pt-BR"),
    );

  return {
    aReceberNoMes: arredondarCentavos(aReceberNoMes),
    recebidoNoMes: arredondarCentavos(recebidoNoMes),
    atrasadoTotal: arredondarCentavos(atrasadoTotal),
    inadimplenciaPercentual: percentual(atrasadoTotal, vencidoTotal),
    porCliente: lista,
  };
}

/** Soma das mensalidades dos contratos ativos (receita recorrente, MRR). */
export function receitaRecorrente(
  contratos: Pick<ContratoFinanceiro, "valorMensal" | "ativo">[],
): number {
  return arredondarCentavos(
    contratos
      .filter((c) => c.ativo)
      .reduce((total, c) => total + c.valorMensal, 0),
  );
}

/**
 * Texto de cobrança amigável para enviar ao cliente (WhatsApp/e-mail).
 * Enquanto não há integração de WhatsApp no projeto, a tela copia o texto.
 */
export function mensagemCobranca(
  fatura: Pick<Fatura, "clienteNome" | "competencia" | "valor" | "vencimento">,
): string {
  return (
    `Olá, ${fatura.clienteNome}! Tudo bem? Passando para lembrar da mensalidade ` +
    `da consultoria Mundo Novo Café — competência ${rotuloCompetencia(fatura.competencia)}, ` +
    `no valor de ${formatarMoeda(fatura.valor)}, com vencimento em ${formatarData(fatura.vencimento)}. ` +
    `Qualquer dúvida, estamos à disposição!`
  );
}

export type RecebimentoMensal = { competencia: string; total: number };

/**
 * Total recebido em cada um dos últimos meses (mês corrente incluído),
 * pela data do pagamento — série do gráfico de recebimentos.
 */
export function recebimentosPorMes(
  faturas: Pick<FaturaParaResumo, "valor" | "pagoEm">[],
  hoje: string,
  quantidadeMeses = 6,
): RecebimentoMensal[] {
  const atual = hoje.slice(0, 7);
  const competencias: string[] = [];
  let cursor = atual;
  for (let i = 0; i < quantidadeMeses; i += 1) {
    competencias.unshift(cursor);
    const [ano, mes] = cursor.split("-").map(Number);
    const anterior = mes === 1 ? `${ano - 1}-12` : `${ano}-${String(mes - 1).padStart(2, "0")}`;
    cursor = anterior;
  }

  return competencias.map((competencia) => ({
    competencia,
    total: arredondarCentavos(
      faturas
        .filter((f) => f.pagoEm?.slice(0, 7) === competencia)
        .reduce((total, f) => total + f.valor, 0),
    ),
  }));
}
