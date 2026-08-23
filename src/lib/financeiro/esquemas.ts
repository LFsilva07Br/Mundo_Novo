import { z } from "zod";

/**
 * Esquemas de validação (zod) do módulo financeiro. Mesmo em pré-ativação
 * (antes da migration financeira), toda entrada é validada aqui — quando o
 * banco chegar, as Server Actions já estarão protegidas.
 */

/** Converte texto em número aceitando vírgula decimal ("2.450,50" → 2450.5). */
function paraNumero(valor: unknown): unknown {
  if (typeof valor !== "string") return valor;
  const texto = valor.trim();
  if (!texto) return undefined;
  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto;
  const numero = Number(normalizado);
  return Number.isNaN(numero) ? texto : numero;
}

/** Campo de texto vazio vira undefined (colunas opcionais no banco). */
function vazioParaUndefined(valor: unknown): unknown {
  if (typeof valor !== "string") return valor;
  const texto = valor.trim();
  return texto === "" ? undefined : texto;
}

export const esquemaContratoFinanceiro = z
  .object({
    clienteId: z
      .string({ error: "Escolha o cliente do contrato." })
      .trim()
      .min(1, "Escolha o cliente do contrato."),
    descricao: z
      .string({ error: "Descreva o serviço contratado." })
      .trim()
      .min(3, "Descreva o serviço contratado (ex.: consultoria Rainforest)."),
    valorMensal: z.preprocess(
      paraNumero,
      z
        .number({ error: "Informe o valor mensal (ex.: 2.500,00)." })
        .positive("O valor mensal deve ser maior que zero.")
        .max(1000000, "Valor mensal acima do limite esperado."),
    ),
    diaVencimento: z.preprocess(
      paraNumero,
      z
        .number({ error: "Informe o dia de vencimento (1 a 28)." })
        .int("O dia de vencimento deve ser um número inteiro.")
        .min(1, "O dia de vencimento deve estar entre 1 e 28.")
        .max(28, "Use um dia até 28 para a mensalidade existir em todo mês."),
    ),
    inicio: z.iso.date("Informe a data de início do contrato."),
    fim: z.preprocess(
      vazioParaUndefined,
      z.iso.date("Data de fim inválida — use o calendário.").optional(),
    ),
  })
  .refine((dados) => !dados.fim || dados.fim > dados.inicio, {
    message: "O fim da vigência deve ser depois do início.",
    path: ["fim"],
  });

export type DadosContratoFinanceiro = z.output<typeof esquemaContratoFinanceiro>;

export const esquemaPagamento = z.object({
  faturaId: z
    .string({ error: "Fatura inválida." })
    .trim()
    .min(1, "Fatura inválida."),
  data: z.iso.date("Data de pagamento inválida — use o formato AAAA-MM-DD."),
});

export type DadosPagamento = z.output<typeof esquemaPagamento>;

export const esquemaCompetencia = z
  .string({ error: "Competência inválida — use o formato AAAA-MM." })
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Competência inválida — use AAAA-MM.");
