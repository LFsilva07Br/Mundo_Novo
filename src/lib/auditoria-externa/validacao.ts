import { z } from "zod";
import { CERTIFICADORA_PADRAO } from "./regras";

/**
 * Validações da gestão de auditoria externa.
 * Mensagens em linguagem de negócio — o PO não é dev.
 */

const dataIso = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data no formato correto.");

export const esquemaAchado = z
  .object({
    clienteId: z.uuid("Escolha o cliente auditado."),
    certificadora: z
      .string()
      .trim()
      .min(2, "Informe a certificadora.")
      .default(CERTIFICADORA_PADRAO),
    codigo: z
      .string()
      .trim()
      .min(1, "Informe o código do achado na certificadora."),
    itemNorma: z.string().trim().optional(),
    descricao: z
      .string()
      .trim()
      .min(10, "Descreva o achado da certificadora (mínimo de 10 caracteres)."),
    severidade: z.enum(["menor", "maior", "critica"], {
      error: "Escolha a severidade.",
    }),
    encontradoEm: dataIso,
    prazo: dataIso,
    criarCapa: z.boolean().default(false),
    responsavelCapa: z.string().trim().optional(),
  })
  .refine(
    (dados) =>
      !dados.criarCapa ||
      (dados.responsavelCapa !== undefined && dados.responsavelCapa.length >= 3),
    {
      message:
        "Para criar a CAPA interna vinculada, informe o responsável pelo plano de ação.",
      path: ["responsavelCapa"],
    },
  );

export type DadosAchado = z.input<typeof esquemaAchado>;

export const esquemaAtualizarStatusAchado = z.object({
  achadoId: z.uuid("Achado inválido."),
  status: z.enum(["aberta", "em_correcao", "aguardando_evidencia", "fechada"], {
    error: "Escolha um status válido.",
  }),
});

export function primeiraMensagem(erro: z.ZodError): string {
  return erro.issues[0]?.message ?? "Confira os dados informados.";
}
