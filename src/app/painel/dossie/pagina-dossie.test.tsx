import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PaginaDossie from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

type PropsPagina = Parameters<typeof PaginaDossie>[0];

async function renderizarPagina(parametros: Record<string, string> = {}) {
  const props = {
    params: Promise.resolve({}),
    searchParams: Promise.resolve(parametros),
  } as unknown as PropsPagina;
  render(await PaginaDossie(props));
}

/** Sem Supabase no teste, o dossiê usa os dados de demonstração. */
describe("Página Dossiê do cliente", () => {
  it("abre com o primeiro cliente e todas as seções", async () => {
    await renderizarPagina();
    expect(screen.getByText(/Dossiê consolidado/)).toBeInTheDocument();
    expect(screen.getByText("Certificações e vencimentos")).toBeInTheDocument();
    expect(screen.getByText("Visitas concluídas")).toBeInTheDocument();
    expect(screen.getByText("CAPAs — planos de ação")).toBeInTheDocument();
    expect(
      screen.getByText("Documentos dos imóveis rurais"),
    ).toBeInTheDocument();
    expect(screen.getByText("Treinamentos da equipe")).toBeInTheDocument();
  });

  it("aceita o cliente pela URL e mostra visitas com conformidade", async () => {
    await renderizarPagina({ cliente: "alto-da-serra" });
    expect(
      screen.getByRole("heading", { name: "Fazenda Alto da Serra" }),
    ).toBeInTheDocument();
  });

  it("por padrão oculta CAPAs fechadas, com link para mostrar", async () => {
    await renderizarPagina({ cliente: "alto-da-serra" });
    expect(
      screen.getByRole("link", { name: "Mostrar fechadas" }),
    ).toHaveAttribute(
      "href",
      "/painel/dossie?cliente=alto-da-serra&fechadas=1",
    );
  });

  it("com ?fechadas=1 mostra o histórico completo", async () => {
    await renderizarPagina({ cliente: "alto-da-serra", fechadas: "1" });
    expect(
      screen.getByText("Histórico completo, incluindo CAPAs fechadas."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ocultar fechadas" }),
    ).toBeInTheDocument();
  });

  it("tem seletor de cliente e botão de imprimir", async () => {
    await renderizarPagina();
    expect(
      screen.getByRole("combobox", { name: "Selecionar cliente do dossiê" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Imprimir dossiê/ }),
    ).toBeInTheDocument();
  });
});
