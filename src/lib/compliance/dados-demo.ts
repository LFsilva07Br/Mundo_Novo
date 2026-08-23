import type { MetaPlano, RiscoPlano } from "./validacao";

/**
 * Dados de demonstração do módulo Compliance Social — plausíveis para a
 * Fazenda Alto da Serra (mesmo cliente padrão dos outros módulos).
 * Servem as telas quando o Supabase não está conectado (testes/demo).
 */

export type CasoDemo = {
  id: string;
  tipo:
    | "trabalho_infantil"
    | "trabalho_forcado"
    | "discriminacao"
    | "assedio"
    | "outro";
  origem: "monitoramento" | "queixa" | "auditoria";
  descricao: string;
  remediacao?: string;
  status: "aberto" | "em_remediacao" | "encerrado";
  criadoEm: string; // ISO
};

export const CASOS_DEMO: CasoDemo[] = [
  {
    id: "caso-horas-colheita",
    tipo: "outro",
    origem: "monitoramento",
    descricao:
      "Na visita de julho foi observada jornada acima do limite na colheita, sem o descanso semanal registrado para dois colaboradores temporários.",
    status: "em_remediacao",
    remediacao:
      "Escala de colheita refeita com folga semanal garantida; conferência quinzenal do ponto durante a safra.",
    criadoEm: "2026-07-14",
  },
  {
    id: "caso-assedio-encerrado",
    tipo: "assedio",
    origem: "queixa",
    descricao:
      "Queixa do canal relatou tratamento desrespeitoso de um líder de turma com colaboradoras na lavagem do café.",
    remediacao:
      "Conversa formal registrada com o líder, treinamento de conduta respeitosa para toda a liderança e acompanhamento mensal com a equipe.",
    status: "encerrado",
    criadoEm: "2026-05-08",
  },
];

export type QueixaDemo = {
  id: string;
  mensagem: string;
  anonima: boolean;
  contato?: string;
  status: "recebida" | "em_analise" | "tratada";
  casoId?: string;
  criadoEm: string; // ISO
};

export const QUEIXAS_DEMO: QueixaDemo[] = [
  {
    id: "queixa-alojamento",
    mensagem:
      "O chuveiro do alojamento dos temporários está sem água quente há duas semanas e ninguém resolveu.",
    anonima: true,
    status: "recebida",
    criadoEm: "2026-08-18",
  },
  {
    id: "queixa-assedio",
    mensagem:
      "Um líder de turma grita e humilha as mulheres na lavagem do café. Tenho medo de me identificar.",
    anonima: true,
    status: "em_analise",
    casoId: "caso-assedio-encerrado",
    criadoEm: "2026-05-05",
  },
];

export const ANO_PLANO_DEMO = 2026;

export const RISCOS_DEMO: RiscoPlano[] = [
  {
    area: "Social",
    risco: "Jornada excessiva na colheita (pico de safra).",
    probabilidade: "medio",
    impacto: "alto",
    mitigacao: "Escala com folga semanal e conferência quinzenal do ponto.",
  },
  {
    area: "Agroquímicos",
    risco: "Uso de produto da lista de banidos da RA por estoque antigo.",
    probabilidade: "baixo",
    impacto: "alto",
    mitigacao:
      "Inventário do depósito e descarte assistido dos produtos proibidos.",
  },
];

export const METAS_DEMO: MetaPlano[] = [
  {
    meta: "Divulgar o canal de queixas em todos os quadros de aviso da fazenda.",
    prazo: "2026-09-30",
    responsavel: "Ana Souza",
    concluida: false,
  },
  {
    meta: "Treinar 100% da liderança em conduta respeitosa.",
    prazo: "2026-06-30",
    responsavel: "Carlos Pereira",
    concluida: true,
  },
];
