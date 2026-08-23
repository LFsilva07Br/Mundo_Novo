import type { LoteBase, Negociacao } from "./consultas";

/**
 * Dados de demonstração da comercialização — lotes da Fazenda Alto da Serra
 * no formato do domínio. Servidos pelas consultas quando o Supabase ainda
 * não está conectado (testes e modo demonstração).
 */

export const LOTES_DEMO: LoteBase[] = [
  {
    id: "lote-2026-001",
    clienteId: "alto-da-serra",
    clienteNome: "Fazenda Alto da Serra",
    safraId: "safra-2025-26",
    safraRotulo: "2025/26",
    identificacao: "LOTE-2026-001",
    sacas: 350,
    origemTalhoes: "T-01, T-02, T-05",
    peneira: "16 acima",
    bebida: "dura",
    status: "estoque",
    observacao:
      "Café certificado Rainforest — manter separado dos lotes não certificados no armazém.",
  },
  {
    id: "lote-2026-002",
    clienteId: "alto-da-serra",
    clienteNome: "Fazenda Alto da Serra",
    safraId: "safra-2025-26",
    safraRotulo: "2025/26",
    identificacao: "LOTE-2026-002",
    sacas: 200,
    origemTalhoes: "T-03, T-04",
    peneira: "17/18",
    bebida: "mole",
    status: "negociado",
  },
  {
    id: "lote-2025-014",
    clienteId: "alto-da-serra",
    clienteNome: "Fazenda Alto da Serra",
    safraId: "safra-2024-25",
    safraRotulo: "2024/25",
    identificacao: "LOTE-2025-014",
    sacas: 120,
    origemTalhoes: "T-07",
    peneira: "15/16",
    bebida: "dura",
    status: "entregue",
    observacao:
      "Venda registrada no sistema antigo — negociações não migradas.",
  },
];

export const NEGOCIACOES_DEMO: Negociacao[] = [
  {
    id: "negociacao-001",
    loteId: "lote-2026-001",
    loteIdentificacao: "LOTE-2026-001",
    comprador: "Stockler Exportadora",
    sacas: 150,
    precoPorSaca: 2480,
    data: "2026-08-10",
    status: "proposta",
    observacao: "Aguardando classificação da amostra enviada.",
  },
  {
    id: "negociacao-002",
    loteId: "lote-2026-002",
    loteIdentificacao: "LOTE-2026-002",
    comprador: "Cooxupé",
    sacas: 200,
    precoPorSaca: 2520,
    data: "2026-07-28",
    contrato: "CT-2026-045",
    status: "fechada",
  },
];
