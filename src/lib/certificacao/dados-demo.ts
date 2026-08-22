/**
 * Dados de demonstração do ciclo de certificação:
 * - Kanban com as 5 etapas reais (distribuição do protótipo v2 validado);
 * - Itens reais da norma RA 1.4 usados no editor de checklist;
 * - CAPAs de exemplo seguindo a regra "NC nunca fica sem plano de ação".
 */

export const ETAPAS_WORKFLOW = [
  "Auditoria interna",
  "Correção de NCs",
  "Revisão do gestor",
  "Na certificadora",
  "Aprovado",
] as const;

export type EtapaWorkflow = (typeof ETAPAS_WORKFLOW)[number];

export type CartaoWorkflow = {
  clienteId: string;
  cliente: string;
  normas: string;
  conformidade: number;
  etapa: EtapaWorkflow;
  observacao?: string;
};

export const WORKFLOW_DEMO: CartaoWorkflow[] = [
  { clienteId: "alto-da-serra", cliente: "Fazenda Alto da Serra", normas: "RA", conformidade: 88, etapa: "Auditoria interna" },
  { clienteId: "lambari", cliente: "Fazenda Lambari", normas: "RA, Orgânico", conformidade: 90, etapa: "Auditoria interna" },
  { clienteId: "bernardes", cliente: "Fazenda Bernardes", normas: "RA, 4C", conformidade: 94, etapa: "Correção de NCs" },
  { clienteId: "tecoara", cliente: "Fazenda Tecoara", normas: "RA", conformidade: 68, etapa: "Correção de NCs" },
  { clienteId: "cedro", cliente: "Fazenda Cedro", normas: "RA", conformidade: 79, etapa: "Revisão do gestor", observacao: "dossiê completo" },
  { clienteId: "guatambu", cliente: "Fazendas Guatambu", normas: "RA", conformidade: 76, etapa: "Revisão do gestor" },
  { clienteId: "chapadao-de-ferro", cliente: "Fazenda Chapadão de Ferro", normas: "RA", conformidade: 71, etapa: "Na certificadora", observacao: "notificação automática enviada ao gestor" },
  { clienteId: "lagoinha", cliente: "Fazenda Lagoinha", normas: "RA", conformidade: 85, etapa: "Aprovado", observacao: "✓ aprovado na safra" },
];

export type ItemChecklist = {
  codigo: string;
  capitulo: string;
  pergunta: string;
  obrigatorio: boolean;
  fotosMinimas: number;
  descricaoMinima: number;
  referencia: string;
};

