import { z } from "zod";

/**
 * Validações do override de régua de alertas por cliente.
 * Ficam fora de acoes.ts porque arquivos "use server" só podem
 * exportar funções assíncronas — e as regras precisam ser testáveis.
 */

export const MINIMO_MARCOS = 1;
export const MAXIMO_MARCOS = 8;
export const MENOR_MARCO_DIAS = 1;
export const MAIOR_MARCO_DIAS = 365;

export const esquemaConfigAlerta = z.object({
  clienteId: z
    .string({ error: "Cliente não identificado." })
    .trim()
    .min(1, "Cliente não identificado."),
  dias: z
    .array(
      z.coerce
        .number({ error: "Cada marco deve ser um número de dias." })
        .int("Cada marco deve ser um número inteiro de dias.")
        .min(
          MENOR_MARCO_DIAS,
          `Cada marco deve ter no mínimo ${MENOR_MARCO_DIAS} dia.`,
        )
        .max(
          MAIOR_MARCO_DIAS,
          `Cada marco deve ter no máximo ${MAIOR_MARCO_DIAS} dias.`,
        ),
      { error: "Informe os marcos da régua." },
    )
    .min(MINIMO_MARCOS, "Escolha pelo menos um marco de disparo.")
    .max(MAXIMO_MARCOS, `A régua aceita no máximo ${MAXIMO_MARCOS} marcos.`),
  copiaAdminGrupo: z.boolean({
    error: "Indique se o administrador do grupo recebe cópia.",
  }),
});

export type DadosConfigAlerta = z.infer<typeof esquemaConfigAlerta>;

/**
 * Normaliza a régua para gravação: remove marcos repetidos e ordena
 * do maior para o menor (ex.: [7, 90, 30, 90] → [90, 30, 7]) — mesmo
 * formato da régua padrão usada pelo motor de gatilhos.
 */
export function normalizarRegua(dias: readonly number[]): number[] {
  return [...new Set(dias)].sort((a, b) => b - a);
}

/** Primeira mensagem de erro de uma validação zod, em linguagem de negócio. */
export function primeiroErro(erro: z.ZodError): string {
  return erro.issues[0]?.message ?? "Dados inválidos. Revise o formulário.";
}
