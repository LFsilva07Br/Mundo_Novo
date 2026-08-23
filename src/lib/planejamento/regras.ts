import type { PlanejamentoVisita, VisitaConcluida } from "./tipos";

/**
 * Regras puras do planejamento anual — vinculação automática de visitas
 * realizadas e cálculo de cobertura da carteira. Sem banco, testáveis.
 */

/** Planejamento com o status calculado para exibição. */
export type PlanejamentoComStatus = PlanejamentoVisita & { realizado: boolean };

/** Mês (1-12) e ano de um instante ISO. */
function mesAno(iso: string): { mes: number; ano: number } {
  const data = new Date(iso);
  return { mes: data.getMonth() + 1, ano: data.getFullYear() };
}

/**
 * Encontra uma visita concluída do cliente que realiza o planejamento:
 * mesma no ano do planejamento e no mês previsto com tolerância de ±1 mês.
 * Devolve o id da visita ou null.
 */
export function encontrarVisitaRealizada(
  planejamento: Pick<PlanejamentoVisita, "clienteId" | "ano" | "mesPrevisto">,
  visitas: VisitaConcluida[],
): string | null {
  const candidata = visitas.find((visita) => {
    if (visita.clienteId !== planejamento.clienteId) return false;
    const quando = mesAno(visita.concluidaEm);
    if (quando.ano !== planejamento.ano) return false;
    return Math.abs(quando.mes - planejamento.mesPrevisto) <= 1;
  });
  return candidata?.id ?? null;
}

/**
 * Vincula automaticamente as visitas concluídas aos planejamentos do ano:
 * quem já tem `visitaId` permanece; os demais recebem o vínculo quando há
 * visita concluída no mês previsto ±1.
 */
export function vincularRealizadas(
  planejamentos: PlanejamentoVisita[],
  visitas: VisitaConcluida[],
): PlanejamentoComStatus[] {
  return planejamentos.map((planejamento) => {
    const visitaId =
      planejamento.visitaId ?? encontrarVisitaRealizada(planejamento, visitas);
    return { ...planejamento, visitaId, realizado: visitaId !== null };
  });
}

export type Cobertura = {
  /** Total de clientes da carteira. */
  total: number;
  /** Clientes com pelo menos um planejamento no ano. */
  planejados: number;
  /** Planejamentos com visita concluída vinculada. */
  realizados: number;
  /** Ids dos clientes SEM nenhum planejamento no ano. */
  semPlanejamento: string[];
};

/** Indicador de cobertura do ano: planejados / total e realizados. */
export function calcularCobertura(
  clientes: { id: string }[],
  planejamentos: PlanejamentoComStatus[],
): Cobertura {
  const comPlanejamento = new Set(planejamentos.map((p) => p.clienteId));
  return {
    total: clientes.length,
    planejados: clientes.filter((c) => comPlanejamento.has(c.id)).length,
    realizados: planejamentos.filter((p) => p.realizado).length,
    semPlanejamento: clientes
      .filter((c) => !comPlanejamento.has(c.id))
      .map((c) => c.id),
  };
}
