import { describe, expect, it, vi } from "vitest";
import {
  listarImoveisDoCliente,
  listarRotulosSafras,
  listarTalhoes,
  SAFRA_ATUAL,
} from "./imoveis-consultas";

// Sem Supabase conectado a camada de consulta serve os dados demo.
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => null),
}));

describe("consultas de imóveis e talhões — modo demonstração", () => {
  it("lista os 11 imóveis do Alto da Serra com CAR como documento", async () => {
    const imoveis = await listarImoveisDoCliente("alto-da-serra");
    expect(imoveis).toHaveLength(11);
    for (const imovel of imoveis) {
      if (imovel.car) {
        expect(imovel.documentos.map((d) => d.tipo)).toContain("car");
      }
    }
  });

  it("imóvel com captação de água ganha registro de captação no fallback", async () => {
    const imoveis = await listarImoveisDoCliente("alto-da-serra");
    const comCaptacao = imoveis.filter((i) => i.possuiCaptacaoAgua);
    expect(comCaptacao.length).toBeGreaterThan(0);
    for (const imovel of comCaptacao) {
      expect(imovel.captacoes.length).toBeGreaterThan(0);
    }
  });

  it("lista os 19 talhões do Alto da Serra com previsão da safra atual", async () => {
    const { talhoes } = await listarTalhoes("alto-da-serra");
    expect(talhoes).toHaveLength(19);
    const previsaoTotal = talhoes.reduce(
      (soma, talhao) => soma + (talhao.previsaoAtualSacas ?? 0),
      0,
    );
    expect(previsaoTotal).toBeCloseTo(3429.6, 1);
  });

  it("comparativo consolidado cobre 2021/22 até a safra atual", async () => {
    const { comparativo } = await listarTalhoes("alto-da-serra");
    expect(comparativo.map((s) => s.safra)).toEqual([
      "2021/22",
      "2022/23",
      "2023/24",
      "2024/25",
      SAFRA_ATUAL,
    ]);
    const s2425 = comparativo.find((s) => s.safra === "2024/25")!;
    expect(s2425.colheitaEfetivaSacas).toBe(548);
  });

  it("cliente sem carteira de talhões retorna listas vazias", async () => {
    const { talhoes, comparativo } = await listarTalhoes("bernardes");
    expect(talhoes).toEqual([]);
    expect(comparativo).toEqual([]);
  });

  it("rótulos de safra do modo demonstração incluem a safra atual", async () => {
    const rotulos = await listarRotulosSafras();
    expect(rotulos).toContain(SAFRA_ATUAL);
  });
});
