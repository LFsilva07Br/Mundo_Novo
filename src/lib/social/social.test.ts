import { describe, expect, it } from "vitest";
import {
  EXAMES_POR_CARGO,
  MORADIAS_DEMO,
  TRABALHADORES_DEMO,
  TREINAMENTOS_DEMO,
  vencimentoTreinamento,
} from "./dados-demo";

describe("módulo social — dados da planilha da cliente", () => {
  it("tem os 6 trabalhadores fixos (5 homens, 1 mulher)", () => {
    expect(TRABALHADORES_DEMO).toHaveLength(6);
    expect(
      TRABALHADORES_DEMO.filter((t) => t.genero === "Feminino"),
    ).toHaveLength(1);
  });

  it("tratoristas têm CBO 641015 e salário R$ 1.890", () => {
    const tratoristas = TRABALHADORES_DEMO.filter(
      (t) => t.funcao === "Tratorista Agrícola",
    );
    expect(tratoristas).toHaveLength(2);
    for (const t of tratoristas) {
      expect(t.cbo).toBe("641015");
      expect(t.salario).toBe(1890);
    }
  });

  it("apenas um trabalhador recebe insalubridade", () => {
    expect(
      TRABALHADORES_DEMO.filter((t) => t.insalubridade).map((t) => t.nome),
    ).toEqual(["Ricardo Aparecido de Abreu"]);
  });

  it("moradias somam os moradores declarados", () => {
    const casa1 = MORADIAS_DEMO.find((m) => m.casa === "Casa 01")!;
    expect(casa1.totalMoradores).toBe(5);
    expect(casa1.moradores).toHaveLength(5);
  });

  it("vencimento do treinamento soma a periodicidade à realização", () => {
    const defensivos = TREINAMENTOS_DEMO.find((t) =>
      t.nome.includes("Defensivos"),
    )!;
    const vencimento = vencimentoTreinamento(defensivos)!;
    expect(vencimento.getFullYear()).toBe(2027);
    expect(vencimento.getMonth()).toBe(2); // março
  });

  it("treinamento nunca realizado não tem vencimento (fica pendente)", () => {
    const colhedeira = TREINAMENTOS_DEMO.find((t) =>
      t.nome.includes("Colhedeira"),
    )!;
    expect(vencimentoTreinamento(colhedeira)).toBeNull();
  });

  it("todo cargo tem ao menos um exame com periodicidade", () => {
    for (const cargo of EXAMES_POR_CARGO) {
      expect(cargo.exames.length, cargo.cargo).toBeGreaterThan(0);
      expect(["Anual", "Bienal"]).toContain(cargo.periodicidade);
    }
  });
});
