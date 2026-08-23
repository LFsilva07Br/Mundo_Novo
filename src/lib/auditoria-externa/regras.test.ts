import { describe, expect, it } from "vitest";
import {
  compararComInterna,
  contarPrazos,
  podeFecharAchado,
  PRAZO_PADRAO_DIAS,
  sugerirPrazo,
} from "./regras";

describe("sugerirPrazo", () => {
  it("sugere a data do achado + 70 dias (~10 semanas da certificadora)", () => {
    expect(PRAZO_PADRAO_DIAS).toBe(70);
    expect(sugerirPrazo("2026-08-22")).toBe("2026-10-31");
  });

  it("vira mês e ano corretamente", () => {
    expect(sugerirPrazo("2026-11-01")).toBe("2027-01-10");
  });

  it("aceita outra quantidade de dias quando a certificadora der prazo diferente", () => {
    expect(sugerirPrazo("2026-08-01", 7)).toBe("2026-08-08");
  });
});

describe("podeFecharAchado", () => {
  it("bloqueia o fechamento com a CAPA vinculada ainda aberta", () => {
    for (const status of [
      "aberta",
      "em_correcao",
      "aguardando_evidencia",
    ] as const) {
      const resultado = podeFecharAchado({ status });
      expect(resultado.ok).toBe(false);
      if (!resultado.ok) {
        expect(resultado.erro).toMatch(/CAPA vinculada/);
      }
    }
  });

  it("libera o fechamento com a CAPA vinculada fechada", () => {
    expect(podeFecharAchado({ status: "fechada" }).ok).toBe(true);
  });

  it("libera o fechamento quando não há CAPA vinculada", () => {
    expect(podeFecharAchado(null).ok).toBe(true);
  });
});

describe("compararComInterna", () => {
  it("conta achados sem CAPA como pegos só pela auditoria externa", () => {
    const comparativo = compararComInterna([
      { capaId: "capa-1" },
      { capaId: null },
      { capaId: "capa-2" },
      { capaId: null },
    ]);
    expect(comparativo.total).toBe(4);
    expect(comparativo.pegosInternamente).toBe(2);
    expect(comparativo.pegosSoPelaExterna).toBe(2);
    expect(comparativo.percentualPegoInternamente).toBe(50);
  });

  it("sem achados, considera 100% pego internamente", () => {
    expect(compararComInterna([]).percentualPegoInternamente).toBe(100);
  });
});

describe("contarPrazos", () => {
  const hoje = new Date("2026-08-22T12:00:00");

  it("separa achados abertos entre no prazo e estourados", () => {
    const resumo = contarPrazos(
      [
        { status: "aberta", prazo: "2026-09-01" },
        { status: "em_correcao", prazo: "2026-08-10" },
        { status: "aguardando_evidencia", prazo: null },
        { status: "fechada", prazo: "2026-01-01" },
      ],
      hoje,
    );
    expect(resumo.abertos).toBe(3);
    expect(resumo.noPrazo).toBe(2);
    expect(resumo.estourados).toBe(1);
  });

  it("achado fechado não conta como estourado mesmo com prazo passado", () => {
    const resumo = contarPrazos([{ status: "fechada", prazo: "2020-01-01" }], hoje);
    expect(resumo.abertos).toBe(0);
    expect(resumo.estourados).toBe(0);
  });
});
