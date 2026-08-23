import { describe, expect, it } from "vitest";
import { listarPagamentos, totaisPorAno } from "./consultas";
import { esquemaPagamento, primeiraMensagem } from "./validacao";

/**
 * Sem env do Supabase (ambiente de teste), a camada de consulta serve os
 * dados de demonstração já no formato do domínio.
 */

describe("consultas em modo demonstração", () => {
  it("lista todos os pagamentos de DS/DI", async () => {
    const pagamentos = await listarPagamentos();
    expect(pagamentos).toHaveLength(6);
    for (const pagamento of pagamentos) {
      expect(["diferencial", "investimento"]).toContain(pagamento.tipo);
      expect(pagamento.valor).toBeGreaterThan(0);
      expect(pagamento.cliente).toBeTruthy();
    }
  });

  it("filtra os pagamentos por cliente", async () => {
    const pagamentos = await listarPagamentos("lagoinha");
    expect(pagamentos).toHaveLength(3);
    for (const pagamento of pagamentos) {
      expect(pagamento.clienteId).toBe("lagoinha");
    }
  });

  it("consolida os totais por tipo e ano", async () => {
    const totais = await totaisPorAno();
    expect(totais.map((t) => t.ano)).toEqual([2026, 2025]);
    const de2026 = totais[0];
    expect(de2026.diferencial).toBe(30900);
    expect(de2026.investimento).toBe(11000);
    expect(de2026.total).toBe(41900);
  });
});

describe("esquemaPagamento", () => {
  const VALIDO = {
    clienteId: "55555555-1111-4111-8111-111111111111",
    tipo: "diferencial",
    valor: "1850.5",
    data: "2026-08-22",
  };

  it("aceita um pagamento válido convertendo o valor para número", () => {
    const resultado = esquemaPagamento.safeParse(VALIDO);
    expect(resultado.success).toBe(true);
    if (resultado.success) expect(resultado.data.valor).toBe(1850.5);
  });

  it("recusa valor zerado ou negativo", () => {
    const resultado = esquemaPagamento.safeParse({ ...VALIDO, valor: "0" });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(primeiraMensagem(resultado.error)).toMatch(/maior que zero/);
    }
  });

  it("recusa tipo desconhecido e data fora do formato", () => {
    expect(
      esquemaPagamento.safeParse({ ...VALIDO, tipo: "bonus" }).success,
    ).toBe(false);
    expect(
      esquemaPagamento.safeParse({ ...VALIDO, data: "22/08/2026" }).success,
    ).toBe(false);
  });
});
