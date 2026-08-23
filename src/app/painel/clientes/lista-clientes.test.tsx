import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { Cliente, Grupo } from "@/lib/carteira/tipos";
import { ListaClientes, type ProntidaoResumo } from "./lista-clientes";

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
  cliente({
    id: "cedro",
    nome: "Fazenda Cedro",
    grupoId: "cerrado-mineiro",
    conformidade: 90,
  }),
  cliente({ id: "tecoara", nome: "Fazenda Tecoara", conformidade: 60 }),
  cliente({
    id: "guatambu",
    nome: "Fazendas Guatambu",
    tipo: "cadeia_suprimentos",
    grupoId: "cerrado-mineiro",
    conformidade: 75,
  }),
];

const PRONTIDAO: ProntidaoResumo[] = [
  { clienteId: "cedro", pronta: true, nota: 100, pendencias: [] },
  {
    clienteId: "tecoara",
    pronta: false,
    nota: 35,
    pendencias: ["Certificação RA vencida", "CAPA MAIOR em aberto"],
  },
  {
    clienteId: "guatambu",
    pronta: false,
    nota: 70,
    pendencias: ["Treinamento vencido: NR-31"],
  },
];

/** Nomes dos clientes na ordem em que aparecem na tabela. */
function nomesNaTabela(): string[] {
  return within(screen.getByRole("table"))
    .getAllByRole("row")
    .slice(1)
    .map((linha) => within(linha).getAllByRole("link")[0].textContent ?? "");
}

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

describe("Coluna de prontidão", () => {
  it("mostra a nota e o número de pendências de cada cliente", () => {
    render(
      <ListaClientes clientes={CLIENTES} grupos={GRUPOS} prontidao={PRONTIDAO} />,
    );

    expect(screen.getByText("Pronta · nota 100")).toBeInTheDocument();
    expect(screen.getByText("2 pendência(s) · nota 35")).toBeInTheDocument();
    expect(screen.getByText("1 pendência(s) · nota 70")).toBeInTheDocument();
  });

  it("avisa quando o cliente ainda não foi avaliado", () => {
    render(
      <ListaClientes
        clientes={CLIENTES}
        grupos={GRUPOS}
        prontidao={[PRONTIDAO[0]]}
      />,
    );
    expect(screen.getAllByText("Não avaliado")).toHaveLength(2);
  });
});

describe("Filtro de prontidão", () => {
  it("mostra só as prontas para auditoria", async () => {
    const usuario = userEvent.setup();
    render(
      <ListaClientes clientes={CLIENTES} grupos={GRUPOS} prontidao={PRONTIDAO} />,
    );

    await usuario.click(
      screen.getByRole("button", { name: "Prontas para auditoria" }),
    );

    expect(screen.getByText("Fazenda Cedro")).toBeInTheDocument();
    expect(screen.queryByText("Fazenda Tecoara")).not.toBeInTheDocument();
  });

  it("mostra só as que têm pendência", async () => {
    const usuario = userEvent.setup();
    render(
      <ListaClientes clientes={CLIENTES} grupos={GRUPOS} prontidao={PRONTIDAO} />,
    );

    await usuario.click(screen.getByRole("button", { name: "Com pendências" }));

    expect(screen.queryByText("Fazenda Cedro")).not.toBeInTheDocument();
    expect(screen.getByText("Fazenda Tecoara")).toBeInTheDocument();
    expect(screen.getByText("Fazendas Guatambu")).toBeInTheDocument();
  });

  it("combina com o filtro de tipo", async () => {
    const usuario = userEvent.setup();
    render(
      <ListaClientes clientes={CLIENTES} grupos={GRUPOS} prontidao={PRONTIDAO} />,
    );

    await usuario.click(screen.getByRole("button", { name: "Com pendências" }));
    await usuario.click(screen.getByRole("button", { name: "Fazendas" }));

    expect(screen.getByText("Fazenda Tecoara")).toBeInTheDocument();
    expect(screen.queryByText("Fazendas Guatambu")).not.toBeInTheDocument();
  });
});

describe("Ordenação da tabela", () => {
  it("começa ordenada por nome, com aria-sort no cabeçalho", () => {
    render(
      <ListaClientes clientes={CLIENTES} grupos={GRUPOS} prontidao={PRONTIDAO} />,
    );

    expect(
      screen.getByRole("columnheader", { name: /Cliente/ }),
    ).toHaveAttribute("aria-sort", "ascending");
    expect(nomesNaTabela()).toEqual([
      "Fazenda Cedro",
      "Fazenda Tecoara",
      "Fazendas Guatambu",
    ]);
  });

  it("inverte a ordem ao clicar de novo na mesma coluna", async () => {
    const usuario = userEvent.setup();
    render(
      <ListaClientes clientes={CLIENTES} grupos={GRUPOS} prontidao={PRONTIDAO} />,
    );

    await usuario.click(screen.getByRole("button", { name: /^Cliente/ }));

    expect(
      screen.getByRole("columnheader", { name: /Cliente/ }),
    ).toHaveAttribute("aria-sort", "descending");
    expect(nomesNaTabela()[0]).toBe("Fazendas Guatambu");
  });

  it("ordena pela nota de prontidão, pior primeiro", async () => {
    const usuario = userEvent.setup();
    render(
      <ListaClientes clientes={CLIENTES} grupos={GRUPOS} prontidao={PRONTIDAO} />,
    );

    await usuario.click(screen.getByRole("button", { name: /^Prontidão/ }));

    expect(nomesNaTabela()).toEqual([
      "Fazenda Tecoara",
      "Fazendas Guatambu",
      "Fazenda Cedro",
    ]);
    expect(
      screen.getByRole("columnheader", { name: /Prontidão/ }),
    ).toHaveAttribute("aria-sort", "ascending");
    expect(
      screen.getByRole("columnheader", { name: /Cliente/ }),
    ).toHaveAttribute("aria-sort", "none");
  });

  it("ordena pela conformidade", async () => {
    const usuario = userEvent.setup();
    render(
      <ListaClientes clientes={CLIENTES} grupos={GRUPOS} prontidao={PRONTIDAO} />,
    );

    await usuario.click(screen.getByRole("button", { name: /^Conformidade/ }));
    expect(nomesNaTabela()[0]).toBe("Fazenda Tecoara");

    await usuario.click(screen.getByRole("button", { name: /^Conformidade/ }));
    expect(nomesNaTabela()[0]).toBe("Fazenda Cedro");
  });
});
