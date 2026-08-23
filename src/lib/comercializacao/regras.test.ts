import { describe, expect, it } from "vitest";
import {
  calcularKpis,
  melhorPreco,
  podeMarcarEntregue,
  podeReduzirSacas,
  sacasFechadas,
  saldoDisponivel,
  statusLoteAposNegociacoes,
  ultimoPreco,
  validarSacasNegociacao,
} from "./regras";

const fechada = (sacas: number, precoPorSaca = 2500, data = "2026-07-01") =>
  ({ sacas, precoPorSaca, data, status: "fechada" }) as const;
const proposta = (sacas: number, precoPorSaca = 2400, data = "2026-08-01") =>
  ({ sacas, precoPorSaca, data, status: "proposta" }) as const;
const cancelada = (sacas: number, precoPorSaca = 2600, data = "2026-06-01") =>
  ({ sacas, precoPorSaca, data, status: "cancelada" }) as const;

describe("saldo disponível do lote", () => {
  it("desconta apenas as negociações fechadas", () => {
    const negociacoes = [fechada(120), proposta(100), cancelada(50)];
    expect(sacasFechadas(negociacoes)).toBe(120);
    expect(saldoDisponivel(350, negociacoes)).toBe(230);
  });

  it("sem negociações, o saldo é o total de sacas do lote", () => {
    expect(saldoDisponivel(350, [])).toBe(350);
  });
});

describe("validação de sacas da negociação", () => {
  it("recusa quantidade acima do saldo disponível, com mensagem de negócio", () => {
    const erro = validarSacasNegociacao(300, 350, [fechada(120)]);
    expect(erro).toContain("Saldo insuficiente");
    expect(erro).toContain("230");
  });

  it("recusa quantidade zero ou negativa", () => {
    expect(validarSacasNegociacao(0, 350, [])).toContain("maior que zero");
    expect(validarSacasNegociacao(-10, 350, [])).toContain("maior que zero");
  });

  it("aceita quantidade exatamente igual ao saldo", () => {
    expect(validarSacasNegociacao(230, 350, [fechada(120)])).toBeNull();
  });

  it("propostas e canceladas não travam o saldo", () => {
    expect(
      validarSacasNegociacao(350, 350, [proposta(200), cancelada(300)]),
    ).toBeNull();
  });
});

describe("status do lote após as negociações", () => {
  it("fechamento que zera o saldo muda o lote para negociado", () => {
    expect(statusLoteAposNegociacoes("estoque", 200, [fechada(200)])).toBe(
      "negociado",
    );
  });

  it("fechamento parcial mantém o lote em estoque", () => {
    expect(statusLoteAposNegociacoes("estoque", 350, [fechada(120)])).toBe(
      "estoque",
    );
  });

  it("cancelamento que libera saldo devolve o lote ao estoque", () => {
    expect(statusLoteAposNegociacoes("negociado", 200, [cancelada(200)])).toBe(
      "estoque",
    );
  });

  it("lote entregue não muda mais de status", () => {
    expect(statusLoteAposNegociacoes("entregue", 200, [cancelada(200)])).toBe(
      "entregue",
    );
  });
});

describe("entrega e edição do lote", () => {
  it("só permite entregar com ao menos uma negociação fechada", () => {
    expect(podeMarcarEntregue([proposta(100)])).toBe(false);
    expect(podeMarcarEntregue([fechada(100), proposta(50)])).toBe(true);
  });

  it("não permite reduzir as sacas abaixo do total já fechado", () => {
    expect(podeReduzirSacas(100, [fechada(120)])).toBe(false);
    expect(podeReduzirSacas(120, [fechada(120)])).toBe(true);
  });
});

describe("melhor e último preço", () => {
  it("melhor preço considera propostas e fechadas, nunca canceladas", () => {
    expect(
      melhorPreco([fechada(100, 2500), proposta(50, 2480), cancelada(10, 9999)]),
    ).toBe(2500);
    expect(melhorPreco([cancelada(10)])).toBeNull();
  });

  it("último preço vem da negociação ativa mais recente", () => {
    expect(
      ultimoPreco([
        fechada(100, 2500, "2026-07-01"),
        proposta(50, 2480, "2026-08-10"),
      ]),
    ).toBe(2480);
    expect(ultimoPreco([])).toBeNull();
  });
});

describe("KPIs do painel", () => {
  const lotes = [
    {
      status: "estoque" as const,
      sacas: 350,
      safraRotulo: "2025/26",
      negociacoes: [proposta(150, 2480, "2026-08-10")],
    },
    {
      status: "negociado" as const,
      sacas: 200,
      safraRotulo: "2025/26",
      negociacoes: [fechada(200, 2520, "2026-07-28")],
    },
    {
      status: "entregue" as const,
      sacas: 120,
      safraRotulo: "2024/25",
      negociacoes: [],
    },
  ];

  it("calcula estoque, negociadas na safra, preço médio e receita", () => {
    const kpis = calcularKpis(lotes);
    expect(kpis.sacasEmEstoque).toBe(350); // 350 + 0; entregue fica de fora
    expect(kpis.safraDasNegociacoes).toBe("2025/26");
    expect(kpis.sacasNegociadasSafra).toBe(200);
    expect(kpis.precoMedioFechadas).toBe(2520);
    expect(kpis.receitaEstimada).toBe(200 * 2520);
  });

  it("sem negociações fechadas, o preço médio fica nulo", () => {
    const kpis = calcularKpis([lotes[0]]);
    expect(kpis.precoMedioFechadas).toBeNull();
    expect(kpis.receitaEstimada).toBe(0);
  });

  it("preço médio é ponderado pelas sacas", () => {
    const kpis = calcularKpis([
      {
        status: "estoque" as const,
        sacas: 400,
        safraRotulo: "2025/26",
        negociacoes: [fechada(100, 2000), fechada(300, 3000)],
      },
    ]);
    expect(kpis.precoMedioFechadas).toBe((100 * 2000 + 300 * 3000) / 400);
  });
});
