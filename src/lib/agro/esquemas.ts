import { z } from "zod";

/**
 * Validações do módulo Agroquímicos.
 * Mensagens em linguagem de negócio — o PO não é dev.
 */

const dataIso = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data no formato correto.");

export const esquemaProduto = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Informe o nome comercial do produto (mínimo 2 letras)."),
  ingredienteAtivo: z.string().trim().optional(),
  proibidoRa: z.boolean().default(false),
  observacao: z.string().trim().optional(),
});

export type DadosProduto = z.infer<typeof esquemaProduto>;

export const esquemaAplicacao = z.object({
  clienteId: z.uuid("Selecione o cliente."),
  talhaoId: z.uuid("Selecione o talhão onde o produto foi aplicado."),
  produtoId: z.uuid("Selecione o produto aplicado."),
  dose: z.string().trim().optional(),
  data: dataIso,
  aplicadorId: z.uuid("Aplicador inválido.").optional(),
  equipamento: z.string().trim().optional(),
  observacao: z.string().trim().optional(),
});

export type DadosAplicacao = z.infer<typeof esquemaAplicacao>;

export const esquemaDestinacao = z.object({
  clienteId: z.uuid("Selecione o cliente."),
  data: dataIso,
  quantidade: z.coerce
    .number({ error: "Informe a quantidade de embalagens (ex.: 12)." })
    .int("Informe a quantidade em números inteiros.")
    .positive("A quantidade precisa ser maior que zero.")
    .optional(),
  descricao: z
    .string()
    .trim()
    .min(5, "Descreva a destinação (ex.: devolução na central de embalagens)."),
});

export type DadosDestinacao = z.infer<typeof esquemaDestinacao>;

/** Primeira mensagem de erro de um resultado zod, em linguagem clara. */
export function primeiraMensagem(erro: z.ZodError): string {
  return erro.issues[0]?.message ?? "Confira os dados informados.";
}
