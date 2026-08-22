import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormularioLogin } from "./formulario-login";

vi.mock("./actions", () => ({
  entrar: vi.fn(),
}));

describe("FormularioLogin", () => {
  it("exibe os campos de e-mail e senha e o botão de entrar", () => {
    render(<FormularioLogin />);

    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled();
  });

  it("marca e-mail e senha como obrigatórios", () => {
    render(<FormularioLogin />);

    expect(screen.getByLabelText("E-mail")).toBeRequired();
    expect(screen.getByLabelText("Senha")).toBeRequired();
  });
});
