import type { SeveridadeNc, StatusCapa } from "@/lib/certificacao/consultas";

/**
 * Dados de demonstração dos achados da auditoria externa (certificadora).
 * Espelham o cenário real: parte dos achados já tinha CAPA aberta pela
 * auditoria interna; parte foi pega só pela certificadora.
 */

export type AchadoDemo = {
  id: string;
  clienteId: string;
  cliente: string;
  certificadora: string;
  codigo: string;
  itemNorma: string | null;
  descricao: string;
  severidade: SeveridadeNc;
  prazo: string | null; // ISO yyyy-mm-dd
  status: StatusCapa;
  /** CAPA interna vinculada (número), quando a interna já tinha pego. */
  capaNumero: number | null;
  capaStatus: StatusCapa | null;
  encontradoEm: string; // ISO yyyy-mm-dd
};

export const ACHADOS_DEMO: AchadoDemo[] = [
  {
    id: "achado-ext-2026-04",
    clienteId: "lagoinha",
    cliente: "Fazenda Lagoinha",
    certificadora: "ALAICE",
    codigo: "NC-2026-041",
    itemNorma: "EST-4",
    descricao:
      "Moradia de colaborador com infiltração no telhado, não apontada na auditoria interna",
    severidade: "maior",
    prazo: "2026-10-26",
    status: "em_correcao",
    capaNumero: null,
    capaStatus: null,
    encontradoEm: "2026-08-17",
  },
  {
    id: "achado-ext-2026-03",
    clienteId: "chapadao-de-ferro",
    cliente: "Fazenda Chapadão de Ferro",
    certificadora: "ALAICE",
    codigo: "NC-2026-038",
    itemNorma: "1.2.8",
    descricao:
      "Registros de aplicação de defensivos incompletos no último ciclo — mesmo apontamento da auditoria interna",
    severidade: "menor",
    prazo: "2026-10-19",
    status: "aberta",
    capaNumero: 129,
    capaStatus: "aberta",
    encontradoEm: "2026-08-10",
  },
  {
    id: "achado-ext-2026-02",
    clienteId: "lagoinha",
    cliente: "Fazenda Lagoinha",
    certificadora: "ALAICE",
    codigo: "NC-2026-035",
    itemNorma: "1.5.1",
    descricao:
      "Canal de queixas sem divulgação visível aos colaboradores temporários da colheita",
    severidade: "menor",
    prazo: "2026-08-15",
    status: "aguardando_evidencia",
    capaNumero: null,
    capaStatus: null,
    encontradoEm: "2026-06-06",
  },
  {
    id: "achado-ext-2026-01",
    clienteId: "lambari",
    cliente: "Fazenda Lambari",
    certificadora: "ALAICE",
    codigo: "NC-2026-012",
    itemNorma: "EST-3",
    descricao:
      "EPIs armazenados fora do local adequado — corrigido via plano de ação interno",
    severidade: "menor",
    prazo: "2026-07-20",
    status: "fechada",
    capaNumero: 127,
    capaStatus: "fechada",
    encontradoEm: "2026-05-11",
  },
];
