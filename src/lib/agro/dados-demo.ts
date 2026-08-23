import type { ParticipacaoTreinamento } from "./regras";

/**
 * Dados de demonstração do módulo Agroquímicos — plausíveis para a
 * Fazenda Alto da Serra (mesmos talhões e colaboradores dos outros módulos).
 * Servem a página quando o Supabase não está conectado (testes/demo).
 */

export type ProdutoDemo = {
  nome: string;
  ingredienteAtivo?: string;
  proibidoRa: boolean;
  observacao?: string;
};

export const PRODUTOS_DEMO: ProdutoDemo[] = [
  {
    nome: "Glifosato 480 SL",
    ingredienteAtivo: "Glifosato",
    proibidoRa: false,
    observacao: "Herbicida de manejo das ruas do café.",
  },
  {
    nome: "Paraquate 200 SL",
    ingredienteAtivo: "Paraquate",
    proibidoRa: true,
    observacao:
      "Consta na lista de agroquímicos proibidos da Rainforest Alliance — uso veda a certificação.",
  },
  {
    nome: "Priori Xtra",
    ingredienteAtivo: "Azoxistrobina + Ciproconazol",
    proibidoRa: false,
    observacao: "Fungicida para ferrugem do cafeeiro.",
  },
];

export type AplicacaoDemo = {
  /** Índice do talhão na carga demo (1 = Garagem, 4 = São Bento, 5 = Baixada). */
  talhaoIndice: number;
  talhaoNome: string;
  imovelNome: string;
  produtoNome: string;
  dose?: string;
  data: string; // ISO
  aplicadorNome?: string;
  equipamento?: string;
  observacao?: string;
};

export const APLICACOES_DEMO: AplicacaoDemo[] = [
  {
    talhaoIndice: 1,
    talhaoNome: "Garagem",
    imovelNome: "Sítio Alto da Serra (Garagem)",
    produtoNome: "Glifosato 480 SL",
    dose: "2,5 L/ha",
    data: "2026-04-14",
    aplicadorNome: "Ricardo Aparecido de Abreu",
    equipamento: "Pulverizador de barra",
    observacao: "Manejo das ruas antes da colheita.",
  },
  {
    talhaoIndice: 4,
    talhaoNome: "São Bento",
    imovelNome: "Sítio Serra da Boa Vista",
    produtoNome: "Paraquate 200 SL",
    dose: "1,5 L/ha",
    data: "2026-05-20",
    aplicadorNome: "Ricardo Aparecido de Abreu",
    equipamento: "Costal motorizado",
    observacao: "Estoque antigo do depósito — produto banido pela RA.",
  },
  {
    talhaoIndice: 5,
    talhaoNome: "Baixada",
    imovelNome: "Sítio Alto da Serra (Garagem)",
    produtoNome: "Priori Xtra",
    dose: "500 mL/ha",
    data: "2026-06-02",
    aplicadorNome: "Rogerio Aparecido de Abreu",
    equipamento: "Pulverizador de barra",
  },
];

/**
 * Participações no treinamento "Defensivos" (NR-31, anual) por aplicador:
 * Ricardo está em dia; Rogerio fez a turma de 2024 e deixou vencer;
 * quem não aparece aqui está sem registro.
 */
export const PARTICIPACOES_DEFENSIVOS_DEMO: Record<
  string,
  ParticipacaoTreinamento[]
> = {
  "Ricardo Aparecido de Abreu": [
    { realizadoEm: "2025-03-04", venceEm: "2026-03-04" },
    { realizadoEm: "2026-03-06", venceEm: "2027-03-06" },
  ],
  "Rogerio Aparecido de Abreu": [
    { realizadoEm: "2024-05-10", venceEm: "2025-05-10" },
  ],
};

export type DestinacaoDemo = {
  data: string; // ISO
  quantidade?: number;
  descricao: string;
  temComprovante: boolean;
};

export const DESTINACOES_DEMO: DestinacaoDemo[] = [
  {
    data: "2026-07-15",
    quantidade: 48,
    descricao:
      "Devolução de embalagens tríplice lavadas na central de recebimento de Manhuaçu.",
    temComprovante: true,
  },
];
