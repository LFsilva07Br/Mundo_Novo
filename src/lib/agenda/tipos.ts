import type { TipoPlanejamento } from "@/lib/planejamento/tipos";

/**
 * Tipos da visão de agenda semanal.
 *
 * A agenda unifica, numa única lista de "compromissos", as fontes que hoje
 * moram em tabelas diferentes: tarefas do motor de gatilhos (`tarefas`) e
 * visitas de campo/escritório (`visitas`). O planejamento anual
 * (`planejamento_visitas`) não tem dia definido — só mês — então aparece à
 * parte, como previsão do mês, sem inventar uma data.
 */

/** Como a tarefa nasceu — o motor de gatilhos, ou a mão do técnico. */
export type OrigemTarefa = "data" | "evento" | "manual";

export type TipoCompromisso = "tarefa" | "visita";

export type Compromisso = {
  id: string;
  tipo: TipoCompromisso;
  titulo: string;
  detalhe: string | null;
  clienteId: string | null;
  clienteNome: string | null;
  /** Dia do compromisso no formato "AAAA-MM-DD"; null quando não há data. */
  dia: string | null;
  /** Só para tarefas — visitas não têm origem de gatilho. */
  origem: OrigemTarefa | null;
  /** Regra do motor que gerou a tarefa (quando houver). */
  regra: string | null;
  concluido: boolean;
  /** Registro relacionado (cliente ou visita), quando faz sentido navegar. */
  href: string | null;
};

/** Item do planejamento anual previsto para o mês exibido (sem dia). */
export type PrevistoMes = {
  id: string;
  clienteId: string;
  clienteNome: string;
  tipo: TipoPlanejamento;
  ano: number;
  /** 1 (janeiro) a 12 (dezembro). */
  mes: number;
  realizado: boolean;
};

/** Tudo que a tela da semana precisa, já separado por natureza. */
export type AgendaSemana = {
  segunda: Date;
  dias: Date[];
  /** Compromissos com dia dentro da semana exibida. */
  compromissos: Compromisso[];
  /** Tarefas pendentes sem data — não somem, ficam na faixa abaixo da grade. */
  semData: Compromisso[];
  /** Planejamento anual previsto para o mês da semana exibida. */
  previstos: PrevistoMes[];
  /** Todas as tarefas pendentes — alimenta a visualização em lista. */
  tarefas: Compromisso[];
};
