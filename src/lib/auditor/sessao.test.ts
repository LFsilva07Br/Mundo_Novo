import { beforeEach, describe, expect, it, vi } from "vitest";
import { ehAuditor, perfilEhAuditor } from "./sessao";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => null),
}));

function supabaseComPerfil(
  usuario: { id: string } | null,
  perfil: { papel: string; cliente_id: string | null } | null,
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

describe("perfilEhAuditor — regra pura", () => {
  it("é auditor quando o papel é auditor e não há cliente vinculado", () => {
    expect(perfilEhAuditor({ papel: "auditor", clienteId: null })).toBe(true);
  });

  it("papel auditor COM cliente vinculado não conta (é caso de portal)", () => {
    expect(perfilEhAuditor({ papel: "auditor", clienteId: "cliente-1" })).toBe(
      false,
    );
  });

  it("os demais papéis nunca são auditor", () => {
    for (const papel of ["gestor", "diretoria", "consultor", "comercial"]) {
      expect(perfilEhAuditor({ papel, clienteId: null })).toBe(false);
    }
  });

  it("sem perfil, não é auditor", () => {
    expect(perfilEhAuditor(null)).toBe(false);
    expect(perfilEhAuditor(undefined)).toBe(false);
  });
});

describe("ehAuditor — sessão logada", () => {
  it("é falso em modo demonstração (sem Supabase)", async () => {
    await expect(ehAuditor()).resolves.toBe(false);
  });

  it("é falso sem usuário logado", async () => {
    vi.mocked(createClient).mockResolvedValue(
      supabaseComPerfil(null, null) as never,
    );
    await expect(ehAuditor()).resolves.toBe(false);
  });

  it("é verdadeiro para o perfil auditor sem cliente", async () => {
    vi.mocked(createClient).mockResolvedValue(
      supabaseComPerfil(
        { id: "u1" },
        { papel: "auditor", cliente_id: null },
      ) as never,
    );
    await expect(ehAuditor()).resolves.toBe(true);
  });

  it("é falso para a equipe (gestor)", async () => {
    vi.mocked(createClient).mockResolvedValue(
      supabaseComPerfil(
        { id: "u2" },
        { papel: "gestor", cliente_id: null },
      ) as never,
    );
    await expect(ehAuditor()).resolves.toBe(false);
  });
});
