import type { TipoPagamentoDs } from "./regras";

/**
 * Dados de demonstração dos pagamentos de Diferencial de Sustentabilidade (DS)
 * e Investimentos (DI) — a norma RA exige o registro do que foi pago ao produtor.
 */

export type PagamentoDemo = {
  id: string;
  clienteId: string;
  cliente: string;
  tipo: TipoPagamentoDs;
  valor: number;
  data: string; // ISO yyyy-mm-dd
  descricao: string | null;
};

export const PAGAMENTOS_DEMO: PagamentoDemo[] = [
  {
    id: "pgto-ds-2026-04",
    clienteId: "lagoinha",
    cliente: "Fazenda Lagoinha",
    tipo: "diferencial",
    valor: 18500,
    data: "2026-07-28",
    descricao: "DS safra 2025/2026 — 370 sacas certificadas RA",
  },
  {
    id: "pgto-ds-2026-03",
    clienteId: "bernardes",
    cliente: "Fazenda Bernardes",
    tipo: "diferencial",
    valor: 12400,
    data: "2026-07-10",
    descricao: "DS safra 2025/2026 — lote exportação",
  },
  {
    id: "pgto-ds-2026-02",
    clienteId: "lagoinha",
    cliente: "Fazenda Lagoinha",
    tipo: "investimento",
    valor: 6200,
    data: "2026-05-15",
    descricao: "DI — reforma do depósito de defensivos",
  },
  {
    id: "pgto-ds-2026-01",
    clienteId: "lambari",
    cliente: "Fazenda Lambari",
    tipo: "investimento",
    valor: 4800,
    data: "2026-03-02",
    descricao: "DI — EPIs e sinalização NR-31",
  },
  {
    id: "pgto-ds-2025-02",
    clienteId: "lagoinha",
    cliente: "Fazenda Lagoinha",
    tipo: "diferencial",
    valor: 15200,
    data: "2025-08-20",
    descricao: "DS safra 2024/2025",
  },
  {
    id: "pgto-ds-2025-01",
    clienteId: "bernardes",
    cliente: "Fazenda Bernardes",
    tipo: "investimento",
    valor: 3500,
    data: "2025-06-11",
    descricao: "DI — melhoria de moradias",
  },
];
