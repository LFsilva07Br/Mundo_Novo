import { describe, expect, it } from "vitest";
import { TELAS_MANUAL } from "./manual";

describe("manual do usuário", () => {
  it("cobre as telas disponíveis da Fase 0", () => {
    const ids = TELAS_MANUAL.map((t) => t.id);
    expect(ids).toContain("login");
    expect(ids).toContain("painel");
    expect(ids).toContain("docs");
  });

  it("cada tela tem rota, resumo e ao menos um passo de uso", () => {
    for (const tela of TELAS_MANUAL) {
      expect(tela.rota, tela.id).toMatch(/^\//);
      expect(tela.resumo.length, tela.id).toBeGreaterThan(10);
      expect(tela.passos.length, tela.id).toBeGreaterThan(0);
      for (const passo of tela.passos) {
        expect(passo.length, tela.id).toBeGreaterThan(5);
      }
    }
  });

  it("não há ids duplicados", () => {
    const ids = TELAS_MANUAL.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
