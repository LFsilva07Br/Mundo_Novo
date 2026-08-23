import { z } from "zod";

/**
 * Validações do Portal do Produtor.
 * Módulo puro (sem Supabase) — seguro para Client Components e testes.
 */

/** Convite do produtor para o portal (feito pela equipe na ficha do cliente). */
export const esquemaConviteProdutor = z.object({
  clienteId: z
    .string()
    .trim()
    .min(1, "Cliente inválido — recarregue a página e tente de novo."),
  nome: z
    .string()
    .trim()
    .min(3, "Informe o nome completo do produtor (mínimo de 3 letras)."),
  email: z.email("Informe um e-mail válido."),
});

export type DadosConviteProdutor = z.infer<typeof esquemaConviteProdutor>;

/** Evidência anexada pelo produtor a uma pendência (CAPA). */
export const esquemaEvidenciaPortal = z.object({
  capaId: z.uuid({ message: "Pendência inválida." }),
  acaoId: z.uuid({ message: "Ação inválida." }).nullable(),
  descricao: z
    .string()
    .trim()
    .max(500, "A descrição pode ter no máximo 500 letras.")
    .optional(),
});

export function primeiroErro(erro: z.ZodError): string {
  return erro.issues[0]?.message ?? "Dados inválidos.";
}
