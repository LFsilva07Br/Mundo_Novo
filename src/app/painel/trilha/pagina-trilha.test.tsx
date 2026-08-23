import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PaginaTrilha from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

type PropsPagina = Parameters<typeof PaginaTrilha>[0];

async function renderizarPagina(parametros: Record<string, string> = {}) {
  const props = {
    params: Promise.resolve({}),
    searchParams: Promise.resolve(parametros),
  } as unknown as PropsPagina;
  render(await PaginaTrilha(props));
}

/** Sem Supabase no teste, a página mostra os eventos de demonstração. */
describe("Página Trilha de auditoria", () => {
  it("mostra o cabeçalho e o aviso de registro imutável", async () => {
    await renderizarPagina();
    expect(
      screen.getByRole("heading", { name: "Trilha de auditoria" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Registro imutável — os eventos da trilha não podem ser editados nem apagados/),
    ).toBeInTheDocument();
  });

  it("lista os eventos com tabela traduzida, ação e autor", async () => {
    await renderizarPagina();
    expect(screen.getAllByText("CAPAs").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Alteração").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Fernanda Prado").length).toBeGreaterThan(0);
    // Resumo extraído do jsonb.
    expect(
      screen.getByText(/nº 131 — Depósito de defensivos sem sinalização/),
    ).toBeInTheDocument();
  });

  it("tem os filtros de tabela e ação", async () => {
    await renderizarPagina();
    expect(
      screen.getByRole("combobox", { name: "Filtrar por tabela" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Filtrar por ação" }),
    ).toBeInTheDocument();
  });

  it("filtra por tabela via parâmetro da URL", async () => {
    await renderizarPagina({ tabela: "lotes" });
    expect(screen.getByText(/1 evento\(s\) com os filtros aplicados/)).toBeInTheDocument();
    expect(screen.queryByText("Contratos", { selector: "td" })).toBeNull();
  });

  it("filtro sem resultado mostra o aviso vazio", async () => {
    await renderizarPagina({ tabela: "capas", acao: "remover" });
    expect(
      screen.getByText("Nenhum evento encontrado com os filtros escolhidos."),
    ).toBeInTheDocument();
  });
});
