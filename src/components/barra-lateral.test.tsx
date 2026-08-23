import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BarraLateral,
  CHAVE_PREFERENCIA_MENU,
  GRUPOS_NAVEGACAO,
  analisarPreferencia,
  estadoInicialGrupos,
  grupoDaRota,
  itemAtivo,
} from "./barra-lateral";

const rotaAtual = vi.hoisted(() => ({ valor: "/painel" }));

vi.mock("next/navigation", () => ({
  usePathname: () => rotaAtual.valor,
}));

// O jsdom desta versão do Node não expõe localStorage; o componente já
// tolera a ausência, mas o teste da preferência precisa de um dublê.
const memoria = new Map<string, string>();
const armazenamento = {
  getItem: (chave: string) => memoria.get(chave) ?? null,
  setItem: (chave: string, valor: string) => void memoria.set(chave, valor),
  removeItem: (chave: string) => void memoria.delete(chave),
  clear: () => memoria.clear(),
  key: (indice: number) => [...memoria.keys()][indice] ?? null,
  get length() {
    return memoria.size;
  },
} satisfies Storage;

beforeEach(() => {
  rotaAtual.valor = "/painel";
  memoria.clear();
  Object.defineProperty(window, "localStorage", {
    value: armazenamento,
    configurable: true,
    writable: true,
  });
});

describe("Agrupamento do menu", () => {
  it("organiza as 26 telas nos 5 grupos da jornada de trabalho", () => {
    expect(GRUPOS_NAVEGACAO.map((g) => g.titulo)).toEqual([
      "Carteira",
      "Certificação",
      "Operação",
      "Análise & Dados",
      "Configuração",
    ]);

    const total = GRUPOS_NAVEGACAO.reduce((s, g) => s + g.itens.length, 0);
    expect(total).toBe(26);
  });

  it("mantém cada tela em um único grupo e sem href repetido", () => {
    const hrefs = GRUPOS_NAVEGACAO.flatMap((g) => g.itens.map((i) => i.href));
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("dá um ícone exclusivo a cada tela (em 16px o ícone é o que diferencia)", () => {
    const icones = GRUPOS_NAVEGACAO.flatMap((g) => g.itens.map((i) => i.icone));
    expect(new Set(icones).size).toBe(icones.length);
  });

  it("tira Relatórios, Financeiro, Dossiê e Trilha de 'Configuração'", () => {
    const configuracao = GRUPOS_NAVEGACAO.find((g) => g.id === "configuracao")!;
    expect(configuracao.itens.map((i) => i.rotulo)).toEqual([
      "Alertas & Automação",
      "Usuários & Permissões",
      "E-mails",
    ]);

    const analise = GRUPOS_NAVEGACAO.find((g) => g.id === "analise")!;
    for (const rotulo of ["Relatórios", "Financeiro", "Dossiê do auditor", "Trilha de auditoria"]) {
      expect(analise.itens.some((i) => i.rotulo === rotulo)).toBe(true);
    }
  });

  it("aponta o grupo dono da rota atual", () => {
    expect(grupoDaRota("/painel")).toBe("carteira");
    expect(grupoDaRota("/painel/capas")).toBe("certificacao");
    expect(grupoDaRota("/painel/agro")).toBe("operacao");
    expect(grupoDaRota("/painel/trilha")).toBe("analise");
    expect(grupoDaRota("/painel/usuarios")).toBe("configuracao");
    expect(grupoDaRota("/painel/roadmap")).toBeNull();
  });

  it("acende o item também nas telas filhas, sem acender o Dashboard", () => {
    expect(itemAtivo("/painel/clientes/cedro", "/painel/clientes")).toBe(true);
    expect(itemAtivo("/painel/clientes", "/painel")).toBe(false);
    expect(itemAtivo("/painel", "/painel")).toBe(true);
  });
});

describe("Estado inicial dos grupos", () => {
  it("abre só o grupo da rota atual quando não há preferência", () => {
    const estado = estadoInicialGrupos("/painel/capas");
    expect(estado.certificacao).toBe(true);
    expect(estado.carteira).toBe(false);
    expect(estado.analise).toBe(false);
  });

  it("respeita a preferência salva dos demais grupos", () => {
    const estado = estadoInicialGrupos("/painel/capas", {
      analise: true,
      operacao: false,
    });
    expect(estado.analise).toBe(true);
    expect(estado.operacao).toBe(false);
  });

  it("respeita quem fechou de propósito o grupo da rota atual", () => {
    const estado = estadoInicialGrupos("/painel/capas", { certificacao: false });
    expect(estado.certificacao).toBe(false);
  });
});

describe("analisarPreferencia", () => {
  it("lê o JSON salvo", () => {
    expect(analisarPreferencia('{"analise":true}')).toEqual({ analise: true });
  });

  it("ignora conteúdo inválido em vez de quebrar o menu", () => {
    expect(analisarPreferencia(null)).toBeNull();
    expect(analisarPreferencia("não é json")).toBeNull();
    expect(analisarPreferencia("42")).toBeNull();
  });
});

describe("BarraLateral", () => {
  it("mostra o grupo da rota atual expandido e os outros recolhidos", () => {
    rotaAtual.valor = "/painel/capas";
    render(<BarraLateral emailUsuario="equipe@mundonovo.com" />);

    expect(
      screen.getByRole("button", { name: /Certificação/ }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /Análise & Dados/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByRole("link", { name: "CAPAs" })).toBeVisible();
    // Grupo recolhido sai do alcance do leitor de tela e do teclado.
    expect(
      screen.queryByRole("link", { name: "Trilha de auditoria" }),
    ).toBeNull();
  });

  it("expande um grupo no clique e guarda a preferência no localStorage", async () => {
    const usuario = userEvent.setup();
    rotaAtual.valor = "/painel/capas";
    render(<BarraLateral emailUsuario={null} />);

    await usuario.click(screen.getByRole("button", { name: /Análise & Dados/ }));

    expect(screen.getByRole("link", { name: "Trilha de auditoria" })).toBeVisible();
    const salvo = JSON.parse(
      window.localStorage.getItem(CHAVE_PREFERENCIA_MENU) ?? "{}",
    );
    expect(salvo.analise).toBe(true);
  });

  it("deixa recolher até o grupo da tela atual e guarda a escolha", async () => {
    const usuario = userEvent.setup();
    rotaAtual.valor = "/painel/capas";
    render(<BarraLateral emailUsuario={null} />);

    await usuario.click(screen.getByRole("button", { name: /Certificação/ }));

    expect(screen.queryByRole("link", { name: "CAPAs" })).toBeNull();
    const salvo = JSON.parse(
      window.localStorage.getItem(CHAVE_PREFERENCIA_MENU) ?? "{}",
    );
    expect(salvo).toEqual({ certificacao: false });
  });

  it("marca a tela aberta com aria-current", () => {
    rotaAtual.valor = "/painel/clientes";
    render(<BarraLateral emailUsuario={null} />);
    expect(screen.getByRole("link", { name: "Clientes" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("lista todas as telas do grupo aberto", () => {
    rotaAtual.valor = "/painel";
    render(<BarraLateral emailUsuario={null} />);
    const carteira = screen.getByRole("button", { name: /Carteira/ });
    const lista = document.getElementById(
      carteira.getAttribute("aria-controls")!,
    )!;
    expect(within(lista).getAllByRole("link")).toHaveLength(5);
  });
});
