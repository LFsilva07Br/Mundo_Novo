import { describe, expect, it } from "vitest";
import {
  DIAS_RETENCAO_PADRAO,
  limparVisitasSincronizadas,
  visitaExpirada,
} from "./banco-local";

/**
 * Regra de retenção da limpeza local: visitas já sincronizadas só podem
 * sair do aparelho depois do prazo de retenção; as demais ficam sempre.
 */

const AGORA = new Date("2026-08-23T12:00:00Z");

describe("visitaExpirada", () => {
  it("nunca remove visita que ainda não foi sincronizada", () => {
    expect(visitaExpirada({ sincronizadaEm: null }, 0, AGORA)).toBe(false);
  });

  it("mantém a visita sincronizada dentro do prazo de retenção", () => {
    // Sincronizada há 29 dias — retenção padrão é de 30 dias.
    expect(
      visitaExpirada(
        { sincronizadaEm: "2026-07-25T12:00:00Z" },
        DIAS_RETENCAO_PADRAO,
        AGORA,
      ),
    ).toBe(false);
    // Exatamente no limite (30 dias) ainda não expira.
    expect(
      visitaExpirada(
        { sincronizadaEm: "2026-07-24T12:00:00Z" },
        DIAS_RETENCAO_PADRAO,
        AGORA,
      ),
    ).toBe(false);
  });

  it("remove a visita sincronizada há mais tempo que a retenção", () => {
    // 31 dias atrás.
    expect(
      visitaExpirada(
        { sincronizadaEm: "2026-07-23T11:59:59Z" },
        DIAS_RETENCAO_PADRAO,
        AGORA,
      ),
    ).toBe(true);
  });

  it("com retenção zero (limpeza manual), remove qualquer sincronizada", () => {
    expect(
      visitaExpirada({ sincronizadaEm: "2026-08-23T11:00:00Z" }, 0, AGORA),
    ).toBe(true);
    expect(visitaExpirada({ sincronizadaEm: null }, 0, AGORA)).toBe(false);
  });

  it("ignora datas de sincronização inválidas", () => {
    expect(visitaExpirada({ sincronizadaEm: "data-torta" }, 0, AGORA)).toBe(
      false,
    );
  });
});

describe("limparVisitasSincronizadas", () => {
  it("vira no-op fora do navegador (sem IndexedDB)", async () => {
    // jsdom não implementa indexedDB — como no servidor, nada a fazer.
    await expect(limparVisitasSincronizadas()).resolves.toBe(0);
  });
});
