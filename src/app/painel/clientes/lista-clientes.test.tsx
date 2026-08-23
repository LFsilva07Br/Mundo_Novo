import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { Cliente, Grupo } from "@/lib/carteira/tipos";
import { ListaClientes } from "./lista-clientes";

const GRUPOS: Grupo[] = [
  { id: "cerrado-mineiro", nome: "Grupo Cerrado Mineiro", administracao: "mundo_novo" },
];

function cliente(parcial: Partial<Cliente> & Pick<Cliente, "id" | "nome">): Cliente {
  return {
    grupoId: null,
    tipo: "fazenda",
    fase: "ativo",
    cidade: "Patrocínio",
    uf: "MG",
    regiao: "Cerrado Mineiro",
    certificacoes: [],
    ...parcial,
  };
}

const CLIENTES: Cliente[] = [
  cliente({ id: "cedro", nome: "Fazenda Cedro", grupoId: "cerrado-mineiro" }),
  cliente({ id: "tecoara", nome: "Fazenda Tecoara" }),
  cliente({
    id: "guatambu",
    nome: "Fazendas Guatambu",
    tipo: "cadeia_suprimentos",
    grupoId: "cerrado-mineiro",
  }),
];

describe("ListaClientes", () => {
  it("lista todos os clientes por padrão", () => {
    render(<ListaClientes clientes={CLIENTES} grupos={GRUPOS} />);
    expect(screen.getByText("Fazenda Cedro")).toBeInTheDocument();
    expect(screen.getByText("Fazenda Tecoara")).toBeInTheDocument();
    expect(screen.getByText("Fazendas Guatambu")).toBeInTheDocument();
  });

  it("busca por nome ignorando maiúsculas e acentos", async () => {
    const usuario = userEvent.setup();
    render(<ListaClientes clientes={CLIENTES} grupos={GRUPOS} />);

    await usuario.type(
      screen.getByLabelText("Buscar cliente por nome"),
      "TECOARA",
    );

    expect(screen.getByText("Fazenda Tecoara")).toBeInTheDocument();
    expect(screen.queryByText("Fazenda Cedro")).not.toBeInTheDocument();
    expect(screen.queryByText("Fazendas Guatambu")).not.toBeInTheDocument();
  });

  it("filtra por fazendas, cadeia de suprimentos e sem grupo", async () => {
    const usuario = userEvent.setup();
    render(<ListaClientes clientes={CLIENTES} grupos={GRUPOS} />);

    await usuario.click(screen.getByRole("button", { name: "Fazendas" }));
    expect(screen.getByText("Fazenda Cedro")).toBeInTheDocument();
    expect(screen.queryByText("Fazendas Guatambu")).not.toBeInTheDocument();

    await usuario.click(
      screen.getByRole("button", { name: "Cadeia de Suprimentos" }),
    );
    expect(screen.getByText("Fazendas Guatambu")).toBeInTheDocument();
    expect(screen.queryByText("Fazenda Cedro")).not.toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Sem grupo" }));
    expect(screen.getByText("Fazenda Tecoara")).toBeInTheDocument();
    expect(screen.queryByText("Fazenda Cedro")).not.toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Todos" }));
    expect(screen.getByText("Fazenda Cedro")).toBeInTheDocument();
  });

  it("mostra aviso quando nenhum cliente corresponde à busca", async () => {
    const usuario = userEvent.setup();
    render(<ListaClientes clientes={CLIENTES} grupos={GRUPOS} />);

    await usuario.type(
      screen.getByLabelText("Buscar cliente por nome"),
      "não existe",
    );

    expect(
      screen.getByText(/nenhum cliente encontrado/i),
    ).toBeInTheDocument();
  });
});
