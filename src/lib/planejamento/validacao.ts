import { z } from "zod";
import { TIPOS_PLANEJAMENTO } from "./tipos";

/**
 * Validações (zod) das ações do planejamento anual.
 * Fora de acoes.ts porque arquivos "use server" só podem exportar funções
 * assíncronas — e os esquemas precisam ser testáveis.
 */

export const esquemaPlanejamento = z.object({
  clienteId: z.string().trim().min(1, "Escolha o cliente."),
  ano: z.coerce
    .number({ error: "Informe o ano." })
    .int()
    .min(2020, "Ano fora do período de trabalho.")
    .max(2100, "Ano fora do período de trabalho."),
  mesPrevisto: z.coerce
    .number({ error: "Escolha o mês previsto." })
    .int()
    .min(1, "O mês vai de 1 (janeiro) a 12 (dezembro).")
    .max(12, "O mês vai de 1 (janeiro) a 12 (dezembro)."),
  tipo: z.enum(TIPOS_PLANEJAMENTO, { error: "Escolha o tipo de visita." }),
  observacao: z.string().trim().min(1).optional(),
});

export const esquemaRemocaoPlanejamento = esquemaPlanejamento.pick({
  clienteId: true,
  ano: true,
  tipo: true,
});

export function primeiroErro(erro: z.ZodError): string {
  return erro.issues[0]?.message ?? "Dados inválidos.";
}
