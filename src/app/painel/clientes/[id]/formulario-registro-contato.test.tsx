import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormularioRegistroContato } from "./formulario-registro-contato";

vi.mock("@/lib/carteira/acoes", () => ({
  registrarContato: vi.fn(),
}));

describe("FormularioRegistroContato", () => {
  it("mostra o botão de novo registro com o dialog fechado", () => {
    render(<FormularioRegistroContato clienteId="cedro" />);
    expect(
      screen.getByRole("button", { name: /novo registro/i }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Assunto")).not.toBeInTheDocument();
  });

  it("exibe os campos do registro com os tipos de contato", () => {
    render(<FormularioRegistroContato clienteId="cedro" abertoInicialmente />);

    expect(screen.getByLabelText("Tipo")).toBeInTheDocument();
    for (const tipo of ["Ligação", "E-mail", "WhatsApp", "Reunião", "Visita"]) {
      expect(screen.getByRole("option", { name: tipo })).toBeInTheDocument();
    }
    expect(screen.getByLabelText("Assunto")).toBeRequired();
    expect(screen.getByLabelText("Detalhes (opcional)")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Duração em minutos (opcional)"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Quando ocorreu")).toBeRequired();
    expect(
      screen.getByRole("button", { name: "Registrar contato" }),
    ).toBeEnabled();
  });
});
