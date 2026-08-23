import { z } from "zod";

/**
 * Papéis, tipos e validações da área de Usuários & Permissões.
 * Módulo puro (sem Supabase) — seguro para Client Components e testes.
 */

export const PAPEIS = [
  { valor: "diretoria", rotulo: "Diretoria" },
  { valor: "juridico", rotulo: "Jurídico" },
  { valor: "comercial", rotulo: "Comercial" },
  { valor: "gestor", rotulo: "Gestor" },
  { valor: "consultor", rotulo: "Consultor" },
  { valor: "auditor", rotulo: "Auditor" },
] as const;

export type PapelUsuario = (typeof PAPEIS)[number]["valor"];

export const VALORES_PAPEL = PAPEIS.map((p) => p.valor) as [
  PapelUsuario,
  ...PapelUsuario[],
];

export function rotuloPapel(papel: PapelUsuario): string {
  return PAPEIS.find((p) => p.valor === papel)?.rotulo ?? papel;
}

/** Perfil de usuário como a interface consome (tabela `perfis`). */
export type Perfil = {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  alcadaAprovacao: boolean;
  ativo: boolean;
};

/**
 * Converte o papel descritivo dos dados de demonstração
 * ("Gestora do Grupo", "Consultor de Campo"…) para o enum do banco.
 */
export function mapearPapelDemo(papelDemo: string): PapelUsuario {
  const texto = papelDemo.toLowerCase();
  if (texto.includes("diretor")) return "diretoria";
  if (texto.includes("gestor")) return "gestor";
  if (texto.includes("jur")) return "juridico";
  if (texto.includes("auditor")) return "auditor";
  if (texto.includes("consultor")) return "consultor";
  return "comercial";
}

export const esquemaConvite = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "Informe o nome completo (mínimo de 3 letras)."),
  email: z.email("Informe um e-mail válido."),
  papel: z.enum(VALORES_PAPEL, { message: "Escolha um papel válido." }),
  alcadaAprovacao: z.boolean({
    message: "Indique se a pessoa aprova contratos.",
  }),
});

export type DadosConvite = z.infer<typeof esquemaConvite>;

export const esquemaAtualizacaoPerfil = z
  .object({
    papel: z.enum(VALORES_PAPEL, { message: "Escolha um papel válido." }).optional(),
    alcadaAprovacao: z.boolean().optional(),
    ativo: z.boolean().optional(),
  })
  .refine(
    (dados) =>
      dados.papel !== undefined ||
      dados.alcadaAprovacao !== undefined ||
      dados.ativo !== undefined,
    { message: "Nenhuma alteração foi informada." },
  );

export type DadosAtualizacaoPerfil = z.infer<typeof esquemaAtualizacaoPerfil>;

export const esquemaIdPerfil = z.uuid("Identificador de usuário inválido.");

export const esquemaEmailConvite = z.email("Informe um e-mail válido.");

/** Extrai a primeira mensagem de erro de um resultado zod, em linguagem de negócio. */
export function primeiroErro(erro: z.ZodError): string {
  return erro.issues[0]?.message ?? "Dados inválidos.";
}
