/**
 * Regras puras das evidências fotográficas (fotos de visita e evidências de
 * CAPA): validação de arquivo e montagem do caminho no bucket 'evidencias'.
 *
 * Funções puras — usadas tanto no navegador (feedback imediato) quanto nas
 * Server Actions (a validação que vale é sempre a do servidor).
 */

export const TIPOS_DE_IMAGEM_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const TAMANHO_MAXIMO_MB = 8;
export const TAMANHO_MAXIMO_BYTES = TAMANHO_MAXIMO_MB * 1024 * 1024;

const EXTENSAO_POR_TIPO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type ResultadoValidacao = { ok: true } | { ok: false; erro: string };

/** Valida tipo e tamanho de um arquivo de evidência (JPEG/PNG/WebP, até 8 MB). */
export function validarArquivoEvidencia(arquivo: {
  type: string;
  size: number;
}): ResultadoValidacao {
  if (!(TIPOS_DE_IMAGEM_PERMITIDOS as readonly string[]).includes(arquivo.type)) {
    return {
      ok: false,
      erro: "Formato não aceito — envie fotos JPEG, PNG ou WebP.",
    };
  }
  if (arquivo.size <= 0) {
    return { ok: false, erro: "O arquivo está vazio — escolha uma foto válida." };
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return {
      ok: false,
      erro: `A foto passa do limite de ${TAMANHO_MAXIMO_MB} MB — reduza a imagem e tente de novo.`,
    };
  }
  return { ok: true };
}

/** Extensão de arquivo correspondente ao tipo MIME (jpg quando desconhecido). */
export function extensaoDoTipo(tipo: string): string {
  return EXTENSAO_POR_TIPO[tipo] ?? "jpg";
}

/**
 * Caminho no bucket: `visitas/<id>/<instante>-<sufixo>.<ext>` ou
 * `capas/<id>/<instante>-<sufixo>.<ext>`. O par instante + sufixo aleatório
 * evita colisão entre uploads simultâneos.
 */
export function montarCaminhoEvidencia(
  pasta: "visitas" | "capas",
  registroId: string,
  tipoArquivo: string,
  instante: number = Date.now(),
  sufixo: string = Math.random().toString(36).slice(2, 8),
): string {
  return `${pasta}/${registroId}/${instante}-${sufixo}.${extensaoDoTipo(tipoArquivo)}`;
}
