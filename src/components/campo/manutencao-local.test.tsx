import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * Na abertura do app: pede armazenamento persistente (senão o navegador
 * pode apagar visitas não enviadas) e faz a limpeza das já sincronizadas.
 */

vi.mock("@/lib/campo/banco-local", () => ({
  limparVisitasSincronizadas: vi.fn(async () => 0),
}));

vi.mock("@/lib/campo/armazenamento", () => ({
  garantirArmazenamentoPersistente: vi.fn(async () => "persistente"),
}));

import { garantirArmazenamentoPersistente } from "@/lib/campo/armazenamento";
import { limparVisitasSincronizadas } from "@/lib/campo/banco-local";
import { ManutencaoLocal } from "./manutencao-local";

describe("ManutencaoLocal", () => {
  it("pede o armazenamento persistente assim que o app abre", async () => {
    render(<ManutencaoLocal />);
    await waitFor(() =>
      expect(garantirArmazenamentoPersistente).toHaveBeenCalledTimes(1),
    );
    expect(limparVisitasSincronizadas).toHaveBeenCalledTimes(1);
  });
});
