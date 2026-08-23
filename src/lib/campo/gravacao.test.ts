import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VisitaLocal } from "./tipos";

/** Porta única de gravação: falha do IndexedDB nunca some em silêncio. */

vi.mock("./banco-local", () => ({
  salvarVisitaLocal: vi.fn(async () => undefined),
}));

import { salvarVisitaLocal } from "./banco-local";
import { gravarVisita, MENSAGEM_FALHA_GRAVACAO } from "./gravacao";

const VISITA: VisitaLocal = {
  idLocal: "local-1",
  clienteId: "cliente-1",
  clienteNome: "Fazenda Teste",
  titulo: "Visita de teste",
  versaoChecklistId: "versao-1",
  iniciadaEm: "2026-08-23T09:00:00Z",
  gpsInicio: null,
  respostas: [],
  fotos: [],
  assinatura: null,
  concluidaEm: null,
  gpsFim: null,
  sincronizadaEm: null,
  erroSincronizacao: null,
};

beforeEach(() => {
  vi.mocked(salvarVisitaLocal).mockReset();
});

describe("gravarVisita", () => {
  it("confirma a gravação bem sucedida", async () => {
    vi.mocked(salvarVisitaLocal).mockResolvedValue(undefined);
    expect(await gravarVisita(VISITA)).toEqual({ ok: true });
    expect(salvarVisitaLocal).toHaveBeenCalledWith(VISITA);
  });

  it("devolve aviso claro (sem lançar) quando o aparelho recusa a gravação", async () => {
    const cheio = new Error("The quota has been exceeded.");
    cheio.name = "QuotaExceededError";
    vi.mocked(salvarVisitaLocal).mockRejectedValue(cheio);

    const resultado = await gravarVisita(VISITA);
    expect(resultado.ok).toBe(false);
    if (resultado.ok) throw new Error("deveria ter falhado");
    expect(resultado.mensagem).toBe(MENSAGEM_FALHA_GRAVACAO);
    expect(resultado.mensagem).toContain("Não foi possível salvar no aparelho");
    expect(resultado.detalhe).toContain("QuotaExceededError");
  });

  it("aguenta falhas que não são Error", async () => {
    vi.mocked(salvarVisitaLocal).mockRejectedValue("pane");
    const resultado = await gravarVisita(VISITA);
    expect(resultado).toEqual({
      ok: false,
      mensagem: MENSAGEM_FALHA_GRAVACAO,
      detalhe: null,
    });
  });
});
