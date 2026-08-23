import { describe, expect, it } from "vitest";
import {
  diasNoMes,
  gerarCompetencias,
  mensagemCobranca,
  mensalidadeProRata,
  proximaCompetencia,
  recebimentosPorMes,
  receitaRecorrente,
  resumoFinanceiro,
  rotuloCompetencia,
  statusFatura,
  vencimentoDaCompetencia,
} from "./regras";

const HOJE = "2026-08-22";

describe("statusFatura", () => {
  it("fatura com pagamento é paga, mesmo que tenha atrasado", () => {
    expect(
      statusFatura({ vencimento: "2026-08-05", pagoEm: "2026-08-05" }, HOJE),
    ).toBe("paga");
    expect(
      statusFatura({ vencimento: "2026-07-05", pagoEm: "2026-08-01" }, HOJE),
    ).toBe("paga");
  });

  it("fatura vencida e sem pagamento fica atrasada", () => {
    expect(statusFatura({ vencimento: "2026-08-21" }, HOJE)).toBe("atrasada");
    expect(statusFatura({ vencimento: "2026-06-05" }, HOJE)).toBe("atrasada");
  });

  it("dentro do prazo (inclusive no dia do vencimento) fica em aberto", () => {
    expect(statusFatura({ vencimento: "2026-08-22" }, HOJE)).toBe("em_aberto");
    expect(statusFatura({ vencimento: "2026-09-05" }, HOJE)).toBe("em_aberto");
  });
});

describe("mensalidadeProRata", () => {
  it("contrato iniciado no dia 1º paga o mês cheio", () => {
    expect(mensalidadeProRata(2800, "2026-08-01")).toBe(2800);
  });

  it("iniciado no meio do mês paga proporcional aos dias restantes", () => {
    // Agosto tem 31 dias; do dia 16 ao 31 são 16 dias.
    expect(mensalidadeProRata(3100, "2026-08-16")).toBe(1600);
  });

  it("fevereiro (28 dias): metade do mês, metade do valor", () => {
    expect(mensalidadeProRata(3000, "2026-02-15")).toBe(1500);
  });

  it("arredonda para centavos", () => {
    // 16/31 de 3000 = 1548,3870… → 1548,39
    expect(mensalidadeProRata(3000, "2026-08-16")).toBe(1548.39);
  });
});

describe("calendário auxiliar", () => {
  it("conta os dias do mês e vira o ano na competência seguinte", () => {
    expect(diasNoMes("2026-02")).toBe(28);
    expect(diasNoMes("2028-02")).toBe(29);
    expect(diasNoMes("2026-08")).toBe(31);
    expect(proximaCompetencia("2026-12")).toBe("2027-01");
    expect(proximaCompetencia("2026-08")).toBe("2026-09");
  });

  it("vencimento nunca estoura o fim do mês", () => {
    expect(vencimentoDaCompetencia("2026-02", 28)).toBe("2026-02-28");
    expect(vencimentoDaCompetencia("2026-08", 5)).toBe("2026-08-05");
  });

  it("rótulo curto de competência em pt-BR", () => {
    expect(rotuloCompetencia("2026-08")).toBe("ago/2026");
    expect(rotuloCompetencia("2026-01")).toBe("jan/2026");
  });
});

describe("gerarCompetencias", () => {
  const contrato = {
    valorMensal: 2000,
    diaVencimento: 10,
    inicio: "2026-05-15",
  };

  it("gera uma fatura por mês, do início até a competência limite", () => {
    const faturas = gerarCompetencias(contrato, "2026-08");
    expect(faturas.map((f) => f.competencia)).toEqual([
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
    ]);
  });

  it("primeiro mês sai pró-rata e vence no fim do mês quando o dia já passou", () => {
    const [primeira, segunda] = gerarCompetencias(contrato, "2026-08");
    // Maio tem 31 dias; do dia 15 ao 31 são 17 dias: 2000 × 17/31 = 1096,77.
    expect(primeira.valor).toBe(1096.77);
    // Dia 10 é antes do início (15) — a primeira fatura vence em 31/05.
    expect(primeira.vencimento).toBe("2026-05-31");
    expect(segunda.valor).toBe(2000);
    expect(segunda.vencimento).toBe("2026-06-10");
  });

  it("mantém o dia de vencimento no primeiro mês quando ainda não passou", () => {
    const [primeira] = gerarCompetencias(
      { valorMensal: 2000, diaVencimento: 20, inicio: "2026-05-05" },
      "2026-05",
    );
    expect(primeira.vencimento).toBe("2026-05-20");
  });

  it("respeita o fim da vigência", () => {
    const faturas = gerarCompetencias(
      { ...contrato, fim: "2026-06-30" },
      "2026-08",
    );
    expect(faturas.map((f) => f.competencia)).toEqual(["2026-05", "2026-06"]);
  });

  it("não gera nada quando o limite é anterior ao início", () => {
    expect(gerarCompetencias(contrato, "2026-04")).toEqual([]);
  });
});

