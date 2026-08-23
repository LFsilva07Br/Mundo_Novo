import { describe, expect, it } from "vitest";
import { balancoDaCarteira, calcularBalanco } from "./balanco";

describe("calcularBalanco", () => {
  it("saldo positivo quando os lotes cabem na previsão", () => {
    const balanco = calcularBalanco(1000, 800);
    expect(balanco.saldoSacas).toBe(200);
    expect(balanco.estouro).toBe(false);
    expect(balanco.percentualComprometido).toBe(80);
  });

  it("alerta de estouro quando lotes superam a previsão", () => {
    const balanco = calcularBalanco(800, 950);
    expect(balanco.estouro).toBe(true);
    expect(balanco.saldoSacas).toBe(-150);
    expect(balanco.percentualComprometido).toBe(119);
  });

  it("sem previsão cadastrada, qualquer lote estoura e o % fica nulo", () => {
    const balanco = calcularBalanco(0, 10);
    expect(balanco.estouro).toBe(true);
    expect(balanco.percentualComprometido).toBeNull();
  });

  it("sem previsão e sem lotes não há estouro", () => {
    const balanco = calcularBalanco(0, 0);
    expect(balanco.estouro).toBe(false);
    expect(balanco.saldoSacas).toBe(0);
  });
});

describe("balancoDaCarteira (modo demonstração)", () => {
  it("consolida previsão × lotes por cliente, ignorando lotes cancelados", async () => {
    const balancos = await balancoDaCarteira();

    const altoDaSerra = balancos.find((b) => b.clienteId === "alto-da-serra");
    expect(altoDaSerra).toBeDefined();
    // 900 + 1200 + 600 (o lote cancelado de 350 sacas fica de fora).
    expect(altoDaSerra!.sacasLotes).toBe(2700);
    expect(altoDaSerra!.previsaoSacas).toBeGreaterThan(3000);
    expect(altoDaSerra!.estouro).toBe(false);
  });

  it("marca estouro e ordena os estourados primeiro", async () => {
    const balancos = await balancoDaCarteira();

    const cedro = balancos.find((b) => b.clienteId === "cedro");
    expect(cedro).toBeDefined();
    // 620 + 330 = 950 lotes contra previsão demo de 800.
    expect(cedro!.sacasLotes).toBe(950);
    expect(cedro!.estouro).toBe(true);
    expect(balancos[0].estouro).toBe(true);
  });
});
