import type { ItemVersao, Resposta, RespostaVisita } from "./tipos";

/**
 * Regras de negócio puras do checklist e da visita — usadas pelas Server
 * Actions (validação no servidor) e pela interface (feedback em tempo real).
 */

export type ResultadoValidacao = { ok: true } | { ok: false; erro: string };

/** Tamanho útil de uma descrição (espaços nas pontas não contam). */
export function tamanhoDescricao(descricao: string | null | undefined): number {
  return (descricao ?? "").trim().length;
}

/**
 * Não conformidade exige descrição com o mínimo de caracteres definido no
 * item do checklist. Respostas "conforme" e "N.A." não exigem descrição.
 */
export function validarDescricaoNc(
  resposta: Resposta,
  descricao: string | null | undefined,
  descricaoMinima: number,
): ResultadoValidacao {
  if (resposta !== "nao_conforme") return { ok: true };

  const tamanho = tamanhoDescricao(descricao);
  if (tamanho < descricaoMinima) {
    return {
      ok: false,
      erro:
        `Não conformidade exige descrição com pelo menos ${descricaoMinima} ` +
        `caracteres — faltam ${descricaoMinima - tamanho}.`,
    };
  }
  return { ok: true };
}

/** Itens obrigatórios que ainda não foram respondidos na visita. */
export function itensObrigatoriosPendentes(
  itens: Pick<ItemVersao, "id" | "codigo" | "obrigatorio">[],
  respostas: Pick<RespostaVisita, "itemId">[],
): Pick<ItemVersao, "id" | "codigo" | "obrigatorio">[] {
  const respondidos = new Set(respostas.map((r) => r.itemId));
  return itens.filter((i) => i.obrigatorio && !respondidos.has(i.id));
}

/**
 * A visita só pode ser concluída com todos os itens obrigatórios respondidos.
 */
export function validarConclusaoVisita(
  itens: Pick<ItemVersao, "id" | "codigo" | "obrigatorio">[],
  respostas: Pick<RespostaVisita, "itemId">[],
): ResultadoValidacao {
  const pendentes = itensObrigatoriosPendentes(itens, respostas);
  if (pendentes.length === 0) return { ok: true };

  const codigos = pendentes.map((p) => p.codigo).join(", ");
  return {
    ok: false,
    erro:
      `A visita não pode ser concluída: ${pendentes.length} ` +
      `${pendentes.length === 1 ? "item obrigatório está pendente" : "itens obrigatórios estão pendentes"}` +
      ` (${codigos}).`,
  };
}

/**
 * Conformidade = conformes / (respondidos − N.A.), em percentual inteiro.
 * Retorna null quando não há base de cálculo (nada respondido ou tudo N.A.).
 */
export function calcularConformidade(
  respostas: Pick<RespostaVisita, "resposta">[],
): number | null {
  const consideradas = respostas.filter((r) => r.resposta !== "nao_aplicavel");
  if (consideradas.length === 0) return null;

  const conformes = consideradas.filter(
    (r) => r.resposta === "conforme",
  ).length;
  return Math.round((conformes / consideradas.length) * 100);
}
