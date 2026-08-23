import { z } from "zod";

/**
 * Validações dos pagamentos de sustentabilidade (DS/DI).
 * Mensagens em linguagem de negócio — o PO não é dev.
 */

const dataIso = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data do pagamento.");

export const esquemaPagamento = z.object({
  clienteId: z.uuid("Escolha o produtor que recebeu o pagamento."),
  tipo: z.enum(["diferencial", "investimento"], {
    error: "Escolha o tipo: Diferencial (DS) ou Investimento (DI).",
  }),
  valor: z.coerce
    .number({ error: "Informe o valor em reais (ex.: 1850,00)." })
    .positive("O valor precisa ser maior que zero."),
  data: dataIso,
  descricao: z.string().trim().max(500).optional(),
});

export type DadosPagamento = z.input<typeof esquemaPagamento>;

export function primeiraMensagem(erro: z.ZodError): string {
  return erro.issues[0]?.message ?? "Confira os dados informados.";
}
