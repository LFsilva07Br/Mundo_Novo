import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Grupo } from "@/lib/carteira/tipos";
import { FormularioGrupo } from "./formulario-grupo";

vi.mock("@/lib/carteira/acoes", () => ({
  criarGrupo: vi.fn(),
  atualizarGrupo: vi.fn(),
}));

const GRUPO: Grupo = {
  id: "cerrado-mineiro",
  nome: "Grupo Cerrado Mineiro",
  administracao: "mundo_novo",
  cidade: "Patrocínio",
  uf: "MG",
};

describe("FormularioGrupo", () => {
  it("mostra o botão de novo grupo com o dialog fechado", () => {
    render(<FormularioGrupo />);
    expect(
      screen.getByRole("button", { name: /novo grupo/i }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Nome do grupo")).not.toBeInTheDocument();
  });

  it("exibe os campos do grupo ao abrir para criação", () => {
    render(<FormularioGrupo abertoInicialmente />);

    expect(screen.getByLabelText("Nome do grupo")).toBeRequired();
    expect(screen.getByLabelText("Administração")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Nome do administrador (se terceiro)"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Cidade")).toBeInTheDocument();
    expect(screen.getByLabelText("UF")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Criar grupo" }),
    ).toBeEnabled();
  });

  it("preenche os campos com os dados do grupo ao editar", () => {
    render(<FormularioGrupo grupo={GRUPO} abertoInicialmente />);

    expect(screen.getByLabelText("Nome do grupo")).toHaveValue(
      "Grupo Cerrado Mineiro",
    );
    expect(screen.getByLabelText("Cidade")).toHaveValue("Patrocínio");
    expect(screen.getByLabelText("UF")).toHaveValue("MG");
    expect(
      screen.getByRole("button", { name: "Salvar alterações" }),
    ).toBeEnabled();
  });
});
