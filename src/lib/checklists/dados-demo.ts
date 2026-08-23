import { ITENS_CHECKLIST_RA } from "@/lib/certificacao/dados-demo";
import type {
  ChecklistAtual,
  ItemVersao,
  VisitaDetalhe,
} from "./tipos";

/**
 * Dados de demonstração do módulo de checklists e visitas — usados quando o
 * Supabase não está conectado (testes e modo demonstração). Os itens são os
 * mesmos da carga inicial do banco (migration 0006), importados do protótipo.
 */

const VERSAO_PUBLICADA_DEMO = "demo-versao-1";

export const ITENS_VERSAO_DEMO: ItemVersao[] = ITENS_CHECKLIST_RA.map(
  (item, indice) => ({
    id: `demo-item-${item.codigo}`,
    versaoId: VERSAO_PUBLICADA_DEMO,
    ordem: indice + 1,
    codigo: item.codigo,
    capitulo: item.capitulo,
    pergunta: item.pergunta,
    obrigatorio: item.obrigatorio,
    fotosMinimas: item.fotosMinimas,
    descricaoMinima: item.descricaoMinima,
    referenciaNorma: item.referencia,
    permiteNa: true,
  }),
);

export const CHECKLIST_DEMO: ChecklistAtual = {
  id: "demo-checklist-ra",
  nome: "Auditoria interna — Rainforest Alliance",
  norma: "ra",
  versaoNorma: "1.4",
  publicada: {
    id: VERSAO_PUBLICADA_DEMO,
    numero: 1,
    status: "publicada",
    publicadaEm: "2026-08-01T12:00:00Z",
    itens: ITENS_VERSAO_DEMO,
  },
  rascunho: null,
};

const DESCRICAO_NC_DEMO =
  "Depósito de defensivos sem sinalização de segurança NR-31 na porta e nas prateleiras; o piso é de terra batida, " +
  "sem impermeabilização, com risco de contaminação do solo em caso de vazamento. Registrado com fotos e GPS.";

/** Visita concluída na Fazenda Alto da Serra — espelha a CAPA #131 da carga. */
export const VISITAS_DEMO: VisitaDetalhe[] = [
  {
    id: "demo-visita-1",
    titulo: "Auditoria interna RA 1.4",
    clienteId: "alto-da-serra",
    clienteNome: "Fazenda Alto da Serra",
    origem: "campo",
    status: "concluida",
    iniciadaEm: "2026-08-22T10:30:00Z",
    concluidaEm: "2026-08-22T13:10:00Z",
    itens: ITENS_VERSAO_DEMO,
    respostas: ITENS_VERSAO_DEMO.map((item) => ({
      itemId: item.id,
      resposta:
        item.codigo === "EST-1"
          ? ("nao_conforme" as const)
          : item.codigo === "2.1.5"
            ? ("nao_aplicavel" as const)
            : ("conforme" as const),
      descricao: item.codigo === "EST-1" ? DESCRICAO_NC_DEMO : null,
    })),
  },
  {
    id: "demo-visita-2",
    titulo: "Checklist ambiental trimestral",
    clienteId: "guatambu",
    clienteNome: "Fazendas Guatambu",
    origem: "campo",
    status: "em_andamento",
    iniciadaEm: "2026-08-23T09:00:00Z",
    concluidaEm: null,
    itens: ITENS_VERSAO_DEMO,
    respostas: [
      {
        itemId: ITENS_VERSAO_DEMO[0].id,
        resposta: "conforme",
        descricao: null,
      },
      {
        itemId: ITENS_VERSAO_DEMO[1].id,
        resposta: "conforme",
        descricao: null,
      },
    ],
  },
];
