import { describe, expect, it } from "vitest";
import {
  CLIENTE_PADRAO_SOCIAL,
  listarExamesCargo,
  listarMoradias,
  listarTrabalhadores,
  listarTreinamentos,
} from "./consultas";

/**
 * Sem variáveis do Supabase (ambiente de teste), a camada de consulta
 * serve os dados de demonstração da planilha da cliente.
 */

describe("consultas do módulo social — fallback de demonstração", () => {
  it("lista os 6 trabalhadores da Alto da Serra, todos ativos e fixos", async () => {
    const trabalhadores = await listarTrabalhadores(CLIENTE_PADRAO_SOCIAL);
    expect(trabalhadores).toHaveLength(6);
    expect(trabalhadores.every((t) => t.ativo && t.vinculo === "fixo")).toBe(
      true,
    );
    expect(
      trabalhadores.filter((t) => t.genero === "feminino"),
    ).toHaveLength(1);
  });

  it("lista as 3 moradias com moradores e parentesco", async () => {
    const moradias = await listarMoradias(CLIENTE_PADRAO_SOCIAL);
    expect(moradias).toHaveLength(3);
    const casa1 = moradias.find((m) => m.nome === "Casa 01")!;
    expect(casa1.totalMoradores).toBe(5);
    expect(casa1.moradores.map((m) => m.parentesco)).toContain("Esposa");
  });

  it("agrega treinamentos com participantes e próximo vencimento", async () => {
    const treinamentos = await listarTreinamentos(CLIENTE_PADRAO_SOCIAL);
    expect(treinamentos).toHaveLength(6);

    const defensivos = treinamentos.find((t) => t.nome.includes("Defensivos"))!;
    expect(defensivos.participantes).toBe(2);
    expect(defensivos.totalTrabalhadores).toBe(6);
    expect(defensivos.ultimaRealizacao).toBe("2026-03-06");
    // Próximo vencimento = realização + periodicidade (12 meses).
    expect(defensivos.proximoVencimento).toBe("2027-03-06");
  });

  it("treinamento nunca realizado fica sem vencimento (pendente)", async () => {
    const treinamentos = await listarTreinamentos(CLIENTE_PADRAO_SOCIAL);
    const colhedeira = treinamentos.find((t) => t.nome.includes("Colhedeira"))!;
    expect(colhedeira.ultimaRealizacao).toBeUndefined();
    expect(colhedeira.proximoVencimento).toBeUndefined();
  });

  it("agrupa os exames ocupacionais por cargo", async () => {
    const exames = await listarExamesCargo();
    const tratorista = exames.find((e) => e.cargo === "Tratorista Agrícola")!;
    expect(tratorista.periodicidade).toBe("Anual");
    expect(tratorista.exames.length).toBeGreaterThanOrEqual(5);
  });
});