/** Itens reais da norma RA 1.4 (protótipo v2 do JP). */
export const ITENS_CHECKLIST_RA: ItemChecklist[] = [
  { codigo: "1.2.8", capitulo: "Cap. 1 · Gerência", pergunta: "Registros para propósitos de certificação e conformidade mantidos por, no mínimo, cinco anos.", obrigatorio: true, fotosMinimas: 2, descricaoMinima: 100, referencia: "RA 1.4 — cap. 1.2.8" },
  { codigo: "1.2.9", capitulo: "Cap. 1 · Gerência", pergunta: "Mapa atualizado da fazenda, incluindo áreas de produção, moradias, escolas, ecossistemas naturais e áreas de risco identificadas.", obrigatorio: true, fotosMinimas: 2, descricaoMinima: 100, referencia: "RA 1.4 — cap. 1.2.9" },
  { codigo: "1.4.1", capitulo: "Cap. 1 · Gerência", pergunta: "Sistema de inspeção interna implementado, avaliando anualmente a conformidade de todos os atores do escopo.", obrigatorio: true, fotosMinimas: 2, descricaoMinima: 100, referencia: "RA 1.4 — cap. 1.4.1" },
  { codigo: "1.5.1", capitulo: "Cap. 1 · Gerência", pergunta: "Mecanismo de queixa acessível em qualquer idioma, com denúncias anônimas e proteção contra retaliação.", obrigatorio: true, fotosMinimas: 2, descricaoMinima: 100, referencia: "RA 1.4 — cap. 1.5.1" },
  { codigo: "2.1.3", capitulo: "Cap. 2 · Rastreabilidade", pergunta: "Produto certificado mantido fisicamente separado do não certificado em todas as etapas.", obrigatorio: true, fotosMinimas: 2, descricaoMinima: 100, referencia: "RA 1.4 — cap. 2.1.3" },
  { codigo: "2.1.5", capitulo: "Cap. 2 · Rastreabilidade", pergunta: "Produtos certificados rastreáveis até a fazenda de origem, com documentos de compra/venda completos.", obrigatorio: true, fotosMinimas: 2, descricaoMinima: 100, referencia: "RA 1.4 — cap. 2.1.5" },
  { codigo: "EST-1", capitulo: "Estrutural · Infraestrutura", pergunta: "Depósito de defensivos em conformidade — alvenaria, piso impermeável e sinalização adequada.", obrigatorio: true, fotosMinimas: 2, descricaoMinima: 100, referencia: "RA 1.4 — infraestrutura" },
  { codigo: "EST-2", capitulo: "Estrutural · Infraestrutura", pergunta: "Fiação elétrica do barracão de máquinas sem exposição nos disjuntores.", obrigatorio: true, fotosMinimas: 2, descricaoMinima: 100, referencia: "RA 1.4 — infraestrutura" },
  { codigo: "EST-3", capitulo: "Estrutural · Infraestrutura", pergunta: "EPIs armazenados no local adequado, organizados e em bom estado.", obrigatorio: true, fotosMinimas: 2, descricaoMinima: 100, referencia: "RA 1.4 — infraestrutura" },
  { codigo: "EST-4", capitulo: "Estrutural · Infraestrutura", pergunta: "Moradias dos colaboradores em bom estado de conservação.", obrigatorio: true, fotosMinimas: 2, descricaoMinima: 100, referencia: "RA 1.4 — infraestrutura" },
];

export type CapaDemo = {
  numero: number;
  origem: string;
  descricao: string;
  cliente: string;
  severidade: "Maior" | "Menor" | "Crítica";
  responsavel: string;
  prazo?: string; // ISO
  status: "Aberta" | "Em correção" | "Aguardando evidência" | "Fechada";
  origemRegistro: "Campo" | "Escritório";
};

export const CAPAS_DEMO: CapaDemo[] = [
  { numero: 131, origem: "EST-1", descricao: "Depósito de defensivos sem sinalização adequada e piso não impermeável", cliente: "Fazenda Alto da Serra", severidade: "Maior", responsavel: "Silvio Dutra", prazo: "2026-09-15", status: "Em correção", origemRegistro: "Campo" },
  { numero: 130, origem: "EST-2", descricao: "Fiação exposta nos disjuntores do barracão de máquinas", cliente: "Fazenda Tecoara", severidade: "Maior", responsavel: "Produtor responsável", prazo: "2026-09-05", status: "Aguardando evidência", origemRegistro: "Campo" },
  { numero: 129, origem: "1.2.8", descricao: "Registros de aplicação de defensivos incompletos no último ciclo", cliente: "Fazenda Chapadão de Ferro", severidade: "Menor", responsavel: "Gestor da fazenda", prazo: "2026-09-30", status: "Aberta", origemRegistro: "Escritório" },
  { numero: 128, origem: "1.5.1", descricao: "Mecanismo de queixa sem canal anônimo divulgado aos colaboradores", cliente: "Fazenda Cedro", severidade: "Menor", responsavel: "RH da fazenda", prazo: "2026-10-10", status: "Em correção", origemRegistro: "Escritório" },
  { numero: 127, origem: "EST-3", descricao: "EPIs armazenados fora do local adequado", cliente: "Fazenda Lambari", severidade: "Menor", responsavel: "Encarregado de campo", status: "Fechada", origemRegistro: "Campo" },
];

export const RANKING_GAPS = [
  { categoria: "Infraestrutura", quantidade: 3 },
  { categoria: "Gerência e registros", quantidade: 2 },
  { categoria: "Rastreabilidade", quantidade: 0 },
];
