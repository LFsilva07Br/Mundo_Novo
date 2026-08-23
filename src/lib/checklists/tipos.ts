/**
 * Tipos do domínio de checklists versionados e visitas.
 *
 * Regras centrais (docs/funcional.md):
 * - checklist é versionado: edições acontecem em uma versão RASCUNHO e só
 *   chegam ao app após a publicação;
 * - todo item tem vínculo obrigatório com a norma (referenciaNorma);
 * - resposta "não conforme" abre CAPA automaticamente (gatilho no banco).
 */

export type StatusVersaoChecklist = "rascunho" | "publicada" | "arquivada";

export type ItemVersao = {
  id: string;
  versaoId: string;
  ordem: number;
  codigo: string;
  capitulo: string | null;
  pergunta: string;
  obrigatorio: boolean;
  fotosMinimas: number;
  descricaoMinima: number;
  /** Vínculo obrigatório com o capítulo da norma. */
  referenciaNorma: string;
  permiteNa: boolean;
};

export type VersaoChecklist = {
  id: string;
  numero: number;
  status: StatusVersaoChecklist;
  publicadaEm: string | null;
  itens: ItemVersao[];
};

export type ChecklistAtual = {
  id: string;
  nome: string;
  norma: string;
  versaoNorma: string | null;
  /** Versão em uso no app (status "publicada"). */
  publicada: VersaoChecklist | null;
  /** Versão em edição, se houver (status "rascunho"). */
  rascunho: VersaoChecklist | null;
};

export type Resposta = "conforme" | "nao_conforme" | "nao_aplicavel";
export type OrigemVisita = "campo" | "escritorio";
export type StatusVisita = "em_andamento" | "concluida" | "sincronizada";

export type RespostaVisita = {
  itemId: string;
  resposta: Resposta;
  descricao: string | null;
};

export type VisitaResumo = {
  id: string;
  titulo: string;
  clienteNome: string;
  origem: OrigemVisita;
  status: StatusVisita;
  iniciadaEm: string;
  concluidaEm: string | null;
  totalItens: number;
  respondidos: number;
  naoConformes: number;
  /** Percentual de conformidade — calculado apenas para visitas concluídas. */
  conformidade: number | null;
};

export type VisitaDetalhe = {
  id: string;
  titulo: string;
  clienteId: string;
  clienteNome: string;
  origem: OrigemVisita;
  status: StatusVisita;
  iniciadaEm: string;
  concluidaEm: string | null;
  itens: ItemVersao[];
  respostas: RespostaVisita[];
};

export const ROTULO_ORIGEM: Record<OrigemVisita, string> = {
  campo: "Campo",
  escritorio: "Escritório",
};

export const ROTULO_STATUS_VISITA: Record<StatusVisita, string> = {
  em_andamento: "Em andamento",
  concluida: "Concluída",
  sincronizada: "Sincronizada",
};

export const ROTULO_RESPOSTA: Record<Resposta, string> = {
  conforme: "Conforme",
  nao_conforme: "Não conforme",
  nao_aplicavel: "N.A.",
};
