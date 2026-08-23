import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Cliente, Grupo } from "@/lib/carteira/tipos";
import { FormularioCliente } from "./formulario-cliente";

vi.mock("@/lib/carteira/acoes", () => ({
  criarCliente: vi.fn(),
  atualizarCliente: vi.fn(),
}));

const GRUPOS: Grupo[] = [
  { id: "cerrado-mineiro", nome: "Grupo Cerrado Mineiro", administracao: "mundo_novo" },
  { id: "expocaccer", nome: "Expocaccer", administracao: "terceiro" },
];

const CLIENTE: Cliente = {
  id: "cedro",
  grupoId: "cerrado-mineiro",
  nome: "Fazenda Cedro",
  tipo: "fazenda",
  fase: "ativo",
  cidade: "Serra do Salitre",
  uf: "MG",
  regiao: "Cerrado Mineiro",
  certificacoes: [],
};

describe("FormularioCliente", () => {
  it("mostra o botão de novo cliente com o dialog fechado", () => {
    render(<FormularioCliente grupos={GRUPOS} />);
    expect(
      screen.getByRole("button", { name: /novo cliente/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Nome do cliente"),
    ).not.toBeInTheDocument();
  });

  it("exibe os campos do cliente novo, com grupos no select e fase fixa", () => {
    render(<FormularioCliente grupos={GRUPOS} abertoInicialmente />);

    expect(screen.getByLabelText("Nome do cliente")).toBeRequired();
    expect(screen.getByLabelText("Tipo")).toBeInTheDocument();
    expect(screen.getByLabelText("Produtor (opcional)")).toBeInTheDocument();
    expect(screen.getByLabelText("Cidade")).toBeRequired();
    expect(screen.getByLabelText("UF")).toBeRequired();
    expect(screen.getByLabelText("Região")).toBeRequired();

    const selectGrupo = screen.getByLabelText("Grupo");
    expect(selectGrupo).toHaveValue("");
    expect(
      screen.getByRole("option", { name: "Sem grupo (cliente direto)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Grupo Cerrado Mineiro" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Expocaccer" }),
    ).toBeInTheDocument();

    // Cliente novo não escolhe fase: começa em implantação (regra do produto).
    expect(screen.queryByLabelText("Fase")).not.toBeInTheDocument();
    expect(screen.getByText(/fase inicial/i)).toBeInTheDocument();
  });

  it("na edição preenche os dados e permite mudar a fase", () => {
    render(
      <FormularioCliente grupos={GRUPOS} cliente={CLIENTE} abertoInicialmente />,
    );

    expect(screen.getByLabelText("Nome do cliente")).toHaveValue(
      "Fazenda Cedro",
    );
    expect(screen.getByLabelText("Grupo")).toHaveValue("cerrado-mineiro");
    expect(screen.getByLabelText("Fase")).toHaveValue("ativo");
    expect(
      screen.getByRole("button", { name: "Salvar alterações" }),
    ).toBeEnabled();
  });
});
