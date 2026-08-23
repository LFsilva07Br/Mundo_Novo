import type { TarefaPacote } from "./tipos";

/**
 * Tarefas de demonstração do App de Campo — servidas pelo pacote quando o
 * Supabase não está conectado, espelhando o que o motor de gatilhos gera.
 */

function emDias(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString().slice(0, 10);
}

export const TAREFAS_DEMO: TarefaPacote[] = [
  {
    id: "demo-tarefa-1",
    titulo: "Renovar certificado Rainforest Alliance",
    detalhe: "Certificação RA vence em breve — iniciar renovação.",
    clienteNome: "Fazenda Alto da Serra",
    origem: "data",
    venceEm: emDias(25),
  },
  {
    id: "demo-tarefa-2",
    titulo: "Outorga de captação de água a vencer",
    detalhe: "Captação do córrego — renovar outorga junto ao órgão estadual.",
    clienteNome: "Fazendas Guatambu",
    origem: "data",
    venceEm: emDias(80),
  },
  {
    id: "demo-tarefa-3",
    titulo: "CAPA #131 aguardando evidência",
    detalhe: "Depósito de defensivos — anexar fotos da adequação NR-31.",
    clienteNome: "Fazenda Alto da Serra",
    origem: "evento",
    venceEm: emDias(12),
  },
];
