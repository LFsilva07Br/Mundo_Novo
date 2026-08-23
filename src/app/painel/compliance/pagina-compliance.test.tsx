import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import PaginaCompliance from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(cleanup);

type PropsPagina = Parameters<typeof PaginaCompliance>[0];

async function renderizarPagina(parametros: Record<string, string> = {}) {
  const props = {
    params: Promise.resolve({}),
    searchParams: Promise.resolve(parametros),
  } as unknown as PropsPagina;
  render(await PaginaCompliance(props));
}

/**
 * Sem Supabase no ambiente de teste, a página renderiza com os dados de
 * demonstração — mesma estrutura usada com o banco conectado.
 */

describe("Página Compliance Social", () => {
  it("mostra o cabeçalho, os KPIs e as três abas", async () => {
    await renderizarPagina();
    expect(
      screen.getByRole("heading", { name: "Compliance Social" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("casos em aberto ou remediação"),
    ).toBeInTheDocument();
    expect(screen.getByText("queixas aguardando triagem")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Casos" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Queixas" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Plano de gestão" }),
    ).toBeInTheDocument();
  });

  it("lista os casos com tipo, status e ação de atualização", async () => {
    await renderizarPagina();
    expect(screen.getByText("Assédio")).toBeInTheDocument();
    expect(screen.getByText("Em remediação")).toBeInTheDocument();
    expect(screen.getByText("Encerrado")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Atualizar status" }).length,
    ).toBeGreaterThan(0);
  });

  it("exige remediação para encerrar um caso no dialog", async () => {
    const usuario = userEvent.setup();
    await renderizarPagina();

    await usuario.click(
      screen.getAllByRole("button", { name: "Atualizar status" })[0],
    );
    expect(
      screen.getByRole("heading", { name: "Atualizar status do caso" }),
    ).toBeInTheDocument();

    // O caso demo está "em remediação"; ao escolher encerrar, o campo de
    // remediação passa a ser obrigatório com o aviso da regra.
    const seletor = screen.getByLabelText("Novo status");
    await usuario.selectOptions(seletor, "encerrado");
    expect(
      screen.getByText("Sem a remediação descrita, o encerramento é recusado."),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Remediação aplicada \(obrigatória para encerrar\)/),
    ).toBeRequired();
  });

  it("mostra a fila de queixas com triagem e canal público", async () => {
    const usuario = userEvent.setup();
    await renderizarPagina();

    await usuario.click(screen.getByRole("tab", { name: "Queixas" }));
    expect(screen.getByText(/chuveiro do alojamento/i)).toBeInTheDocument();
    expect(screen.getAllByText("Anônima").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Triar → caso" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copiar link do canal de queixas" }),
    ).toBeInTheDocument();
    expect(screen.getByText("/queixa/alto-da-serra")).toBeInTheDocument();
  });

  it("abre a triagem com a mensagem da queixa pré-preenchida", async () => {
    const usuario = userEvent.setup();
    await renderizarPagina();

    await usuario.click(screen.getByRole("tab", { name: "Queixas" }));
    await usuario.click(screen.getByRole("button", { name: "Triar → caso" }));
    expect(
      screen.getByRole("heading", { name: "Converter queixa em caso" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Descrição do caso")).toHaveDisplayValue(
      /chuveiro do alojamento/,
    );
  });

  it("mostra o editor do plano de gestão com riscos e metas do ano", async () => {
    const usuario = userEvent.setup();
    await renderizarPagina({ ano: "2026" });

    await usuario.click(screen.getByRole("tab", { name: "Plano de gestão" }));
    expect(screen.getByText("Avaliação de riscos")).toBeInTheDocument();
    expect(screen.getByLabelText("Descrição do risco 1")).toHaveValue(
      "Jornada excessiva na colheita (pico de safra).",
    );
    expect(screen.getByLabelText("Meta 2 concluída")).toBeChecked();
    expect(
      screen.getByRole("button", { name: "Adicionar risco" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Adicionar meta" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Salvar plano 2026" }),
    ).toBeInTheDocument();
  });

  it("adiciona e remove linhas dinâmicas de risco no editor", async () => {
    const usuario = userEvent.setup();
    await renderizarPagina({ ano: "2026" });

    await usuario.click(screen.getByRole("tab", { name: "Plano de gestão" }));
    await usuario.click(screen.getByRole("button", { name: "Adicionar risco" }));
    expect(screen.getByLabelText("Descrição do risco 3")).toBeInTheDocument();

    await usuario.click(
      screen.getByRole("button", { name: "Remover risco 3" }),
    );
    expect(
      screen.queryByLabelText("Descrição do risco 3"),
    ).not.toBeInTheDocument();
  });
});
