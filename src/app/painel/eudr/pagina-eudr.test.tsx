import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PaginaEudr from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(cleanup);

type PropsPagina = Parameters<typeof PaginaEudr>[0];

async function renderizarPagina(cliente?: string) {
  const props = {
    params: Promise.resolve({}),
    searchParams: Promise.resolve(cliente ? { cliente } : {}),
  } as unknown as PropsPagina;
  render(await PaginaEudr(props));
}

/**
 * Sem Supabase no ambiente de teste, a página usa os dados de demonstração:
 * a Fazenda Alto da Serra tem 11 imóveis e 1 mapa (Sítio Alto da Serra —
 * Garagem), então a cobertura EUDR é 1 de 11 (9%).
 */

describe("Página EUDR", () => {
  it("explica o EUDR e mostra o cliente padrão (Alto da Serra)", async () => {
    await renderizarPagina();

    expect(
      screen.getByRole("heading", {
        name: "EUDR — Geolocalização das áreas produtivas",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Exportação \/ Fazenda Alto da Serra/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/polígono de geolocalização de cada área produtiva/),
    ).toBeInTheDocument();
  });

  it("mostra a cobertura de polígonos dos dados de demonstração", async () => {
    await renderizarPagina();

    expect(screen.getByText("1 de 11")).toBeInTheDocument();
    expect(screen.getByText("imóveis com polígono")).toBeInTheDocument();
    expect(screen.getByText("9%")).toBeInTheDocument();
  });

  it("alerta os imóveis sem mapa com link para Imóveis & Talhões", async () => {
    await renderizarPagina();

    expect(
      screen.getByText(/10 imóveis ainda sem polígono/),
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Imóveis & Talhões/ });
    expect(link).toHaveAttribute(
      "href",
      "/painel/imoveis?cliente=alto-da-serra",
    );
  });

  it("tem os dois downloads apontando para as rotas do pacote EUDR", async () => {
    await renderizarPagina();

    expect(
      screen.getByRole("link", { name: /Baixar GeoJSON consolidado/ }),
    ).toHaveAttribute("href", "/api/eudr/geojson?cliente=alto-da-serra");
    expect(
      screen.getByRole("link", { name: /Baixar declaração em PDF/ }),
    ).toHaveAttribute("href", "/api/eudr/pdf?cliente=alto-da-serra");
  });

  it("lista os imóveis com CAR, centroide e situação do polígono", async () => {
    await renderizarPagina();

    // O único imóvel demo com mapa tem o centroide calculado.
    expect(
      screen.getByText("Sítio Alto da Serra (Garagem)"),
    ).toBeInTheDocument();
    expect(screen.getByText("COM polígono")).toBeInTheDocument();
    expect(screen.getAllByText("SEM polígono")).toHaveLength(10);
    expect(screen.getByRole("combobox", { name: "Cliente" })).toBeInTheDocument();
  });
});
