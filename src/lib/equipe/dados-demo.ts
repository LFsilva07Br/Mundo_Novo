/**
 * Equipe real da Mundo Novo Café (protótipo v2 validado pelo JP).
 * Regra do produto: alçada de aprovação de contrato é uma PERMISSÃO
 * por usuário (flag), não um cargo nem uma etapa de workflow.
 */

export type MembroEquipe = {
  id: string;
  nome: string;
  papel: string;
  alcadaAprovacao: boolean;
  email?: string;
};

export const EQUIPE_DEMO: MembroEquipe[] = [
  {
    id: "tamara",
    nome: "Tâmara Isa da Silva",
    papel: "Gestora do Grupo",
    alcadaAprovacao: true,
  },
  {
    id: "winicius",
    nome: "Winicius Baquião Dutra",
    papel: "Consultor de Campo",
    alcadaAprovacao: false,
  },
  {
    id: "adriano",
    nome: "Adriano Carvalho",
    papel: "Consultor de Campo",
    alcadaAprovacao: false,
  },
  {
    id: "raiane",
    nome: "Raiane Gomes Borges",
    papel: "Administrativo",
    alcadaAprovacao: true,
  },
  {
    id: "carlos",
    nome: "Carlos Mendes",
    papel: "Consultor de Campo (App)",
    alcadaAprovacao: false,
  },
];

export type ContratoPendente = {
  id: string;
  cliente: string;
  tipo: "Fazenda" | "Cadeia de Suprimentos";
  solicitadoPor: string;
  solicitadoEm: string; // ISO
  diasParado: number;
};

export const CONTRATOS_PENDENTES_DEMO: ContratoPendente[] = [
  {
    id: "2026-041",
    cliente: "Fazenda Rio Verde (novo cadastro)",
    tipo: "Fazenda",
    solicitadoPor: "Adriano Carvalho",
    solicitadoEm: "2026-07-15",
    diasParado: 38,
  },
  {
    id: "2026-039",
    cliente: "Sítio Boa Vista",
    tipo: "Cadeia de Suprimentos",
    solicitadoPor: "Raiane Gomes Borges",
    solicitadoEm: "2026-07-10",
    diasParado: 43,
  },
];
