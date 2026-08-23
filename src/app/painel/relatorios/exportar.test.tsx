import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BotoesExportar, CartaoRelatorioMensal } from "./exportar";

describe("BotoesExportar", () => {
  it("gera links Excel e PDF direto ao handler, em nova aba", () => {
    render(
      <BotoesExportar
        base="/api/relatorios/safra"
        parametros={{ cliente: "alto-da-serra" }}
      />,
    );

    const excel = screen.getByRole("link", { name: /excel/i });
    const pdf = screen.getByRole("link", { name: /pdf/i });

    expect(excel).toHaveAttribute(
      "href",
      "/api/relatorios/safra?cliente=alto-da-serra&formato=xlsx",
    );
    expect(pdf).toHaveAttribute(
      "href",
      "/api/relatorios/safra?cliente=alto-da-serra&formato=pdf",
    );
    expect(excel).toHaveAttribute("target", "_blank");
    expect(pdf).toHaveAttribute("target", "_blank");
  });

  it("aceita rótulos personalizados (pacote completo de CAPAs)", () => {
    render(
      <BotoesExportar
        base="/api/relatorios/capas"
        rotuloExcel="Excel completo"
        rotuloPdf="PDF completo"
      />,
    );
    expect(
      screen.getByRole("link", { name: "Excel completo" }),
    ).toHaveAttribute("href", "/api/relatorios/capas?formato=xlsx");
  });
});

describe("CartaoRelatorioMensal", () => {
  const clientes = [
    { id: "alto-da-serra", nome: "Fazenda Alto da Serra" },
    { id: "cedro", nome: "Fazenda Cedro" },
  ];

  it("gera o PDF mensal do primeiro cliente por padrão", () => {
    render(<CartaoRelatorioMensal clientes={clientes} />);

    expect(screen.getByText("Relatório mensal por cliente")).toBeInTheDocument();
    const botao = screen.getByRole("link", { name: /gerar pdf mensal/i });
    expect(botao).toHaveAttribute(
      "href",
      "/api/relatorios/mensal?formato=pdf&cliente=alto-da-serra",
    );
    expect(botao).toHaveAttribute("target", "_blank");
  });

  it("trocar o cliente no select atualiza o link do PDF", async () => {
    const usuario = userEvent.setup();
    render(<CartaoRelatorioMensal clientes={clientes} />);

    await usuario.selectOptions(
      screen.getByLabelText("Cliente do relatório mensal"),
      "cedro",
    );

    expect(
      screen.getByRole("link", { name: /gerar pdf mensal/i }),
    ).toHaveAttribute("href", "/api/relatorios/mensal?formato=pdf&cliente=cedro");
  });
});
