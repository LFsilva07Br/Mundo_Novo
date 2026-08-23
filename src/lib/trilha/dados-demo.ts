import type { EventoTrilha } from "./consultas";

/**
 * Eventos de demonstração da trilha de auditoria — espelham o formato
 * gravado pelo trigger `registrar_trilha` nas tabelas críticas.
 */
export const TRILHA_DEMO: EventoTrilha[] = [
  {
    id: "demo-1",
    tabela: "capas",
    registroId: "capa-131",
    acao: "atualizar",
    autor: "Fernanda Prado",
    resumo: "nº 131 — Depósito de defensivos sem sinalização NR-31",
    ocorridoEm: "2026-08-21T14:32:00-03:00",
  },
  {
    id: "demo-2",
    tabela: "contratos",
    registroId: "ctr-2026-018",
    acao: "atualizar",
    autor: "Ricardo Almeida",
    resumo: "CTR-2026-018",
    ocorridoEm: "2026-08-21T11:05:00-03:00",
  },
  {
    id: "demo-3",
    tabela: "clientes",
    registroId: "alto-da-serra",
    acao: "atualizar",
    autor: "Fernanda Prado",
    resumo: "Fazenda Alto da Serra",
    ocorridoEm: "2026-08-20T16:48:00-03:00",
  },
  {
    id: "demo-4",
    tabela: "lotes",
    registroId: "lote-2526-003",
    acao: "inserir",
    autor: "Juliana Costa",
    resumo: "AS-2526-003",
    ocorridoEm: "2026-08-20T09:12:00-03:00",
  },
  {
    id: "demo-5",
    tabela: "negociacoes",
    registroId: "neg-77",
    acao: "inserir",
    autor: "Juliana Costa",
    resumo: "Exportadora Sul Mineira — 250 sacas",
    ocorridoEm: "2026-08-19T15:20:00-03:00",
  },
  {
    id: "demo-6",
    tabela: "checklist_versoes",
    registroId: "versao-3",
    acao: "inserir",
    autor: "Fernanda Prado",
    resumo: "nº 3",
    ocorridoEm: "2026-08-18T10:02:00-03:00",
  },
  {
    id: "demo-7",
    tabela: "perfis",
    registroId: "perfil-auditor",
    acao: "inserir",
    autor: "Ricardo Almeida",
    resumo: "Auditor Certificadora",
    ocorridoEm: "2026-08-17T09:40:00-03:00",
  },
  {
    id: "demo-8",
    tabela: "casos_sociais",
    registroId: "caso-2",
    acao: "atualizar",
    autor: "Fernanda Prado",
    resumo: "Acompanhamento de remediação em andamento",
    ocorridoEm: "2026-08-15T17:25:00-03:00",
  },
];
