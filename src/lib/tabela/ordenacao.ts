"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * Ordenação de tabelas do painel.
 *
 * A parte pura (`ordenarPor`, `proximaOrdenacao`, `ariaSort`) não depende de
 * React e é onde ficam as decisões chatas: vazio vai sempre para o fim,
 * texto compara em pt-BR (para "Ávila" cair antes de "Bastos") e a ordem é
 * estável, então clicar numa coluna não embaralha o desempate anterior.
 *
 * O hook `useOrdenacao` embrulha isso com o estado e já devolve as
 * propriedades de acessibilidade do cabeçalho (`aria-sort`), que é o que
 * anuncia a ordenação para quem usa leitor de tela.
 */

export type DirecaoOrdenacao = "asc" | "desc";

export type EstadoOrdenacao<Coluna extends string = string> = {
  coluna: Coluna;
  direcao: DirecaoOrdenacao;
};

/** Valores que uma célula pode devolver para efeito de comparação. */
export type ValorOrdenavel = string | number | boolean | Date | null | undefined;

/** Célula sem informação: null, undefined ou texto em branco. */
export function estaVazio(valor: ValorOrdenavel): boolean {
  return valor === null || valor === undefined || valor === "";
}

const vazio = estaVazio;

/**
 * Compara duas células em ordem crescente.
 * Célula vazia é sempre "maior": em qualquer direção ela fica no fim, porque
 * o que o usuário quer ver primeiro é o que tem informação.
 */
export function compararValores(a: ValorOrdenavel, b: ValorOrdenavel): number {
  if (vazio(a) && vazio(b)) return 0;
  if (vazio(a)) return 1;
  if (vazio(b)) return -1;

  if (a instanceof Date || b instanceof Date) {
    return Number(a) - Number(b);
  }
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  if (typeof a === "boolean" && typeof b === "boolean") {
    return Number(a) - Number(b);
  }
  return String(a).localeCompare(String(b), "pt-BR", { numeric: true });
}

/**
 * Devolve uma nova lista ordenada (não altera a original).
 * `valorDe` diz qual valor de cada linha representa a coluna pedida.
 */
export function ordenarPor<Item, Coluna extends string>(
  itens: readonly Item[],
  estado: EstadoOrdenacao<Coluna> | null,
  valorDe: (item: Item, coluna: Coluna) => ValorOrdenavel,
): Item[] {
  if (!estado) return [...itens];
  const sinal = estado.direcao === "asc" ? 1 : -1;

  return [...itens].sort((a, b) => {
    const valorA = valorDe(a, estado.coluna);
    const valorB = valorDe(b, estado.coluna);
    // Inverter a direção não pode trazer as linhas vazias para o topo:
    // "sem informação" nunca é a resposta que o usuário foi procurar.
    if (estaVazio(valorA) || estaVazio(valorB)) {
      return compararValores(valorA, valorB);
    }
    return sinal * compararValores(valorA, valorB);
  });
}

/**
 * Próximo estado ao clicar num cabeçalho: coluna nova começa na direção
 * padrão dela; a mesma coluna apenas inverte. Não existe "terceiro clique
 * que desliga" — sem ordenação a tabela voltaria a uma ordem que o usuário
 * não pediu.
 */
export function proximaOrdenacao<Coluna extends string>(
  atual: EstadoOrdenacao<Coluna> | null,
  coluna: Coluna,
  direcaoInicial: DirecaoOrdenacao = "asc",
): EstadoOrdenacao<Coluna> {
  if (atual?.coluna === coluna) {
    return { coluna, direcao: atual.direcao === "asc" ? "desc" : "asc" };
  }
  return { coluna, direcao: direcaoInicial };
}

/** Valor do atributo `aria-sort` do `<th>` da coluna. */
export function ariaSort<Coluna extends string>(
  estado: EstadoOrdenacao<Coluna> | null,
  coluna: Coluna,
): "ascending" | "descending" | "none" {
  if (estado?.coluna !== coluna) return "none";
  return estado.direcao === "asc" ? "ascending" : "descending";
}

/** Texto do botão do cabeçalho para leitor de tela. */
export function rotuloOrdenacao<Coluna extends string>(
  estado: EstadoOrdenacao<Coluna> | null,
  coluna: Coluna,
  titulo: string,
): string {
  const atual = ariaSort(estado, coluna);
  if (atual === "ascending") return `${titulo}: ordenado do menor para o maior. Clique para inverter.`;
  if (atual === "descending") return `${titulo}: ordenado do maior para o menor. Clique para inverter.`;
  return `${titulo}: clique para ordenar.`;
}

/**
 * Hook de ordenação de tabela.
 *
 * ```tsx
 * const tabela = useOrdenacao(clientes, valorDaColuna, { coluna: "nome", direcao: "asc" });
 *
 * <TableHead {...tabela.propsColuna("nome")}>
 *   <button {...tabela.propsBotao("nome", "Cliente")}>Cliente</button>
 * </TableHead>
 * {tabela.itens.map(...)}
 * ```
 *
 * `aria-sort` fica no `<th>` (é ele que o leitor de tela anuncia) e o
 * clique fica no botão dentro dele.
 */
export function useOrdenacao<Item, Coluna extends string>(
  itens: readonly Item[],
  valorDe: (item: Item, coluna: Coluna) => ValorOrdenavel,
  inicial: EstadoOrdenacao<Coluna> | null = null,
  direcoesIniciais: Partial<Record<Coluna, DirecaoOrdenacao>> = {},
) {
  const [estado, setEstado] = useState<EstadoOrdenacao<Coluna> | null>(inicial);

  const ordenar = useCallback(
    (coluna: Coluna) => {
      setEstado((atual) =>
        proximaOrdenacao(atual, coluna, direcoesIniciais[coluna] ?? "asc"),
      );
    },
    // As direções iniciais são uma constante da tela, não mudam em runtime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const ordenados = useMemo(
    () => ordenarPor(itens, estado, valorDe),
    // `valorDe` costuma ser uma função declarada no corpo do componente;
    // depender dela reordenaria a cada render sem necessidade.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itens, estado],
  );

  const propsColuna = useCallback(
    (coluna: Coluna) => ({ "aria-sort": ariaSort(estado, coluna) }) as const,
    [estado],
  );

  const propsBotao = useCallback(
    (coluna: Coluna, titulo: string) =>
      ({
        type: "button",
        "aria-label": rotuloOrdenacao(estado, coluna, titulo),
        onClick: () => ordenar(coluna),
      }) as const,
    [estado, ordenar],
  );

  return {
    itens: ordenados,
    estado,
    ordenar,
    ariaSort: (coluna: Coluna) => ariaSort(estado, coluna),
    propsColuna,
    propsBotao,
  };
}
