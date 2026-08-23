import { describe, expect, it } from "vitest";
import {
  esquemaConfigAlerta,
  normalizarRegua,
  primeiroErro,
} from "./validacao";

describe("esquemaConfigAlerta", () => {
  const base = {
    clienteId: "alto-da-serra",
    dias: [90, 60, 30],
    copiaAdminGrupo: false,
  };

  it("aceita uma régua válida", () => {
    const analise = esquemaConfigAlerta.safeParse(base);
    expect(analise.success).toBe(true);
  });

  it("exige pelo menos um marco", () => {
    const analise = esquemaConfigAlerta.safeParse({ ...base, dias: [] });
    expect(analise.success).toBe(false);
    if (!analise.success) {
      expect(primeiroErro(analise.error)).toBe(
        "Escolha pelo menos um marco de disparo.",
      );
    }
  });

  it("aceita no máximo 8 marcos", () => {
    const oito = [180, 150, 120, 90, 60, 30, 15, 7];
    expect(esquemaConfigAlerta.safeParse({ ...base, dias: oito }).success).toBe(
      true,
    );
    expect(
      esquemaConfigAlerta.safeParse({ ...base, dias: [...oito, 3] }).success,
    ).toBe(false);
  });

  it("rejeita marcos fora do intervalo de 1 a 365 dias", () => {
    expect(esquemaConfigAlerta.safeParse({ ...base, dias: [0] }).success).toBe(
      false,
    );
    expect(
      esquemaConfigAlerta.safeParse({ ...base, dias: [366] }).success,
    ).toBe(false);
    expect(
      esquemaConfigAlerta.safeParse({ ...base, dias: [1, 365] }).success,
    ).toBe(true);
  });

  it("rejeita marcos que não sejam números inteiros", () => {
    expect(
      esquemaConfigAlerta.safeParse({ ...base, dias: [30.5] }).success,
    ).toBe(false);
  });

  it("exige o cliente identificado", () => {
    const analise = esquemaConfigAlerta.safeParse({ ...base, clienteId: " " });
    expect(analise.success).toBe(false);
  });
});

describe("normalizarRegua", () => {
  it("ordena os marcos do maior para o menor", () => {
    expect(normalizarRegua([7, 90, 30, 180])).toEqual([180, 90, 30, 7]);
  });

  it("remove marcos repetidos", () => {
    expect(normalizarRegua([90, 90, 30, 7, 7])).toEqual([90, 30, 7]);
  });

  it("não altera o array original", () => {
    const original = [7, 90];
    normalizarRegua(original);
    expect(original).toEqual([7, 90]);
  });
});
