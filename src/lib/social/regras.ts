import { z } from "zod";

/**
 * Regras puras do módulo social — fichas de EPI e assinaturas digitais.
 * Funções sem dependência de banco ou navegador, testáveis isoladamente.
 */

/** EPIs mais comuns na lavoura de café — sugestões do formulário de entrega. */
export const EPIS_SUGERIDOS = [
  "Luva nitrílica",
  "Respirador PFF2",
  "Viseira facial",
  "Avental impermeável",
  "Botas de borracha",
] as const;

const dataIso = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data no formato correto.");

/** Validação da entrega de EPI — mensagens em linguagem de negócio. */
export const esquemaFichaEpi = z.object({
  trabalhadorId: z.uuid("Selecione o colaborador que recebeu o EPI."),
  epi: z.string().trim().min(2, "Informe qual EPI foi entregue."),
  ca: z
    .string()
    .trim()
    .max(20, "O CA (certificado de aprovação) é um código curto.")
    .optional(),
  quantidade: z.coerce
    .number({ error: "Informe a quantidade entregue (ex.: 2)." })
    .int("A quantidade precisa ser um número inteiro.")
    .positive("A quantidade precisa ser maior que zero."),
  entregueEm: dataIso,
});

export type DadosFichaEpi = z.infer<typeof esquemaFichaEpi>;

/** Confere se a assinatura veio do quadro de assinatura (PNG em data URL). */
export function ehAssinaturaPng(dataUrl: string): boolean {
  return /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(dataUrl);
}

/** Parte base64 de uma assinatura PNG — null quando o formato não é o esperado. */
export function base64DaAssinatura(dataUrl: string): string | null {
  if (!ehAssinaturaPng(dataUrl)) return null;
  return dataUrl.slice("data:image/png;base64,".length);
}

/**
 * Caminho da assinatura no bucket 'evidencias':
 * `epis/<trabalhador>/...png` ou `treinamentos/<treinamento>/...png`.
 * O par instante + sufixo aleatório evita colisão entre envios simultâneos.
 */
export function caminhoAssinatura(
  pasta: "epis" | "treinamentos",
  registroId: string,
  instante: number = Date.now(),
  sufixo: string = Math.random().toString(36).slice(2, 8),
): string {
  return `${pasta}/${registroId}/${instante}-${sufixo}.png`;
}

/** Identificador amigável para nomes de arquivo e ids de demonstração. */
export function slugSocial(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
