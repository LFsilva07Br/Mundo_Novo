/**
 * Protocolo do canal de queixas (RA 1.5.1).
 *
 * Quem faz um relato anônimo precisa de um jeito de voltar e perguntar
 * "e aí, o que aconteceu com o que eu contei?" — sem dar nome, telefone ou
 * qualquer outra pista de quem é.
 *
 * O código é derivado APENAS do id (uuid) da queixa: nenhum dado pessoal,
 * nenhuma data, nada que ligue o papelzinho no bolso à pessoa. Como o uuid
 * é aleatório, o código também é — não dá para adivinhar o protocolo de
 * outra pessoa nem descobrir quantos relatos existem.
 *
 * Formato: 8 letras/números em base32 de Crockford (sem I, L, O e U, que se
 * confundem com 1, 0 e V ao escrever à mão), exibido em dois blocos de 4:
 * "K7QM-3XZ2". São os 5 primeiros bytes do uuid — 40 bits, mais de 1
 * trilhão de combinações.
 */

/** Base32 de Crockford: sem I, L, O e U para não confundir na escrita à mão. */
const ALFABETO = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** Quantos bytes do uuid entram no código (5 bytes = 8 caracteres). */
const BYTES = 5;
const TAMANHO = 8;

/** Confusões comuns de quem copia à mão: I/L viram 1, O vira 0, U vira V. */
const CORRECOES: Record<string, string> = {
  I: "1",
  L: "1",
  O: "0",
  U: "V",
};

function hexDoUuid(uuid: string): string {
  return uuid.replace(/-/g, "").toLowerCase();
}

/**
 * Código de protocolo a partir do id da queixa.
 * Devolve os 8 caracteres sem separador (guarde/compare sempre esta forma).
 */
export function protocoloDaQueixa(queixaId: string): string {
  const hex = hexDoUuid(queixaId);
  if (!/^[0-9a-f]{10,}$/.test(hex)) {
    throw new Error("Id de queixa inválido para gerar protocolo.");
  }

  // 5 bytes = 40 bits, lidos em blocos de 5 bits (base32). Usamos
  // aritmética comum (e não deslocamento de bits): 2^40 cabe folgado em um
  // number, enquanto `<<` e `>>` do JavaScript só enxergam 32 bits.
  let bits = 0;
  for (let i = 0; i < BYTES; i += 1) {
    bits = bits * 256 + parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  let codigo = "";
  for (let i = TAMANHO - 1; i >= 0; i -= 1) {
    const indice = Math.floor(bits / 32 ** i) % 32;
    codigo += ALFABETO[indice];
  }
  return codigo;
}

/** Versão para mostrar na tela e para a pessoa anotar: "K7QM-3XZ2". */
export function formatarProtocolo(codigo: string): string {
  const limpo = normalizarProtocolo(codigo);
  if (!limpo) return "";
  return `${limpo.slice(0, 4)}-${limpo.slice(4)}`;
}

/** Protocolo já formatado direto do id da queixa. */
export function protocoloVisivel(queixaId: string): string {
  return formatarProtocolo(protocoloDaQueixa(queixaId));
}

/**
 * Limpa o que a pessoa digitou: aceita minúsculas, espaços, traços e as
 * confusões clássicas (O/0, I/1, L/1, U/V). Devolve null se não der 8
 * caracteres válidos — assim a tela consegue explicar em vez de "não achei".
 */
export function normalizarProtocolo(entrada: string): string | null {
  const bruto = entrada
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .split("")
    .map((letra) => CORRECOES[letra] ?? letra)
    .join("");
  if (bruto.length !== TAMANHO) return null;
  if (!bruto.split("").every((letra) => ALFABETO.includes(letra))) return null;
  return bruto;
}

/**
 * Faixa de uuids que pode ter gerado esse protocolo.
 *
 * O código guarda só os 5 primeiros bytes do uuid, então a consulta anônima
 * busca `id between de and ate` — sem precisar de coluna nova no banco (e
 * sem precisar varrer a tabela inteira comparando um a um).
 */
export function faixaUuidDoProtocolo(
  codigo: string,
): { de: string; ate: string } | null {
  const limpo = normalizarProtocolo(codigo);
  if (!limpo) return null;

  let bits = 0;
  for (const letra of limpo) {
    bits = bits * 32 + ALFABETO.indexOf(letra);
  }
  const hex = bits.toString(16).padStart(BYTES * 2, "0");

  return {
    de: montarUuid(hex, "0"),
    ate: montarUuid(hex, "f"),
  };
}

function montarUuid(prefixo: string, preenchimento: string): string {
  const completo = prefixo + preenchimento.repeat(32 - prefixo.length);
  return [
    completo.slice(0, 8),
    completo.slice(8, 12),
    completo.slice(12, 16),
    completo.slice(16, 20),
    completo.slice(20, 32),
  ].join("-");
}

/** Prazo de resposta prometido ao trabalhador, em um só lugar. */
export const PRAZO_RESPOSTA_DIAS = 10;
