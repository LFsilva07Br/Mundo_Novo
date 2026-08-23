import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import PaginaAgro from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(cleanup);

type PropsPagina = Parameters<typeof PaginaAgro>[0];

async function renderizarPagina(cliente?: string) {
  const props = {
    params: Promise.resolve({}),
    searchParams: Promise.resolve(cliente ? { cliente } : {}),
  } as unknown as PropsPagina;
  render(await PaginaAgro(props));
}

/**
 * Sem Supabase no ambiente de teste, a página renderiza com os dados de
 * demonstração — mesma estrutura usada com o banco conectado.
 */

describe("Página Agroquímicos", () => {
  it("mostra o cabeçalho com o cliente padrão (Alto da Serra)", async () => {
    await renderizarPagina();
    expect(
      screen.getByRole("heading", { name: "Agroquímicos" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Módulo agro · Fazenda Alto da Serra/),
    ).toBeInTheDocument();
  });

  it("tem o seletor de cliente e os botões de ação", async () => {
    await renderizarPagina();
    expect(
      screen.getByRole("combobox", { name: "Selecionar cliente" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Nova aplicação/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Novo produto/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Registrar destinação/ }),
    ).toBeInTheDocument();
  });

  it("mostra os KPIs calculados dos dados de demonstração", async () => {
    await renderizarPagina();
    expect(screen.getByText("aplicações no ano")).toBeInTheDocument();
    // 2 de 3 aplicações com treinamento NR-31 válido na data.
    expect(screen.getByText("67%")).toBeInTheDocument();
    expect(
      screen.getByText("produtos proibidos usados (meta: 0)"),
    ).toBeInTheDocument();
    // 48 embalagens destinadas na demonstração.
    expect(screen.getByText("48")).toBeInTheDocument();
  });

  it("lista as aplicações com os badges de alerta", async () => {
    await renderizarPagina();
    // Tabela de aplicações + catálogo mostram o produto proibido.
    expect(screen.getAllByText("Paraquate 200 SL").length).toBeGreaterThan(0);
    expect(screen.getByText("Produto proibido pela RA")).toBeInTheDocument();
    expect(screen.getByText("Treinamento NR-31 vencido")).toBeInTheDocument();
    expect(screen.getByText("Em conformidade")).toBeInTheDocument();
  });

  it("mostra o catálogo e filtra só os proibidos pela RA", async () => {
    const usuario = userEvent.setup();
    await renderizarPagina();

    // Catálogo completo: 2 permitidos + 1 proibido pela RA.
    expect(screen.getAllByText("Permitido")).toHaveLength(2);
    expect(screen.getByText("Proibido pela RA")).toBeInTheDocument();

    await usuario.click(
      screen.getByRole("checkbox", { name: /Só proibidos pela RA/ }),
    );
    expect(screen.queryByText("Permitido")).not.toBeInTheDocument();
    expect(screen.getByText("Proibido pela RA")).toBeInTheDocument();
  });

  it("mostra a destinação de embalagens com comprovante", async () => {
    await renderizarPagina();
    expect(screen.getByText(/48 embalagens/)).toBeInTheDocument();
    expect(screen.getByText("Com comprovante")).toBeInTheDocument();
  });

  it("aceita a troca de cliente via parâmetro ?cliente=", async () => {
    await renderizarPagina("bernardes");
    expect(
      screen.getByText(/Módulo agro · Fazenda Bernardes/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Nenhuma aplicação registrada para este cliente."),
    ).toBeInTheDocument();
  });
});
