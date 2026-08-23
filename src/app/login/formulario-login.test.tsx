import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import PaginaLogin from "./page";
import { FormularioLogin } from "./formulario-login";

vi.mock("./actions", () => ({
  entrar: vi.fn(),
}));

afterEach(cleanup);

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

  it("usa um exemplo de e-mail que serve para qualquer pessoa", () => {
    render(<FormularioLogin />);
    expect(screen.getByLabelText("E-mail")).toHaveAttribute(
      "placeholder",
      "seuemail@exemplo.com",
    );
  });

  it("campos com fonte de 16px e alvo de toque de 44px", () => {
    render(<FormularioLogin />);
    for (const campo of ["E-mail", "Senha"]) {
      const elemento = screen.getByLabelText(campo);
      expect(elemento).toHaveClass("h-11"); // 44px
      expect(elemento).toHaveClass("md:text-base"); // não encolhe para 14px
    }
  });

  it("deixa mostrar a senha digitada", async () => {
    const usuario = userEvent.setup();
    render(<FormularioLogin />);

    const senha = screen.getByLabelText("Senha");
    expect(senha).toHaveAttribute("type", "password");

    await usuario.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(senha).toHaveAttribute("type", "text");

    await usuario.click(screen.getByRole("button", { name: "Esconder senha" }));
    expect(senha).toHaveAttribute("type", "password");
  });
});

describe("Página de login", () => {
  it("troca o aviso sobre app de campo por ajuda de contato de verdade", () => {
    render(<PaginaLogin />);

    expect(screen.queryByText(/Modo offline/)).not.toBeInTheDocument();
    const ajuda = screen.getByRole("region", {
      name: /Precisa de ajuda\? Fale com a gente/,
    });
    expect(within(ajuda).getByText(/WhatsApp/)).toBeInTheDocument();
    expect(within(ajuda).getByText(/Telefone/)).toBeInTheDocument();
  });
});
