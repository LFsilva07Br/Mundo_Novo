import { afterEach, describe, expect, it, vi } from "vitest";
import LayoutPortal from "./layout";
import { perfilPortal } from "@/lib/portal/sessao";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((destino: string) => {
    throw new Error(`REDIRECT:${destino}`);
  }),
  usePathname: () => "/portal",
}));

vi.mock("@/lib/portal/sessao", () => ({
  perfilPortal: vi.fn(async () => null),
}));

const perfilPortalMock = vi.mocked(perfilPortal);

type PropsLayout = Parameters<typeof LayoutPortal>[0];
const props = { children: null } as unknown as PropsLayout;

afterEach(() => {
  vi.clearAllMocks();
});

describe("Layout do portal", () => {
  it("manda usuário de equipe (sem vínculo de cliente) para o painel", async () => {
    perfilPortalMock.mockResolvedValue(null);
    await expect(LayoutPortal(props)).rejects.toThrow("REDIRECT:/painel");
  });

  it("renderiza a casca para o produtor com o nome da fazenda", async () => {
    perfilPortalMock.mockResolvedValue({
      clienteId: "alto-da-serra",
      nome: "Fazenda Alto da Serra",
    });
    const elemento = await LayoutPortal(props);
    expect(elemento).toBeTruthy();
  });
});
