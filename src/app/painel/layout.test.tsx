import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LayoutPainel from "./layout";
import { createClient, getUsuarioAtual } from "@/lib/supabase/server";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((destino: string) => {
    throw new Error(`REDIRECT:${destino}`);
  }),
  usePathname: () => "/painel",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => null),
  getUsuarioAtual: vi.fn(async () => null),
}));

// O Toaster do sonner depende de window.matchMedia, que o jsdom não tem.
vi.mock("@/components/ui/sonner", () => ({ Toaster: () => null }));

// A busca global do cabeçalho carrega a carteira; aqui basta uma lista curta.
vi.mock("@/lib/carteira/consultas", () => ({
  listarClientes: vi.fn(async () => [
    { id: "cedro", nome: "Fazenda Cedro", cidade: "Serra do Salitre", uf: "MG" },
  ]),
}));

const criarClienteMock = vi.mocked(createClient);
const usuarioAtualMock = vi.mocked(getUsuarioAtual);

function clienteComPerfil(perfil: {
  deve_trocar_senha: boolean;
  cliente_id: string | null;
  papel?: string;
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

  it("mostra o banner fixo de somente leitura para o auditor", async () => {
    usuarioAtualMock.mockResolvedValue({ id: "u3", email: "a@x.com" } as never);
    criarClienteMock.mockResolvedValue(
      clienteComPerfil({
        deve_trocar_senha: false,
        cliente_id: null,
        papel: "auditor",
      }) as never,
    );
    render(await LayoutPainel(props));
    expect(screen.getByText(/Modo auditor — somente leitura/)).toBeInTheDocument();
  });

  it("não mostra o banner de auditor para a equipe", async () => {
    usuarioAtualMock.mockResolvedValue({ id: "u4", email: "g@x.com" } as never);
    criarClienteMock.mockResolvedValue(
      clienteComPerfil({
        deve_trocar_senha: false,
        cliente_id: null,
        papel: "gestor",
      }) as never,
    );
    render(await LayoutPainel(props));
    expect(screen.queryByText(/Modo auditor/)).toBeNull();
  });
});
