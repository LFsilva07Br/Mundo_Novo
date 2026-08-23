import { describe, expect, it } from "vitest";
import { CLIENTES_DEMO } from "@/lib/carteira/dados-demo";
import {
  financeiroPronto,
  listarContratosFinanceiros,
  listarFaturas,
} from "./consultas";

/**
 * Sem env do Supabase (ambiente de teste), a camada de consulta serve os
 * dados de demonstração: um contrato por cliente real da carteira e o
 * histórico de faturas com dois clientes em atraso.
 */

describe("consultas do financeiro em modo demonstração", () => {
  it("o financeiro ainda não está pronto para gravar", async () => {
    expect(await financeiroPronto()).toBe(false);
  });

  it("tem um contrato ativo por cliente real da carteira (8 no total)", async () => {
    const contratos = await listarContratosFinanceiros();
    expect(contratos).toHaveLength(8);

    const idsCarteira = CLIENTES_DEMO.map((c) => c.id).sort();
    const idsContratos = contratos.map((c) => c.clienteId).sort();
    expect(idsContratos).toEqual(idsCarteira);
    expect(contratos.every((c) => c.ativo)).toBe(true);
  });

  it("mensalidades entre R$ 1.200 e R$ 3.500 e vencimento até o dia 28", async () => {
    const contratos = await listarContratosFinanceiros();
    for (const contrato of contratos) {
      expect(contrato.valorMensal).toBeGreaterThanOrEqual(1200);
      expect(contrato.valorMensal).toBeLessThanOrEqual(3500);
      expect(contrato.diaVencimento).toBeGreaterThanOrEqual(1);
      expect(contrato.diaVencimento).toBeLessThanOrEqual(28);
    }
  });

  it("exatamente 2 clientes têm faturas atrasadas", async () => {
    const faturas = await listarFaturas();
    const clientesAtrasados = new Set(
      faturas.filter((f) => f.status === "atrasada").map((f) => f.clienteId),
    );
    expect([...clientesAtrasados].sort()).toEqual([
      "chapadao-de-ferro",
      "tecoara",
    ]);
  });

  it("todo contrato tem fatura na competência atual e histórico pago", async () => {
    const faturas = await listarFaturas();
    const competenciaAtual = faturas[0].competencia;

    const doMes = faturas.filter((f) => f.competencia === competenciaAtual);
    expect(doMes).toHaveLength(8);

    const pagas = faturas.filter((f) => f.status === "paga");
    expect(pagas.length).toBeGreaterThan(0);
    for (const fatura of pagas) {
      expect(fatura.pagoEm).toBeTruthy();
    }
  });

  it("filtra as faturas por competência", async () => {
    const todas = await listarFaturas();
    const competencia = todas.at(-1)!.competencia;
    const filtradas = await listarFaturas(competencia);
    expect(filtradas.length).toBeGreaterThan(0);
    expect(filtradas.every((f) => f.competencia === competencia)).toBe(true);
  });
});
