import { describe, expect, it } from "vitest";
import {
  esquemaCompetencia,
  esquemaContratoFinanceiro,
  esquemaPagamento,
} from "./esquemas";

const CONTRATO_VALIDO = {
  clienteId: "tecoara",
  descricao: "Acompanhamento de conformidade Rainforest",
  valorMensal: "1.250,50",
  diaVencimento: "5",
  inicio: "2026-08-10",
  fim: "",
};

describe("esquemaContratoFinanceiro", () => {
  it("aceita valores com vírgula decimal e fim vazio", () => {
    const resultado = esquemaContratoFinanceiro.safeParse(CONTRATO_VALIDO);
    expect(resultado.success).toBe(true);
    expect(resultado.data).toMatchObject({
      valorMensal: 1250.5,
      diaVencimento: 5,
      fim: undefined,
    });
  });

  it("rejeita dia de vencimento fora de 1 a 28", () => {
    const resultado = esquemaContratoFinanceiro.safeParse({
      ...CONTRATO_VALIDO,
      diaVencimento: "31",
    });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0]?.message).toMatch(/dia até 28/i);
  });

  it("rejeita fim antes do início", () => {
    const resultado = esquemaContratoFinanceiro.safeParse({
      ...CONTRATO_VALIDO,
      fim: "2026-07-01",
    });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0]?.message).toMatch(/depois do início/i);
  });

  it("rejeita valor mensal zerado e cliente ausente", () => {
    expect(
      esquemaContratoFinanceiro.safeParse({
        ...CONTRATO_VALIDO,
        valorMensal: "0",
      }).success,
    ).toBe(false);
    expect(
      esquemaContratoFinanceiro.safeParse({ ...CONTRATO_VALIDO, clienteId: "" })
        .success,
    ).toBe(false);
  });
});

describe("esquemaPagamento", () => {
  it("exige fatura e data válidas", () => {
    expect(
      esquemaPagamento.safeParse({ faturaId: "fatura-1", data: "2026-08-22" })
        .success,
    ).toBe(true);
    expect(
      esquemaPagamento.safeParse({ faturaId: "", data: "2026-08-22" }).success,
    ).toBe(false);
    expect(
      esquemaPagamento.safeParse({ faturaId: "fatura-1", data: "22/08/2026" })
        .success,
    ).toBe(false);
  });
});

describe("esquemaCompetencia", () => {
  it("aceita AAAA-MM e rejeita mês inválido", () => {
    expect(esquemaCompetencia.safeParse("2026-08").success).toBe(true);
    expect(esquemaCompetencia.safeParse("2026-13").success).toBe(false);
    expect(esquemaCompetencia.safeParse("agosto/2026").success).toBe(false);
  });
});
