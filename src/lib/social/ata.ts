import { slugSocial } from "./regras";

/**
 * Montagem dos dados da ata de treinamento (lista de presença).
 * Função pura — o route handler busca os dados e o PDF só apresenta.
 */

export type ParticipanteAta = {
  nome: string;
  /** URL assinada da assinatura no bucket — null exibe linha para assinar. */
  assinaturaUrl: string | null;
};

export type DadosAta = {
  treinamentoNome: string;
  norma?: string;
  /** Data da turma (ISO). */
  data: string;
  /** Data da turma no formato brasileiro (dd/mm/aaaa). */
  dataFormatada: string;
  /** Participantes em ordem alfabética. */
  participantes: ParticipanteAta[];
  /** Quantas assinaturas já foram colhidas. */
  totalAssinaturas: number;
};

/** dd/mm/aaaa a partir de uma data ISO (aaaa-mm-dd). */
export function formatarDataAta(dataIso: string): string {
  return dataIso.split("-").reverse().join("/");
}

export function montarDadosAta(
  treinamento: { nome: string; norma?: string },
  data: string,
  participantes: { nome: string; assinaturaUrl?: string | null }[],
): DadosAta {
  const ordenados = [...participantes]
    .map((p) => ({ nome: p.nome, assinaturaUrl: p.assinaturaUrl ?? null }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  return {
    treinamentoNome: treinamento.nome,
    norma: treinamento.norma,
    data,
    dataFormatada: formatarDataAta(data),
    participantes: ordenados,
    totalAssinaturas: ordenados.filter((p) => p.assinaturaUrl !== null).length,
  };
}

/** Nome do arquivo PDF da ata: ata-<treinamento>-<data>.pdf */
export function nomeArquivoAta(treinamentoNome: string, data: string): string {
  return `ata-${slugSocial(treinamentoNome)}-${data}.pdf`;
}
