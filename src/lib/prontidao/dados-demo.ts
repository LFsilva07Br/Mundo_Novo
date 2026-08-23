/**
 * Dados de demonstração do módulo de prontidão — usados quando o Supabase
 * não está conectado (testes e modo demonstração).
 *
 * - Lotes: espelham a tabela `lotes` (comercialização) por cliente;
 * - Previsões: complementam a previsão de safra dos clientes que ainda não
 *   têm talhões cadastrados no modo demonstração (só a Alto da Serra tem);
 * - Histórico de conformidade: evolução mensal das auditorias internas
 *   concluídas, na linha do protótipo v2 validado com a cliente.
 */

export type LoteDemo = {
  clienteId: string;
  identificacao: string;
  sacas: number;
  status: "estoque" | "negociado" | "entregue" | "cancelado";
};

export const LOTES_DEMO: LoteDemo[] = [
  { clienteId: "alto-da-serra", identificacao: "LOTE-2025-001", sacas: 900, status: "entregue" },
  { clienteId: "alto-da-serra", identificacao: "LOTE-2025-002", sacas: 1200, status: "negociado" },
  { clienteId: "alto-da-serra", identificacao: "LOTE-2025-003", sacas: 600, status: "estoque" },
  { clienteId: "alto-da-serra", identificacao: "LOTE-2025-004", sacas: 350, status: "cancelado" },
  { clienteId: "cedro", identificacao: "LOTE-2025-011", sacas: 620, status: "negociado" },
  { clienteId: "cedro", identificacao: "LOTE-2025-012", sacas: 330, status: "estoque" },
  { clienteId: "lambari", identificacao: "LOTE-2025-021", sacas: 480, status: "entregue" },
];

/**
 * Previsão de safra 2025/26 (sacas) dos clientes sem talhões cadastrados
 * no modo demonstração. Com o banco conectado, a previsão vem sempre de
 * `talhao_safras` da safra atual.
 */
export const PREVISOES_DEMO: Record<string, number> = {
  cedro: 800,
  lambari: 1100,
};

export type PontoConformidadeDemo = {
  /** yyyy-mm */
  mes: string;
  conformidade: number;
};

/** Evolução mensal da conformidade por cliente (auditorias internas). */
export const HISTORICO_CONFORMIDADE_DEMO: Record<
  string,
  PontoConformidadeDemo[]
> = {
  "alto-da-serra": [
    { mes: "2026-02", conformidade: 74 },
    { mes: "2026-04", conformidade: 79 },
    { mes: "2026-06", conformidade: 84 },
    { mes: "2026-08", conformidade: 88 },
  ],
  bernardes: [
    { mes: "2026-03", conformidade: 88 },
    { mes: "2026-06", conformidade: 91 },
    { mes: "2026-08", conformidade: 94 },
  ],
  cedro: [
    { mes: "2026-03", conformidade: 82 },
    { mes: "2026-06", conformidade: 80 },
    { mes: "2026-08", conformidade: 79 },
  ],
  "chapadao-de-ferro": [
    { mes: "2026-04", conformidade: 65 },
    { mes: "2026-07", conformidade: 71 },
  ],
  lagoinha: [
    { mes: "2026-02", conformidade: 78 },
    { mes: "2026-05", conformidade: 82 },
    { mes: "2026-08", conformidade: 85 },
  ],
  lambari: [
    { mes: "2026-03", conformidade: 84 },
    { mes: "2026-06", conformidade: 87 },
    { mes: "2026-08", conformidade: 90 },
  ],
  tecoara: [
    { mes: "2026-05", conformidade: 72 },
    { mes: "2026-08", conformidade: 68 },
  ],
  guatambu: [
    { mes: "2026-04", conformidade: 70 },
    { mes: "2026-07", conformidade: 76 },
  ],
};
