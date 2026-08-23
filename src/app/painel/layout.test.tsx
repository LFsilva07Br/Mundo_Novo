import { afterEach, describe, expect, it, vi } from "vitest";
import LayoutPainel from "./layout";
import { createClient, getUsuarioAtual } from "@/lib/supabase/server";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((destino: string) => {
    throw new Error(`REDIRECT:${destino}`);
  }),
  usePathname: () => "/painel",
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => null),
  getUsuarioAtual: vi.fn(async () => null),
}));

const criarClienteMock = vi.mocked(createClient);
const usuarioAtualMock = vi.mocked(getUsuarioAtual);

function clienteComPerfil(perfil: {
  deve_trocar_senha: boolean;
  cliente_id: string | null;
}) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({ data: perfil, error: null })),
        })),
      })),
    })),
  };
}

type PropsLayout = Parameters<typeof LayoutPainel>[0];
const props = { children: null } as unknown as PropsLayout;

afterEach(() => {
  vi.clearAllMocks();
});

describe("Layout do painel", () => {
  it("manda o produtor (perfil com cliente_id) para o portal", async () => {
    usuarioAtualMock.mockResolvedValue({ id: "u1", email: "p@x.com" } as never);
    criarClienteMock.mockResolvedValue(
      clienteComPerfil({
        deve_trocar_senha: false,
        cliente_id: "cliente-1",
      }) as never,
    );
    await expect(LayoutPainel(props)).rejects.toThrow("REDIRECT:/portal");
  });

  it("mantém a prioridade da senha provisória mesmo para o produtor", async () => {
    usuarioAtualMock.mockResolvedValue({ id: "u1", email: "p@x.com" } as never);
    criarClienteMock.mockResolvedValue(
      clienteComPerfil({
        deve_trocar_senha: true,
        cliente_id: "cliente-1",
      }) as never,
    );
    await expect(LayoutPainel(props)).rejects.toThrow(
      "REDIRECT:/definir-senha?obrigatoria=1",
    );
  });

  it("deixa a equipe (sem cliente_id) usar o painel normalmente", async () => {
    usuarioAtualMock.mockResolvedValue({ id: "u2", email: "e@x.com" } as never);
    criarClienteMock.mockResolvedValue(
      clienteComPerfil({ deve_trocar_senha: false, cliente_id: null }) as never,
    );
    const elemento = await LayoutPainel(props);
    expect(elemento).toBeTruthy();
  });
});
