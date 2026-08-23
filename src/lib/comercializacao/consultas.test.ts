import { describe, expect, it } from "vitest";
import { listarLotes, listarNegociacoes, listarSafras } from "./consultas";

/**
 * Sem env do Supabase (ambiente de teste), a camada de consulta serve os
 * lotes de demonstração da Fazenda Alto da Serra já com os agregados.
 */

describe("consultas em modo demonstração", () => {
  it("lista os 3 lotes com cliente, safra e agregados calculados", async () => {
    const lotes = await listarLotes();
    expect(lotes).toHaveLength(3);
    for (const lote of lotes) {
      expect(lote.clienteNome).toBe("Fazenda Alto da Serra");
      expect(lote.saldoDisponivel).toBe(lote.sacas - lote.sacasNegociadas);
    }
    // Mais recentes primeiro.
    expect(lotes.map((l) => l.identificacao)).toEqual([
      "LOTE-2026-002",
      "LOTE-2026-001",
      "LOTE-2025-014",
    ]);
  });

  it("a proposta não abate o saldo do lote em estoque", async () => {
    const lotes = await listarLotes();
    const lote = lotes.find((l) => l.identificacao === "LOTE-2026-001")!;
    expect(lote.status).toBe("estoque");
    expect(lote.sacas).toBe(350);
    expect(lote.sacasNegociadas).toBe(0);
    expect(lote.saldoDisponivel).toBe(350);
    expect(lote.peneira).toBe("16 acima");
    expect(lote.bebida).toBe("dura");
    expect(lote.origemTalhoes).toContain("T-01");
    expect(lote.melhorPreco).toBe(2480);
    expect(lote.ultimoPreco).toBe(2480);
  });

  it("o lote negociado tem o saldo zerado pela venda fechada", async () => {
    const lotes = await listarLotes();
    const lote = lotes.find((l) => l.identificacao === "LOTE-2026-002")!;
    expect(lote.status).toBe("negociado");
    expect(lote.sacasNegociadas).toBe(200);
    expect(lote.saldoDisponivel).toBe(0);
    expect(lote.negociacoes[0].comprador).toBe("Cooxupé");
    expect(lote.negociacoes[0].status).toBe("fechada");
  });

  it("lista todas as negociações e filtra por lote", async () => {
    const todas = await listarNegociacoes();
    expect(todas).toHaveLength(2);

    const doLote = await listarNegociacoes("lote-2026-002");
    expect(doLote).toHaveLength(1);
    expect(doLote[0].loteIdentificacao).toBe("LOTE-2026-002");
    expect(doLote[0].precoPorSaca).toBe(2520);
  });

  it("lista as safras para o seletor de lote", async () => {
    const safras = await listarSafras();
    expect(safras.map((s) => s.rotulo)).toContain("2025/26");
    for (const safra of safras) {
      expect(safra.id).toBeTruthy();
    }
  });
});
