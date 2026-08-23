import {
  gerarCompetencias,
  statusFatura,
  type ContratoFinanceiro,
  type Fatura,
} from "./regras";

/**
 * Dados de demonstração do financeiro — um contrato de mensalidade para
 * cada cliente real da carteira Mundo Novo. As datas são relativas ao dia
 * de hoje para o painel sempre parecer vivo: histórico de pagamentos nos
 * últimos meses, faturas do mês corrente e dois clientes em atraso
 * (Fazenda Chapadão de Ferro e Fazenda Tecoara).
 * Quando a migration financeira for aplicada, estes dados viram o seed.
 */

function dataLocalISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

const AGORA = new Date();
const HOJE = dataLocalISO(AGORA);
const COMPETENCIA_ATUAL = HOJE.slice(0, 7);

/** Data com dia fixo, N meses antes do mês corrente. */
function dataMesesAtras(meses: number, dia: number): string {
  return dataLocalISO(
    new Date(AGORA.getFullYear(), AGORA.getMonth() - meses, dia),
  );
}

export const CONTRATOS_DEMO: ContratoFinanceiro[] = [
  {
    id: "contrato-alto-da-serra",
    clienteId: "alto-da-serra",
    clienteNome: "Fazenda Alto da Serra",
    descricao: "Consultoria de certificação Rainforest Alliance",
    valorMensal: 2800,
    diaVencimento: 5,
    inicio: dataMesesAtras(14, 1),
    ativo: true,
  },
  {
    id: "contrato-bernardes",
    clienteId: "bernardes",
    clienteNome: "Fazenda Bernardes",
    descricao: "Gestão ambiental e certificações (RA + 4C)",
    valorMensal: 3500,
    diaVencimento: 10,
    inicio: dataMesesAtras(12, 1),
    ativo: true,
  },
  {
    id: "contrato-cedro",
    clienteId: "cedro",
    clienteNome: "Fazenda Cedro",
    descricao: "Consultoria de certificação Rainforest Alliance",
    valorMensal: 1900,
    diaVencimento: 5,
    inicio: dataMesesAtras(10, 15),
    ativo: true,
  },
  {
    id: "contrato-chapadao-de-ferro",
    clienteId: "chapadao-de-ferro",
    clienteNome: "Fazenda Chapadão de Ferro",
    descricao: "Consultoria de certificação e adequação ambiental",
    valorMensal: 1600,
    diaVencimento: 15,
    inicio: dataMesesAtras(9, 1),
    ativo: true,
  },
  {
    id: "contrato-lagoinha",
    clienteId: "lagoinha",
    clienteNome: "Fazenda Lagoinha",
    descricao: "Consultoria de certificação Rainforest Alliance",
    valorMensal: 2200,
    diaVencimento: 10,
    inicio: dataMesesAtras(8, 1),
    ativo: true,
  },
  {
    id: "contrato-lambari",
    clienteId: "lambari",
    clienteNome: "Fazenda Lambari",
    descricao: "Certificação RA + implantação do orgânico (IBD)",
    valorMensal: 3200,
    diaVencimento: 20,
    inicio: dataMesesAtras(7, 1),
    ativo: true,
  },
  {
    id: "contrato-tecoara",
    clienteId: "tecoara",
    clienteNome: "Fazenda Tecoara",
    descricao: "Acompanhamento de conformidade Rainforest",
    valorMensal: 1200,
    diaVencimento: 5,
    inicio: dataMesesAtras(6, 10),
    ativo: true,
  },
  {
    id: "contrato-guatambu",
    clienteId: "guatambu",
    clienteNome: "Fazendas Guatambu",
    descricao: "Gestão da cadeia de suprimentos certificada",
    valorMensal: 2500,
    diaVencimento: 15,
    inicio: dataMesesAtras(5, 1),
    ativo: true,
  },
];

/**
 * Quantas faturas mais recentes de cada cliente ficam sem pagamento:
 * inclui a do mês corrente — por isso 3 e 2 geram, respectivamente,
 * 2 e 1 faturas seguramente atrasadas além da competência atual.
 */
const FATURAS_SEM_PAGAMENTO: Record<string, number> = {
  "chapadao-de-ferro": 3,
  tecoara: 2,
};

/** Clientes que pagam adiantado, logo no início do mês. */
const PAGAM_ADIANTADO = new Set(["bernardes", "lambari"]);

function gerarFaturasDemo(): Fatura[] {
  const faturas: Fatura[] = [];

  for (const contrato of CONTRATOS_DEMO) {
    const esperadas = gerarCompetencias(contrato, COMPETENCIA_ATUAL);
    const semPagamento = FATURAS_SEM_PAGAMENTO[contrato.clienteId] ?? 0;

    esperadas.forEach((esperada, indice) => {
      const dasUltimas = esperadas.length - indice <= semPagamento;
      let pagoEm: string | undefined;
      if (!dasUltimas) {
        const adiantado = `${esperada.competencia}-02`;
        if (PAGAM_ADIANTADO.has(contrato.clienteId) && adiantado <= HOJE) {
          pagoEm = adiantado;
        } else if (esperada.vencimento < HOJE) {
          pagoEm = esperada.vencimento;
        }
      }

      const fatura: Omit<Fatura, "status"> = {
        id: `fatura-${contrato.clienteId}-${esperada.competencia}`,
        contratoId: contrato.id,
        clienteId: contrato.clienteId,
        clienteNome: contrato.clienteNome,
        competencia: esperada.competencia,
        valor: esperada.valor,
        vencimento: esperada.vencimento,
        pagoEm,
      };
      faturas.push({ ...fatura, status: statusFatura(fatura, HOJE) });
    });
  }

  return faturas.sort(
    (a, b) =>
      b.competencia.localeCompare(a.competencia) ||
      a.clienteNome.localeCompare(b.clienteNome, "pt-BR"),
  );
}

export const FATURAS_DEMO: Fatura[] = gerarFaturasDemo();
