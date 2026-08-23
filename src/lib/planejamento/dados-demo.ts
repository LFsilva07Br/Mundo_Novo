import type { PlanejamentoVisita } from "./tipos";

/**
 * Planejamento de demonstração (ano 2026) — espelha a carteira demo:
 * a visita concluída na Alto da Serra (ago/2026) realiza o planejamento
 * de agosto; três clientes ficam propositalmente sem planejamento para
 * exercitar o alerta de cobertura.
 */
export const PLANEJAMENTOS_DEMO: PlanejamentoVisita[] = [
  {
    id: "demo-plan-1",
    clienteId: "alto-da-serra",
    ano: 2026,
    mesPrevisto: 8,
    tipo: "auditoria_interna",
    visitaId: null,
    observacao: null,
  },
  {
    id: "demo-plan-2",
    clienteId: "guatambu",
    ano: 2026,
    mesPrevisto: 9,
    tipo: "auditoria_interna",
    visitaId: null,
    observacao: "Fechar junto com a coleta de amostras.",
  },
  {
    id: "demo-plan-3",
    clienteId: "cedro",
    ano: 2026,
    mesPrevisto: 10,
    tipo: "auditoria_interna",
    visitaId: null,
    observacao: null,
  },
  {
    id: "demo-plan-4",
    clienteId: "lambari",
    ano: 2026,
    mesPrevisto: 5,
    tipo: "visita_tecnica",
    visitaId: null,
    observacao: null,
  },
  {
    id: "demo-plan-5",
    clienteId: "tecoara",
    ano: 2026,
    mesPrevisto: 11,
    tipo: "auditoria_interna",
    visitaId: null,
    observacao: null,
  },
];
