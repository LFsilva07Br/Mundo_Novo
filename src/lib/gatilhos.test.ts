import { describe, expect, it } from "vitest";
import { REGUA_DISPAROS, marcoAtingido } from "./gatilhos";

describe("motor de gatilhos por data", () => {
  it("a régua cobre os marcos validados com a cliente (90/60/30/15/7) e os longos", () => {
    for (const marco of [180, 150, 120, 90, 60, 30, 15, 7]) {
      expect(REGUA_DISPAROS).toContain(marco);
    }
  });

  it("não dispara para vencimentos distantes", () => {
    expect(marcoAtingido(300)).toBeNull();
    expect(marcoAtingido(181)).toBeNull();
  });

  it("dispara o menor marco cruzado", () => {
    expect(marcoAtingido(180)).toBe(180);
    expect(marcoAtingido(89)).toBe(60);
    expect(marcoAtingido(30)).toBe(30);
    expect(marcoAtingido(10)).toBe(7);
    expect(marcoAtingido(0)).toBe(7);
  });

  it("vencimento passado continua disparando (alerta persiste)", () => {
    expect(marcoAtingido(-5)).toBe(7);
    expect(marcoAtingido(-100)).toBe(7);
  });

  it("aceita régua customizada (override por cliente)", () => {
    expect(marcoAtingido(12, [15, 7])).toBe(7);
    expect(marcoAtingido(20, [15, 7])).toBeNull();
  });
});
