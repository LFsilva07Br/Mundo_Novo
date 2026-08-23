import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PaginaRelatorios from "./page";

describe("Relatórios — balanço de volume e evolução da conformidade", () => {
  it("mostra o balanço de volume certificado com alerta de estouro", async () => {
    render(await PaginaRelatorios());

    expect(
      screen.getByText(/Balanço de volume certificado — safra 2025\/26/),
    ).toBeInTheDocument();
    // Demo: Fazenda Cedro tem 950 sacas em lotes contra previsão de 800.
    expect(
      screen.getByText(/ALERTA: 1 cliente\(s\) com lotes acima da previsão/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Estouro — lotes acima da previsão"),
    ).toBeInTheDocument();
  });

  it("mostra a evolução da conformidade com o benchmarking da carteira", async () => {
    render(await PaginaRelatorios());

    expect(screen.getByText("Evolução da conformidade")).toBeInTheDocument();
    expect(screen.getByText("Benchmarking da carteira")).toBeInTheDocument();
    // Ranking: alguém acima e alguém abaixo da média.
    expect(screen.getAllByText(/\+\d+ pt\(s\)/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/-\d+ pt\(s\)/).length).toBeGreaterThan(0);
    // Rótulos de mês dos mini-gráficos de barras.
    expect(screen.getAllByText("ago/26").length).toBeGreaterThan(0);
  });
});
