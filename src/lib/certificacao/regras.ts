/**
 * Regras de negócio do ciclo de certificação (funções puras, testáveis):
 * - Sequência das 6 etapas do workflow (implantação → aprovado);
 * - Movimento válido: só avança 1 etapa ou volta 1;
 * - CAPA só fecha com todas as ações concluídas;
 * - Contrato parado há mais de 10 dias dispara escalonamento;
 * - Ranking de gaps agrupado pela categoria do item da norma.
 */

export const ETAPAS_PROCESSO = [
  "implantacao",
  "auditoria_interna",
  "correcao_ncs",
  "revisao_gestor",
  "na_certificadora",
  "aprovado",
] as const;

export type EtapaProcesso = (typeof ETAPAS_PROCESSO)[number];

export const ROTULO_ETAPA: Record<EtapaProcesso, string> = {
  implantacao: "Implantação",
  auditoria_interna: "Auditoria interna",
  correcao_ncs: "Correção de NCs",
  revisao_gestor: "Revisão do gestor",
  na_certificadora: "Na certificadora",
  aprovado: "Aprovado",
};

export function ehEtapaValida(valor: string): valor is EtapaProcesso {
  return (ETAPAS_PROCESSO as readonly string[]).includes(valor);
}

export function proximaEtapa(etapa: EtapaProcesso): EtapaProcesso | null {
  const indice = ETAPAS_PROCESSO.indexOf(etapa);
  return ETAPAS_PROCESSO[indice + 1] ?? null;
}

/**
 * Um movimento no workflow é válido apenas entre etapas vizinhas:
 * avançar 1 etapa ou voltar 1 etapa. Pular etapas é proibido.
 */
export function movimentoValido(de: EtapaProcesso, para: EtapaProcesso): boolean {
  if (!ehEtapaValida(de) || !ehEtapaValida(para)) return false;
  const distancia = ETAPAS_PROCESSO.indexOf(para) - ETAPAS_PROCESSO.indexOf(de);
  return distancia === 1 || distancia === -1;
}

/** CAPA só pode ser fechada quando não resta nenhuma ação pendente. */
export function podeFecharCapa(acoes: { concluida: boolean }[]): boolean {
  return acoes.every((acao) => acao.concluida);
}

/** Dias corridos desde a solicitação do contrato. */
export function diasParado(solicitadoEm: string, hoje: Date = new Date()): number {
  const inicio = new Date(`${solicitadoEm}T12:00:00`);
  const umDia = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.floor((hoje.getTime() - inicio.getTime()) / umDia));
}

export const LIMITE_DIAS_CONTRATO = 10;

/** Contrato parado há mais de 10 dias mostra escalonamento à diretoria. */
export function contratoEscalonado(dias: number): boolean {
  return dias > LIMITE_DIAS_CONTRATO;
}

/**
 * Categoria de gap a partir do código do item da norma:
 * 1.x → Gerência · 2.x → Rastreabilidade · EST-x → Infraestrutura.
 */
export function categoriaDoItem(codigo: string | null | undefined): string {
  if (!codigo) return "Outros";
  if (codigo.startsWith("1.")) return "Gerência";
  if (codigo.startsWith("2.")) return "Rastreabilidade";
  if (codigo.toUpperCase().startsWith("EST")) return "Infraestrutura";
  return "Outros";
}

const CATEGORIAS_BASE = ["Gerência", "Rastreabilidade", "Infraestrutura"];

export function calcularRankingGaps(
  capas: { itemCodigo?: string | null }[],
): { categoria: string; quantidade: number }[] {
  const contagem = new Map<string, number>(CATEGORIAS_BASE.map((c) => [c, 0]));
  for (const capa of capas) {
    const categoria = categoriaDoItem(capa.itemCodigo);
    contagem.set(categoria, (contagem.get(categoria) ?? 0) + 1);
  }
  return [...contagem.entries()]
    .filter(([categoria, quantidade]) =>
      CATEGORIAS_BASE.includes(categoria) ? true : quantidade > 0,
    )
    .map(([categoria, quantidade]) => ({ categoria, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade);
}

// ------------------------------------------------------- rejeição de contrato

/** Mínimo para o motivo dizer alguma coisa a quem solicitou o contrato. */
export const MOTIVO_REJEICAO_MINIMO = 10;
/** Máximo do motivo da rejeição — é um recado curto, não um laudo. */
export const MOTIVO_REJEICAO_MAXIMO = 280;

/**
 * Rejeitar sem dizer por quê deixa quem solicitou sem saída: na rejeição o
 * motivo é obrigatório (e curto). Na aprovação, é ignorado.
 */
export function motivoRejeicaoValido(
  decisao: "aprovado" | "rejeitado",
  motivo: string | null | undefined,
): boolean {
  if (decisao !== "rejeitado") return true;
  const limpo = (motivo ?? "").trim();
  return (
    limpo.length >= MOTIVO_REJEICAO_MINIMO &&
    limpo.length <= MOTIVO_REJEICAO_MAXIMO
  );
}