describe("resumoFinanceiro", () => {
  const faturas = [
    // Mês corrente: uma paga, uma em aberto (vence dia 25), uma atrasada.
    {
      clienteId: "bernardes",
      clienteNome: "Fazenda Bernardes",
      competencia: "2026-08",
      valor: 3500,
      vencimento: "2026-08-10",
      pagoEm: "2026-08-02",
    },
    {
      clienteId: "lagoinha",
      clienteNome: "Fazenda Lagoinha",
      competencia: "2026-08",
      valor: 2200,
      vencimento: "2026-08-25",
    },
    {
      clienteId: "tecoara",
      clienteNome: "Fazenda Tecoara",
      competencia: "2026-08",
      valor: 1200,
      vencimento: "2026-08-05",
    },
    // Mês anterior: tecoara também não pagou; bernardes pagou em julho.
    {
      clienteId: "tecoara",
      clienteNome: "Fazenda Tecoara",
      competencia: "2026-07",
      valor: 1200,
      vencimento: "2026-07-05",
    },
    {
      clienteId: "bernardes",
      clienteNome: "Fazenda Bernardes",
      competencia: "2026-07",
      valor: 3500,
      vencimento: "2026-07-10",
      pagoEm: "2026-07-10",
    },
  ];

  it("calcula a receber, recebido, atrasado e inadimplência", () => {
    const resumo = resumoFinanceiro(faturas, HOJE);

    // A receber no mês: em aberto (2200) + atrasada do mês (1200).
    expect(resumo.aReceberNoMes).toBe(3400);
    // Recebido no mês: só o pagamento que entrou em agosto.
    expect(resumo.recebidoNoMes).toBe(3500);
    // Atrasado total: tecoara agosto + julho.
    expect(resumo.atrasadoTotal).toBe(2400);
    // Vencidas: 3500 + 1200 + 1200 + 3500 = 9400 → 2400/9400 = 25,5%.
    expect(resumo.inadimplenciaPercentual).toBe(25.5);
  });

  it("aponta a inadimplência por cliente, os mais atrasados primeiro", () => {
    const resumo = resumoFinanceiro(faturas, HOJE);

    expect(resumo.porCliente[0]).toMatchObject({
      clienteId: "tecoara",
      valorVencido: 2400,
      valorAtrasado: 2400,
      percentual: 100,
    });
    const bernardes = resumo.porCliente.find(
      (c) => c.clienteId === "bernardes",
    );
    expect(bernardes).toMatchObject({ valorAtrasado: 0, percentual: 0 });
    // Lagoinha ainda não venceu — não entra na lista de vencidas.
    expect(
      resumo.porCliente.find((c) => c.clienteId === "lagoinha"),
    ).toBeUndefined();
  });

  it("sem faturas vencidas, a inadimplência é zero", () => {
    const resumo = resumoFinanceiro(
      [
        {
          clienteId: "lagoinha",
          clienteNome: "Fazenda Lagoinha",
          competencia: "2026-08",
          valor: 2200,
          vencimento: "2026-08-25",
        },
      ],
      HOJE,
    );
    expect(resumo.atrasadoTotal).toBe(0);
    expect(resumo.inadimplenciaPercentual).toBe(0);
    expect(resumo.porCliente).toEqual([]);
  });
});

describe("receitaRecorrente", () => {
  it("soma só os contratos ativos", () => {
    expect(
      receitaRecorrente([
        { valorMensal: 2800, ativo: true },
        { valorMensal: 1200, ativo: true },
        { valorMensal: 9999, ativo: false },
      ]),
    ).toBe(4000);
  });
});

describe("recebimentosPorMes", () => {
  it("monta a série dos últimos meses pela data do pagamento", () => {
    const serie = recebimentosPorMes(
      [
        { valor: 1000, pagoEm: "2026-08-02" },
        { valor: 500, pagoEm: "2026-08-20" },
        { valor: 700, pagoEm: "2026-06-10" },
        { valor: 999, pagoEm: undefined },
        { valor: 888, pagoEm: "2025-12-10" },
      ],
      HOJE,
      6,
    );

    expect(serie.map((r) => r.competencia)).toEqual([
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
    ]);
    expect(serie.at(-1)).toEqual({ competencia: "2026-08", total: 1500 });
    expect(serie.find((r) => r.competencia === "2026-06")?.total).toBe(700);
    expect(serie.find((r) => r.competencia === "2026-07")?.total).toBe(0);
  });

  it("vira o ano ao voltar os meses", () => {
    const serie = recebimentosPorMes([], "2026-02-10", 4);
    expect(serie.map((r) => r.competencia)).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });
});

describe("mensagemCobranca", () => {
  it("monta o texto amigável com valor, competência e vencimento", () => {
    const texto = mensagemCobranca({
      clienteNome: "Fazenda Tecoara",
      competencia: "2026-08",
      valor: 1200,
      vencimento: "2026-08-05",
    });
    expect(texto).toContain("Fazenda Tecoara");
    expect(texto).toContain("ago/2026");
    expect(texto).toContain("05/08/2026");
    expect(texto.replace(/\s/g, " ")).toContain("R$ 1.200,00");
  });
});
