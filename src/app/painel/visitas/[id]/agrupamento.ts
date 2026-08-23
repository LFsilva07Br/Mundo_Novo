import type { ItemVersao, Resposta } from "@/lib/checklists/tipos";

/**
 * Regras puras da execução de auditoria no painel: agrupar os itens por
 * capítulo da norma, filtrar a lista (são ~200 itens numa auditoria real) e
 * saltar direto para o próximo item pendente.
 *
 * Tudo aqui é função pura — sem React, sem banco — para poder ser testado
 * isoladamente e reaproveitado pela tela sem duplicar contagem.
 */

/** Capítulo usado quando o item do checklist não declara nenhum. */
export const CAPITULO_SEM_NOME = "Sem capítulo";

export const FILTROS_ITENS = ["todos", "pendentes", "nao_conformes"] as const;
export type FiltroItens = (typeof FILTROS_ITENS)[number];

export const ROTULO_FILTRO: Record<FiltroItens, string> = {
  todos: "Todos",
  pendentes: "Pendentes",
  nao_conformes: "Não conformes",
};

/** Respostas já registradas, indexadas pelo id do item. */
export type MapaRespostas = Record<string, { resposta: Resposta } | undefined>;

export type GrupoCapitulo = {
  /** Título do capítulo, como vem do checklist. */
  capitulo: string;
  /** Identificador estável para a âncora (`#capitulo-...`). */
  ancora: string;
  itens: ItemVersao[];
  total: number;
  respondidos: number;
  naoConformes: number;
};

/**
 * Âncora estável a partir do título do capítulo: sem acento, sem
 * pontuação, minúsculo e com hífens. "Cap. 1 · Gerência" → "cap-1-gerencia".
 */
export function ancoraCapitulo(capitulo: string): string {
  const base = capitulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `capitulo-${base || "sem-nome"}`;
}

/** O item já foi respondido nesta visita? */
export function itemRespondido(
  item: ItemVersao,
  respostas: MapaRespostas,
): boolean {
  return respostas[item.id] !== undefined;
}

/**
 * Agrupa os itens pelo capítulo da norma, preservando a ordem de
 * aparecimento dos capítulos e dos itens dentro de cada um. Cada grupo já
 * traz os contadores da seção (respondidos/total e NCs).
 */
export function agruparPorCapitulo(
  itens: ItemVersao[],
  respostas: MapaRespostas = {},
): GrupoCapitulo[] {
  const grupos = new Map<string, GrupoCapitulo>();

  for (const item of itens) {
    const capitulo = item.capitulo?.trim() || CAPITULO_SEM_NOME;
    let grupo = grupos.get(capitulo);
    if (!grupo) {
      grupo = {
        capitulo,
        ancora: ancoraCapitulo(capitulo),
        itens: [],
        total: 0,
        respondidos: 0,
        naoConformes: 0,
      };
      grupos.set(capitulo, grupo);
    }

    grupo.itens.push(item);
    grupo.total += 1;

    const registrada = respostas[item.id];
    if (registrada) {
      grupo.respondidos += 1;
      if (registrada.resposta === "nao_conforme") grupo.naoConformes += 1;
    }
  }

  return [...grupos.values()];
}

/** Aplica o filtro "Todos / Pendentes / Não conformes" à lista de itens. */
export function filtrarItens(
  itens: ItemVersao[],
  respostas: MapaRespostas,
  filtro: FiltroItens,
): ItemVersao[] {
  if (filtro === "todos") return itens;
  if (filtro === "pendentes") {
    return itens.filter((item) => !itemRespondido(item, respostas));
  }
  return itens.filter(
    (item) => respostas[item.id]?.resposta === "nao_conforme",
  );
}

/**
 * Agrupa por capítulo já com o filtro aplicado. Capítulos que ficam sem
 * item algum somem da tela, mas os contadores continuam sendo do capítulo
 * inteiro — quem filtra por "Pendentes" ainda precisa saber quanto falta.
 */
export function agruparFiltrado(
  itens: ItemVersao[],
  respostas: MapaRespostas,
  filtro: FiltroItens,
): GrupoCapitulo[] {
  const visiveis = new Set(
    filtrarItens(itens, respostas, filtro).map((item) => item.id),
  );
  return agruparPorCapitulo(itens, respostas)
    .map((grupo) => ({
      ...grupo,
      itens: grupo.itens.filter((item) => visiveis.has(item.id)),
    }))
    .filter((grupo) => grupo.itens.length > 0);
}

/**
 * Próximo item sem resposta, na ordem do checklist, a partir do item
 * `depoisDe` (exclusive). Ao chegar no fim, volta ao começo — assim o
 * botão "Ir ao próximo pendente" nunca fica sem destino enquanto houver
 * pendência. Devolve `null` quando não há mais nada pendente.
 */
export function proximoPendente(
  itens: ItemVersao[],
  respostas: MapaRespostas,
  depoisDe?: string | null,
): ItemVersao | null {
  if (itens.length === 0) return null;

  const inicio = depoisDe
    ? itens.findIndex((item) => item.id === depoisDe) + 1
    : 0;

  for (let passo = 0; passo < itens.length; passo += 1) {
    const item = itens[(inicio + passo) % itens.length];
    if (!itemRespondido(item, respostas)) return item;
  }
  return null;
}

/** Resumo geral da visita — o que a barra fixa do topo mostra. */
export type ResumoExecucao = {
  total: number;
  respondidos: number;
  pendentes: number;
  naoConformes: number;
  /** Percentual inteiro de itens respondidos (0 quando não há itens). */
  progresso: number;
};

export function resumirExecucao(
  itens: ItemVersao[],
  respostas: MapaRespostas,
): ResumoExecucao {
  const total = itens.length;
  let respondidos = 0;
  let naoConformes = 0;

  for (const item of itens) {
    const registrada = respostas[item.id];
    if (!registrada) continue;
    respondidos += 1;
    if (registrada.resposta === "nao_conforme") naoConformes += 1;
  }

  return {
    total,
    respondidos,
    pendentes: total - respondidos,
    naoConformes,
    progresso: total === 0 ? 0 : Math.round((respondidos / total) * 100),
  };
}
