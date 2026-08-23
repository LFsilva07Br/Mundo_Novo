import { beforeEach, describe, expect, it, vi } from "vitest";
import { ERRO_SOMENTE_LEITURA, exigirEscrita } from "./guarda";
import { ehAuditor } from "./sessao";

vi.mock("./sessao", () => ({ ehAuditor: vi.fn(async () => false) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => null),
  getUsuarioAtual: vi.fn(async () => null),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(ehAuditor).mockResolvedValue(false);
});

describe("exigirEscrita — guarda do modo auditor", () => {
  it("libera a escrita para quem não é auditor", async () => {
    await expect(exigirEscrita()).resolves.toBeNull();
  });

  it("bloqueia o auditor com mensagem amigável", async () => {
    vi.mocked(ehAuditor).mockResolvedValue(true);
    await expect(exigirEscrita()).resolves.toEqual({
      ok: false,
      erro: ERRO_SOMENTE_LEITURA,
    });
  });
});

describe("guarda aplicada nas ações críticas", () => {
  beforeEach(() => {
    vi.mocked(ehAuditor).mockResolvedValue(true);
  });

  it("decidirContrato e moverEtapa recusam o auditor antes de tudo", async () => {
    const { decidirContrato, moverEtapa } = await import(
      "@/lib/certificacao/acoes"
    );
    await expect(
      decidirContrato("11111111-1111-4111-8111-111111111111", "aprovado"),
    ).resolves.toEqual({ ok: false, erro: ERRO_SOMENTE_LEITURA });
    await expect(
      moverEtapa("11111111-1111-4111-8111-111111111111", "aprovado"),
    ).resolves.toEqual({ ok: false, erro: ERRO_SOMENTE_LEITURA });
  });

  it("criarCapa e fecharCapa recusam o auditor", async () => {
    const { criarCapa, fecharCapa } = await import("@/lib/certificacao/acoes");
    await expect(
      fecharCapa("22222222-1111-4111-8111-111111111111"),
    ).resolves.toEqual({ ok: false, erro: ERRO_SOMENTE_LEITURA });
    await expect(
      criarCapa({
        clienteId: "33333333-1111-4111-8111-111111111111",
        descricao: "Depósito sem sinalização adequada",
        severidade: "menor",
        responsavel: "Fernanda",
        prazo: "2026-10-01",
        origem: "campo",
      }),
    ).resolves.toEqual({ ok: false, erro: ERRO_SOMENTE_LEITURA });
  });

  it("responderItem e concluirVisita recusam o auditor", async () => {
    const { concluirVisita, responderItem } = await import(
      "@/lib/checklists/acoes"
    );
    await expect(
      responderItem({
        visitaId: "44444444-1111-4111-8111-111111111111",
        itemId: "55555555-1111-4111-8111-111111111111",
        resposta: "conforme",
      }),
    ).resolves.toEqual({ ok: false, erro: ERRO_SOMENTE_LEITURA });
    await expect(
      concluirVisita("44444444-1111-4111-8111-111111111111"),
    ).resolves.toEqual({ ok: false, erro: ERRO_SOMENTE_LEITURA });
  });
});
