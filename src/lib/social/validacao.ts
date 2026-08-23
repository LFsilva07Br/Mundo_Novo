import { addMonths } from "date-fns";
import { z } from "zod";

/**
 * Validações do módulo Social & Colaboradores.
 * Mensagens em linguagem de negócio — o PO não é dev.
 */

const dataIso = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data no formato correto.");

export const esquemaTrabalhador = z.object({
  clienteId: z.uuid("Selecione o cliente."),
  nome: z
    .string()
    .trim()
    .min(3, "Informe o nome completo do colaborador (mínimo 3 letras)."),
  vinculo: z.enum(["fixo", "temporario"], {
    error: "Escolha o vínculo: fixo ou temporário.",
  }),
  funcao: z.string().trim().min(2, "Informe a função do colaborador."),
  cbo: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "O CBO tem 6 números (ex.: 621005).")
    .optional(),
  salario: z.coerce
    .number({ error: "Informe o salário em reais (ex.: 1890)." })
    .positive("O salário precisa ser maior que zero.")
    .optional(),
  admissao: dataIso.optional(),
  nascimento: dataIso.optional(),
  genero: z.enum(["masculino", "feminino", "outro"]).optional(),
  moradia: z.boolean().default(false),
  alimentacao: z.boolean().default(false),
  transporte: z.boolean().default(false),
  cestaBasica: z.boolean().default(false),
  gratificacoes: z.boolean().default(false),
  insalubridade: z.boolean().default(false),
  periculosidade: z.boolean().default(false),
  funcoesHabilitadas: z.array(z.string().trim().min(1)).default([]),
});

export type DadosTrabalhador = z.infer<typeof esquemaTrabalhador>;

export const esquemaAtualizarTrabalhador = esquemaTrabalhador.extend({
  id: z.uuid("Colaborador inválido."),
});

export const esquemaDesativarTrabalhador = z.object({
  id: z.uuid("Colaborador inválido."),
});

export const esquemaMoradia = z.object({
  clienteId: z.uuid("Selecione o cliente."),
  nome: z.string().trim().min(1, "Informe o nome da casa (ex.: Casa 01)."),
  observacao: z.string().trim().optional(),
});

export const esquemaMorador = z.object({
  moradiaId: z.uuid("Selecione a moradia."),
  trabalhadorId: z.uuid("Colaborador inválido.").optional(),
  nome: z.string().trim().min(3, "Informe o nome do morador."),
  parentesco: z
    .string()
    .trim()
    .min(1, "Informe o parentesco (ex.: Colaborador, Esposa, Filho)."),
  nascimento: dataIso.optional(),
  genero: z.enum(["masculino", "feminino", "outro"]).optional(),
});

export const esquemaParticipacao = z.object({
  treinamentoId: z.uuid("Selecione o treinamento."),
  trabalhadorIds: z
    .array(z.uuid())
    .min(1, "Selecione ao menos um colaborador que participou."),
  realizadoEm: dataIso,
  observacao: z.string().trim().optional(),
});

export type DadosParticipacao = z.infer<typeof esquemaParticipacao>;

/**
 * Vencimento de uma participação de treinamento:
 * data de realização + periodicidade do treinamento (em meses).
 */
export function calcularVenceEm(
  realizadoEm: string,
  periodicidadeMeses: number,
): string {
  const vencimento = addMonths(
    new Date(`${realizadoEm}T12:00:00`),
    periodicidadeMeses,
  );
  const ano = vencimento.getFullYear();
  const mes = String(vencimento.getMonth() + 1).padStart(2, "0");
  const dia = String(vencimento.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/** Primeira mensagem de erro de um resultado zod, em linguagem clara. */
export function primeiraMensagem(erro: z.ZodError): string {
  return erro.issues[0]?.message ?? "Confira os dados informados.";
}
