import { describe, expect, it } from "vitest";
import {
  HISTORICO_SAFRAS_ALTO_DA_SERRA,
  TALHOES_ALTO_DA_SERRA,
} from "./talhoes-demo";

describe("talhões do Alto da Serra — consistência com a planilha de safra", () => {
  it("previsão 2025/26 do bloco Sílvio + Tabuleiro soma 2.857,4 sacas", () => {
    const bloco = TALHOES_ALTO_DA_SERRA.filter((t) =>
      ["Sílvio", "Winicius/Tâmara"].includes(t.produtor),
    );
    const total = bloco.reduce((s, t) => s + t.previsao2526Sacas, 0);
    expect(total).toBeCloseTo(2857.4, 1);
  });

  it("previsão 2025/26 do bloco Carter soma 522,2 sacas", () => {
    const total = TALHOES_ALTO_DA_SERRA.filter(
      (t) => t.produtor === "Carter",
    ).reduce((s, t) => s + t.previsao2526Sacas, 0);
    expect(total).toBeCloseTo(522.2, 1);
  });

  it("área do bloco Sílvio + Tabuleiro soma 46,92 ha", () => {
    const total = TALHOES_ALTO_DA_SERRA.filter((t) =>
      ["Sílvio", "Winicius/Tâmara"].includes(t.produtor),
    ).reduce((s, t) => s + t.areaHa, 0);
    expect(total).toBeCloseTo(46.92, 2);
  });

  it("todo talhão pertence a um imóvel e tem variedade e ano de plantio", () => {
    for (const t of TALHOES_ALTO_DA_SERRA) {
      expect(t.imovel, t.nome).toBeTruthy();
      expect(t.variedade, t.nome).toBeTruthy();
      expect(t.anoPlantio, t.nome).toBeGreaterThan(1990);
    }
  });

  it("histórico de safras cobre 2021/22 a 2025/26", () => {
    expect(HISTORICO_SAFRAS_ALTO_DA_SERRA.map((s) => s.safra)).toEqual([
      "2021/22",
      "2022/23",
      "2023/24",
      "2024/25",
      "2025/26",
    ]);
  });

  it("colheita efetiva 2024/25 foi 548 sacas (ano de poda)", () => {
    const s2425 = HISTORICO_SAFRAS_ALTO_DA_SERRA.find(
      (s) => s.safra === "2024/25",
    )!;
    expect(s2425.colheitaEfetivaSacas).toBe(548);
    expect(s2425.previsaoSacas).toBe(1080);
  });
});
