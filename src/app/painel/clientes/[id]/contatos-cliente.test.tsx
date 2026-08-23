import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ContatoCliente } from "@/lib/carteira/tipos";
import { ContatosCliente } from "./contatos-cliente";

vi.mock("@/lib/carteira/acoes", () => ({
  adicionarContato: vi.fn(),
  removerContato: vi.fn(),
}));

const CONTATOS: ContatoCliente[] = [
  { nome: "Silvio Dutra", area: "proprietario" },
  { nome: "Tâmara Isa da Silva", area: "ambiental" },
];

describe("ContatosCliente", () => {
  it("lista os contatos com a área e o botão de remover", () => {
    render(<ContatosCliente clienteId="alto-da-serra" contatos={CONTATOS} />);

    const tabela = within(screen.getByRole("table"));
    expect(tabela.getByText("Silvio Dutra")).toBeInTheDocument();
    expect(tabela.getByText("Proprietário")).toBeInTheDocument();
    expect(tabela.getByText("Ambiental")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remover contato Silvio Dutra" }),
    ).toBeEnabled();
  });

  it("exibe o formulário de novo contato com todas as áreas", () => {
    render(<ContatosCliente clienteId="alto-da-serra" contatos={CONTATOS} />);

    expect(screen.getByLabelText("Nome")).toBeRequired();
    expect(screen.getByLabelText("Área")).toBeInTheDocument();
    expect(screen.getByLabelText("Telefone (opcional)")).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail (opcional)")).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Agrícola / Talhões" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Adicionar contato" }),
    ).toBeEnabled();
  });

  it("sem contatos, convida a cadastrar o primeiro", () => {
    render(<ContatosCliente clienteId="alto-da-serra" contatos={[]} />);
    expect(
      screen.getByText(/nenhum contato cadastrado ainda/i),
    ).toBeInTheDocument();
  });
});
