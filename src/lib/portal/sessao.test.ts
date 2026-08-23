import { afterEach, describe, expect, it, vi } from "vitest";
import { PERFIL_PORTAL_DEMO, perfilPortal } from "./sessao";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => null),
}));

const criarClienteMock = vi.mocked(createClient);

/** Cliente Supabase falso com o perfil devolvido pela consulta. */
function clienteFalso({
  logado = true,
  perfil = null,
}: {
  logado?: boolean;
  perfil?: {
    cliente_id: string | null;
    cliente: { nome: string } | { nome: string }[] | null;
  } | null;
}) {
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: {
          user: logado ? { id: "11111111-1111-4111-8111-111111111111" } : null,
        },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({ data: perfil, error: null })),
        })),
      })),
    })),
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("perfilPortal", () => {
  it("em modo demonstração devolve a Fazenda Alto da Serra", async () => {
    criarClienteMock.mockResolvedValue(null);
    expect(await perfilPortal()).toEqual(PERFIL_PORTAL_DEMO);
    expect(PERFIL_PORTAL_DEMO.clienteId).toBe("alto-da-serra");
  });

  it("devolve null sem sessão ativa", async () => {
    criarClienteMock.mockResolvedValue(clienteFalso({ logado: false }) as never);
    expect(await perfilPortal()).toBeNull();
  });

  it("devolve null para perfil de equipe (sem cliente_id)", async () => {
    criarClienteMock.mockResolvedValue(
      clienteFalso({ perfil: { cliente_id: null, cliente: null } }) as never,
    );
    expect(await perfilPortal()).toBeNull();
  });

  it("devolve o vínculo do produtor com o nome da fazenda", async () => {
    criarClienteMock.mockResolvedValue(
      clienteFalso({
        perfil: {
          cliente_id: "cliente-1",
          cliente: { nome: "Fazenda Alto da Serra" },
        },
      }) as never,
    );
    expect(await perfilPortal()).toEqual({
      clienteId: "cliente-1",
      nome: "Fazenda Alto da Serra",
    });
  });

  it("aceita o relacionamento vindo como lista e usa reserva sem nome", async () => {
    criarClienteMock.mockResolvedValue(
      clienteFalso({
        perfil: { cliente_id: "cliente-2", cliente: [] },
      }) as never,
    );
    expect(await perfilPortal()).toEqual({
      clienteId: "cliente-2",
      nome: "Minha fazenda",
    });
  });
});
