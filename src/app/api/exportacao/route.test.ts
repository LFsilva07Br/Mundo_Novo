import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { GET } from "./route";
import { montarExportacao } from "@/lib/exportacao/dados";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => null),
}));

vi.mock("@/lib/exportacao/dados", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/exportacao/dados")>();
  return {
    ...original,
    montarExportacao: vi.fn(async () => ({
      sistema: "Mundo Novo Café",
      finalidade: "teste",
      geradoEm: "2026-08-23T12:00:00.000Z",
      escopo: "carteira",
      totalClientes: 1,
      clientes: [],
    })),
  };
});

function requisicao(url = "http://localhost/api/exportacao"): NextRequest {
  return { nextUrl: new URL(url) } as unknown as NextRequest;
}

function supabaseComPerfil(
  usuario: { id: string } | null,
  perfil: { papel: string } | null,
) {
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: usuario } })) },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({ data: perfil, error: null })),
        })),
      })),
    })),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockResolvedValue(null);
});

describe("GET /api/exportacao — permissão", () => {
  it("sem usuário logado (com banco) responde 401", async () => {
    vi.mocked(createClient).mockResolvedValue(
      supabaseComPerfil(null, null) as never,
    );
    const resposta = await GET(requisicao());
    expect(resposta.status).toBe(401);
  });

  it("consultor não baixa a exportação (403)", async () => {
    vi.mocked(createClient).mockResolvedValue(
      supabaseComPerfil({ id: "u1" }, { papel: "consultor" }) as never,
    );
    const resposta = await GET(requisicao());
    expect(resposta.status).toBe(403);
  });

  it("auditor externo também não (403)", async () => {
    vi.mocked(createClient).mockResolvedValue(
      supabaseComPerfil({ id: "u2" }, { papel: "auditor" }) as never,
    );
    const resposta = await GET(requisicao());
    expect(resposta.status).toBe(403);
  });

  it("gestor baixa o JSON como download com a data no nome", async () => {
    vi.mocked(createClient).mockResolvedValue(
      supabaseComPerfil({ id: "u3" }, { papel: "gestor" }) as never,
    );
    const resposta = await GET(requisicao());
    expect(resposta.status).toBe(200);
    expect(resposta.headers.get("Content-Type")).toContain("application/json");
    expect(resposta.headers.get("Content-Disposition")).toMatch(
      /attachment; filename="exportacao-mundo-novo-carteira-completa-\d{4}-\d{2}-\d{2}\.json"/,
    );
    const corpo = await resposta.json();
    expect(corpo.sistema).toBe("Mundo Novo Café");
  });

  it("diretoria também baixa (200)", async () => {
    vi.mocked(createClient).mockResolvedValue(
      supabaseComPerfil({ id: "u4" }, { papel: "diretoria" }) as never,
    );
    const resposta = await GET(requisicao());
    expect(resposta.status).toBe(200);
  });
});

describe("GET /api/exportacao — escopo por cliente", () => {
  it("repassa o ?cliente= para a montagem", async () => {
    const resposta = await GET(
      requisicao("http://localhost/api/exportacao?cliente=alto-da-serra"),
    );
    expect(resposta.status).toBe(200);
    expect(vi.mocked(montarExportacao)).toHaveBeenCalledWith("alto-da-serra");
  });

  it("cliente inexistente responde 404", async () => {
    vi.mocked(montarExportacao).mockResolvedValue(null);
    const resposta = await GET(
      requisicao("http://localhost/api/exportacao?cliente=nao-existe"),
    );
    expect(resposta.status).toBe(404);
  });
});
