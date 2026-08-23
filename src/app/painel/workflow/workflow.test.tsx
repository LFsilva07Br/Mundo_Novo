import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import PaginaWorkflow from "./page";

afterEach(cleanup);

describe("Página do workflow de certificação", () => {
  it("mostra as 6 colunas do ciclo, com Implantação antes da Auditoria interna", async () => {
    render(await PaginaWorkflow());

    const colunas = [
      "Implantação",
      "Auditoria interna",
      "Correção de NCs",
      "Revisão do gestor",
      "Na certificadora",
      "Aprovado",
    ];
    for (const coluna of colunas) {
      expect(screen.getByText(coluna)).toBeInTheDocument();
    }
  });

  it("mostra os 8 clientes no quadro com botão de avançar (menos os aprovados)", async () => {
    render(await PaginaWorkflow());

    expect(screen.getByText("Fazenda Alto da Serra")).toBeInTheDocument();
    expect(screen.getByText("Fazenda Lagoinha")).toBeInTheDocument();

    // 8 clientes na demo, 1 aprovado → 7 botões de avançar.
    const botoes = screen.getAllByRole("button", { name: /Avançar/ });
    expect(botoes).toHaveLength(7);
  });

  it("mostra o histórico de movimentos abaixo do quadro", async () => {
    render(await PaginaWorkflow());

    expect(screen.getByText("Últimos movimentos")).toBeInTheDocument();
    expect(
      screen.getByText(/Nenhum movimento registrado ainda/),
    ).toBeInTheDocument();
  });
});
