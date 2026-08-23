import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BuscaClientes,
  detalheCliente,
  filtrarClientes,
  normalizar,
  type ClienteBusca,
} from "./busca-clientes";
import {
  COOKIE_CLIENTE_SELECIONADO,
  lerCookie,
} from "@/lib/cliente-selecionado";

const empurrar = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: empurrar }),
  usePathname: () => "/painel",
}));

const CLIENTES: ClienteBusca[] = [
  {
    id: "alto-da-serra",
    nome: "Fazenda Alto da Serra",
    produtor: "Silvio Dutra",
    cidade: "São Sebastião do Paraíso",
    uf: "MG",
  },
  {
    id: "cedro",
    nome: "Fazenda Cedro",
    produtor: "José Antônio",
    cidade: "Serra do Salitre",
    uf: "MG",
  },
  {
    id: "guatambu",
    nome: "Fazendas Guatambu",
    cidade: "Patrocínio",
    uf: "MG",
  },
];

beforeEach(() => {
  empurrar.mockClear();
  document.cookie = `${COOKIE_CLIENTE_SELECIONADO}=; path=/; max-age=0`;
});

describe("normalizar", () => {
  it("tira acento e caixa", () => {
    expect(normalizar("São JOSÉ ")).toBe("sao jose");
  });
});

describe("filtrarClientes", () => {
  it("acha por nome mesmo sem acento e sem maiúscula", () => {
    expect(filtrarClientes(CLIENTES, "GUATAMBU").map((c) => c.id)).toEqual([
      "guatambu",
    ]);
  });

  it("acha pelo nome do produtor", () => {
    expect(filtrarClientes(CLIENTES, "jose antonio").map((c) => c.id)).toEqual([
      "cedro",
    ]);
  });

  it("acha pela cidade digitada sem acento", () => {
    expect(filtrarClientes(CLIENTES, "patrocinio").map((c) => c.id)).toEqual([
      "guatambu",
    ]);
    expect(filtrarClientes(CLIENTES, "sao sebastiao").map((c) => c.id)).toEqual([
      "alto-da-serra",
    ]);
  });

  it("combina palavras de campos diferentes", () => {
    expect(filtrarClientes(CLIENTES, "cedro salitre").map((c) => c.id)).toEqual([
      "cedro",
    ]);
  });

  it("devolve a carteira inteira quando não há termo", () => {
    expect(filtrarClientes(CLIENTES, "  ")).toHaveLength(3);
  });

  it("devolve vazio quando nada casa", () => {
    expect(filtrarClientes(CLIENTES, "inexistente")).toEqual([]);
  });

  it("respeita o limite de resultados", () => {
    expect(filtrarClientes(CLIENTES, "fazenda", 2)).toHaveLength(2);
  });
});

describe("detalheCliente", () => {
  it("junta cidade, UF e produtor", () => {
    expect(detalheCliente(CLIENTES[1])).toBe("Serra do Salitre - MG · José Antônio");
  });

  it("omite o produtor quando não existe", () => {
    expect(detalheCliente(CLIENTES[2])).toBe("Patrocínio - MG");
  });
});

describe("BuscaClientes", () => {
  it("mostra o atalho no cabeçalho com o painel fechado", () => {
    render(<BuscaClientes clientes={CLIENTES} />);
    expect(screen.getByRole("button", { name: /Buscar cliente/ })).toBeInTheDocument();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("abre com Ctrl+K", async () => {
    const usuario = userEvent.setup();
    render(<BuscaClientes clientes={CLIENTES} />);

    await usuario.keyboard("{Control>}k{/Control}");

    expect(
      screen.getByLabelText("Buscar cliente por nome, produtor ou cidade"),
    ).toBeInTheDocument();
  });

  it("abre com Cmd+K no Mac", async () => {
    const usuario = userEvent.setup();
    render(<BuscaClientes clientes={CLIENTES} />);

    await usuario.keyboard("{Meta>}k{/Meta}");

    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("filtra a lista enquanto o usuário digita, sem exigir acento", async () => {
    const usuario = userEvent.setup();
    render(<BuscaClientes clientes={CLIENTES} abertaInicialmente />);

    await usuario.type(
      screen.getByLabelText("Buscar cliente por nome, produtor ou cidade"),
      "patrocinio",
    );

    expect(screen.getByRole("option", { name: /Fazendas Guatambu/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Fazenda Cedro/ })).toBeNull();
  });

  it("navega pelas setas e abre a ficha com Enter", async () => {
    const usuario = userEvent.setup();
    render(<BuscaClientes clientes={CLIENTES} abertaInicialmente />);
    const campo = screen.getByLabelText(
      "Buscar cliente por nome, produtor ou cidade",
    );

    await usuario.click(campo);
    await usuario.keyboard("{ArrowDown}");
    expect(screen.getAllByRole("option")[1]).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await usuario.keyboard("{Enter}");
    expect(empurrar).toHaveBeenCalledWith("/painel/clientes/cedro");
  });

  it("guarda o cliente escolhido como cliente ativo", async () => {
    const usuario = userEvent.setup();
    render(<BuscaClientes clientes={CLIENTES} abertaInicialmente />);

    await usuario.click(screen.getByRole("option", { name: /Fazenda Cedro/ }));

    expect(lerCookie(document.cookie)).toBe("cedro");
    expect(empurrar).toHaveBeenCalledWith("/painel/clientes/cedro");
  });

  it("mostra o nome do cliente ativo no cabeçalho e deixa limpar", async () => {
    const usuario = userEvent.setup();
    document.cookie = `${COOKIE_CLIENTE_SELECIONADO}=cedro; path=/`;
    render(<BuscaClientes clientes={CLIENTES} />);

    expect(await screen.findByText("Cliente ativo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Fazenda Cedro" })).toHaveAttribute(
      "href",
      "/painel/clientes/cedro",
    );

    await usuario.click(screen.getByRole("button", { name: "Limpar cliente ativo" }));
    expect(screen.queryByText("Cliente ativo")).toBeNull();
  });

  it("avisa quando a busca não acha ninguém", async () => {
    const usuario = userEvent.setup();
    render(<BuscaClientes clientes={CLIENTES} abertaInicialmente />);

    await usuario.type(
      screen.getByLabelText("Buscar cliente por nome, produtor ou cidade"),
      "zzz",
    );

    expect(screen.getByText(/Nenhum cliente encontrado/)).toBeInTheDocument();
  });
});
