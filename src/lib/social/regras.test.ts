import { describe, expect, it } from "vitest";
import {
  base64DaAssinatura,
  caminhoAssinatura,
  ehAssinaturaPng,
  EPIS_SUGERIDOS,
  esquemaFichaEpi,
  slugSocial,
} from "./regras";

const TRABALHADOR = "11111111-0000-4000-8000-000000000001";

describe("EPIs sugeridos", () => {
  it("oferece os EPIs comuns da lavoura de café", () => {
    expect(EPIS_SUGERIDOS).toHaveLength(5);
    expect(EPIS_SUGERIDOS).toContain("Luva nitrílica");
    expect(EPIS_SUGERIDOS).toContain("Respirador PFF2");
    expect(EPIS_SUGERIDOS).toContain("Botas de borracha");
  });
});

describe("validação da ficha de EPI", () => {
  const base = {
    trabalhadorId: TRABALHADOR,
    epi: "Luva nitrílica",
    ca: "32128",
    quantidade: 2,
    entregueEm: "2026-08-20",
  };

  it("aceita uma entrega completa", () => {
    const resultado = esquemaFichaEpi.safeParse(base);
    expect(resultado.success).toBe(true);
  });

  it("aceita entrega sem CA (equipamento sem certificado informado)", () => {
    expect(
      esquemaFichaEpi.safeParse({ ...base, ca: undefined }).success,
    ).toBe(true);
  });

  it("recusa quantidade zero ou negativa", () => {
    expect(esquemaFichaEpi.safeParse({ ...base, quantidade: 0 }).success).toBe(
      false,
    );
    expect(esquemaFichaEpi.safeParse({ ...base, quantidade: -1 }).success).toBe(
      false,
    );
  });

  it("recusa colaborador e data inválidos", () => {
    expect(
      esquemaFichaEpi.safeParse({ ...base, trabalhadorId: "abc" }).success,
    ).toBe(false);
    expect(
      esquemaFichaEpi.safeParse({ ...base, entregueEm: "20/08/2026" }).success,
    ).toBe(false);
  });

  it("recusa EPI sem nome", () => {
    expect(esquemaFichaEpi.safeParse({ ...base, epi: "" }).success).toBe(false);
  });
});

describe("assinatura em data URL", () => {
  const PNG_VALIDO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==";

  it("reconhece um PNG do quadro de assinatura", () => {
    expect(ehAssinaturaPng(PNG_VALIDO)).toBe(true);
    expect(base64DaAssinatura(PNG_VALIDO)).toBe(
      "iVBORw0KGgoAAAANSUhEUg==",
    );
  });

  it("recusa formatos que não são PNG em base64", () => {
    expect(ehAssinaturaPng("data:image/jpeg;base64,abc")).toBe(false);
    expect(ehAssinaturaPng("data:image/png;base64,")).toBe(false);
    expect(ehAssinaturaPng("qualquer texto")).toBe(false);
    expect(base64DaAssinatura("qualquer texto")).toBeNull();
  });
});

describe("caminho da assinatura no bucket", () => {
  it("monta epis/<trabalhador>/<instante>-<sufixo>.png", () => {
    expect(caminhoAssinatura("epis", TRABALHADOR, 1700000000000, "abc123")).toBe(
      `epis/${TRABALHADOR}/1700000000000-abc123.png`,
    );
  });

  it("monta treinamentos/<treinamento>/... para listas de presença", () => {
    expect(
      caminhoAssinatura("treinamentos", "t1", 1700000000000, "xyz789"),
    ).toBe("treinamentos/t1/1700000000000-xyz789.png");
  });
});

describe("slugSocial", () => {
  it("normaliza acentos e espaços", () => {
    expect(slugSocial("Defensivos (NR-31)")).toBe("defensivos-nr-31");
    expect(slugSocial("Luva nitrílica")).toBe("luva-nitrilica");
  });
});
