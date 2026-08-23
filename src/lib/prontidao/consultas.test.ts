import { describe, expect, it } from "vitest";
import { avaliarCarteira } from "./consultas";

const HOJE = new Date("2026-08-23T12:00:00");

describe("avaliarCarteira (modo demonstração)", () => {
  it("avalia todos os clientes da carteira e ordena os não prontos primeiro", async () => {
    const carteira = await avaliarCarteira(HOJE);

    expect(carteira).toHaveLength(8);
    const primeiroPronto = carteira.findIndex((c) => c.pronta);
    if (primeiroPronto >= 0) {
      // Depois do primeiro pronto, ninguém pode estar não pronto.
      expect(carteira.slice(primeiroPronto).every((c) => c.pronta)).toBe(true);
    }
  });

  it("marca a Alto da Serra como não pronta: certificado vencido e CAPA maior", async () => {
    const carteira = await avaliarCarteira(HOJE);
    const altoDaSerra = carteira.find((c) => c.clienteId === "alto-da-serra");

    expect(altoDaSerra).toBeDefined();
    expect(altoDaSerra!.pronta).toBe(false);
    expect(
      altoDaSerra!.pendencias.some((p) => /vencida/.test(p)),
    ).toBe(true);
    expect(
      altoDaSerra!.pendencias.some((p) => /CAPA MAIOR/.test(p)),
    ).toBe(true);
  });

  it("aponta falta de auditoria interna para quem não teve visita concluída", async () => {
    const carteira = await avaliarCarteira(HOJE);
    const bernardes = carteira.find((c) => c.clienteId === "bernardes");

    expect(bernardes).toBeDefined();
    expect(
      bernardes!.pendencias.some((p) => /auditoria interna/.test(p)),
    ).toBe(true);
  });
});
