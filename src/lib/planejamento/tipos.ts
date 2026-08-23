/**
 * Tipos do planejamento anual de visitas (meta: cobertura 100% da carteira).
 * Cada cliente tem, por ano e por tipo, um mês previsto; quando uma visita
 * concluída acontece perto do previsto, o planejamento é dado como realizado.
 */

export const TIPOS_PLANEJAMENTO = [
  "auditoria_interna",
  "visita_tecnica",
  "outra",
] as const;

export type TipoPlanejamento = (typeof TIPOS_PLANEJAMENTO)[number];

export const ROTULO_TIPO_PLANEJAMENTO: Record<TipoPlanejamento, string> = {
  auditoria_interna: "Auditoria interna",
  visita_tecnica: "Visita técnica",
  outra: "Outra",
};

export type PlanejamentoVisita = {
  id: string;
  clienteId: string;
  ano: number;
  /** 1 (janeiro) a 12 (dezembro). */
  mesPrevisto: number;
  tipo: TipoPlanejamento;
  /** Visita concluída vinculada — preenchida automaticamente. */
  visitaId: string | null;
  observacao: string | null;
};

/** Visita concluída usada para marcar planejamentos como realizados. */
export type VisitaConcluida = {
  id: string;
  clienteId: string;
  /** ISO com data e hora. */
  concluidaEm: string;
};

export const MESES_CURTOS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

export const MESES_LONGOS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;
