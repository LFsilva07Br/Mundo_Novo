import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ariaSort,
  compararValores,
  ordenarPor,
  proximaOrdenacao,
  rotuloOrdenacao,
  useOrdenacao,
} from "./ordenacao";

type Linha = { nome: string; nota?: number; cidade?: string | null };

const LINHAS: Linha[] = [
  { nome: "Ávila", nota: 80, cidade: "Patrocínio" },
  { nome: "Bastos", nota: 100, cidade: null },
  { nome: "abreu", nota: 20, cidade: "" },
  { nome: "Casa 10", cidade: "Araxá" },
  { nome: "Casa 2", nota: 50, cidade: "Araxá" },
];

const valorDe = (linha: Linha, coluna: "nome" | "nota" | "cidade") =>
  linha[coluna];

describe("compararValores", () => {
  it("compara texto em pt-BR, ignorando caixa e tratando acento", () => {
    expect(compararValores("abreu", "Ávila")).toBeLessThan(0);
    expect(compararValores("Ávila", "Bastos")).toBeLessThan(0);
  });

  it("compara número como número, não como texto", () => {
    expect(compararValores(9, 10)).toBeLessThan(0);
  });

  it("compara texto com número embutido na ordem humana", () => {
    expect(compararValores("Casa 2", "Casa 10")).toBeLessThan(0);
  });

  it("compara datas", () => {
    expect(
      compararValores(new Date("2026-01-01"), new Date("2026-06-01")),
    ).toBeLessThan(0);
  });

  it("joga vazio (null, undefined, string vazia) para o fim", () => {
    expect(compararValores(null, "a")).toBeGreaterThan(0);
    expect(compararValores(undefined, 1)).toBeGreaterThan(0);
    expect(compararValores("", "a")).toBeGreaterThan(0);
    expect(compararValores(null, undefined)).toBe(0);
  });
});

describe("ordenarPor", () => {
  it("não altera a lista original", () => {
    const original = [...LINHAS];
    ordenarPor(LINHAS, { coluna: "nome", direcao: "asc" }, valorDe);
    expect(LINHAS).toEqual(original);
  });

  it("ordena texto crescente", () => {
    expect(
      ordenarPor(LINHAS, { coluna: "nome", direcao: "asc" }, valorDe).map(
        (l) => l.nome,
      ),
    ).toEqual(["abreu", "Ávila", "Bastos", "Casa 2", "Casa 10"]);
  });

  it("ordena texto decrescente", () => {
    expect(
      ordenarPor(LINHAS, { coluna: "nome", direcao: "desc" }, valorDe).map(
        (l) => l.nome,
      ),
    ).toEqual(["Casa 10", "Casa 2", "Bastos", "Ávila", "abreu"]);
  });

  it("mantém as linhas sem valor no fim nas duas direções", () => {
    const asc = ordenarPor(LINHAS, { coluna: "nota", direcao: "asc" }, valorDe);
    const desc = ordenarPor(LINHAS, { coluna: "nota", direcao: "desc" }, valorDe);
    expect(asc.at(-1)!.nome).toBe("Casa 10");
    expect(desc.at(-1)!.nome).toBe("Casa 10");
  });

  it("devolve uma cópia intacta quando não há ordenação", () => {
    expect(ordenarPor(LINHAS, null, valorDe)).toEqual(LINHAS);
  });

  it("é estável: empate preserva a ordem de entrada", () => {
    const empatados = [
      { nome: "primeiro", cidade: "Araxá" },
      { nome: "segundo", cidade: "Araxá" },
      { nome: "terceiro", cidade: "Araxá" },
    ];
    expect(
      ordenarPor(empatados, { coluna: "cidade", direcao: "asc" }, valorDe).map(
        (l) => l.nome,
      ),
    ).toEqual(["primeiro", "segundo", "terceiro"]);
  });
});

describe("proximaOrdenacao", () => {
  it("começa na direção padrão numa coluna nova", () => {
    expect(proximaOrdenacao(null, "nome")).toEqual({
      coluna: "nome",
      direcao: "asc",
    });
    expect(proximaOrdenacao({ coluna: "nota", direcao: "asc" }, "nome")).toEqual(
      { coluna: "nome", direcao: "asc" },
    );
  });

  it("aceita direção inicial própria da coluna", () => {
    expect(proximaOrdenacao(null, "nota", "desc")).toEqual({
      coluna: "nota",
      direcao: "desc",
    });
  });

  it("inverte ao clicar de novo na mesma coluna", () => {
    const primeiro = proximaOrdenacao(null, "nome");
    const segundo = proximaOrdenacao(primeiro, "nome");
    expect(segundo.direcao).toBe("desc");
    expect(proximaOrdenacao(segundo, "nome").direcao).toBe("asc");
  });
});

describe("ariaSort e rótulo", () => {
  it("marca só a coluna ordenada", () => {
    const estado = { coluna: "nome" as const, direcao: "desc" as const };
    expect(ariaSort(estado, "nome")).toBe("descending");
    expect(ariaSort(estado, "nota")).toBe("none");
    expect(ariaSort(null, "nome")).toBe("none");
  });

  it("descreve o estado da coluna para leitor de tela", () => {
    expect(rotuloOrdenacao(null, "nome", "Cliente")).toMatch(
      /clique para ordenar/i,
    );
    expect(
      rotuloOrdenacao({ coluna: "nome", direcao: "asc" }, "nome", "Cliente"),
    ).toMatch(/menor para o maior/);
  });
});

describe("useOrdenacao", () => {
  it("aplica a ordenação inicial", () => {
    const { result } = renderHook(() =>
      useOrdenacao(LINHAS, valorDe, { coluna: "nome", direcao: "asc" }),
    );
    expect(result.current.itens[0].nome).toBe("abreu");
    expect(result.current.ariaSort("nome")).toBe("ascending");
  });

  it("troca de coluna e inverte a direção nos cliques seguintes", () => {
    const { result } = renderHook(() => useOrdenacao(LINHAS, valorDe));

    act(() => result.current.ordenar("nota"));
    expect(result.current.itens[0].nota).toBe(20);
    expect(result.current.ariaSort("nota")).toBe("ascending");

    act(() => result.current.ordenar("nota"));
    expect(result.current.itens[0].nota).toBe(100);
    expect(result.current.ariaSort("nota")).toBe("descending");

    act(() => result.current.ordenar("nome"));
    expect(result.current.ariaSort("nome")).toBe("ascending");
    expect(result.current.ariaSort("nota")).toBe("none");
  });

  it("respeita a direção inicial configurada por coluna", () => {
    const { result } = renderHook(() =>
      useOrdenacao(LINHAS, valorDe, null, { nota: "desc" }),
    );
    act(() => result.current.ordenar("nota"));
    expect(result.current.itens[0].nota).toBe(100);
  });

  it("entrega as props do <th> e do botão do cabeçalho", () => {
    const { result } = renderHook(() =>
      useOrdenacao(LINHAS, valorDe, { coluna: "nome", direcao: "asc" }),
    );
    expect(result.current.propsColuna("nome")["aria-sort"]).toBe("ascending");
    expect(result.current.propsBotao("nome", "Cliente").type).toBe("button");
    expect(
      result.current.propsBotao("nome", "Cliente")["aria-label"],
    ).toContain("Cliente");
  });
});
