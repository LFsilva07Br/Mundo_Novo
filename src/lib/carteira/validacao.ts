import { z } from "zod";

/**
 * Validações (zod) das ações de escrita da carteira.
 * Ficam fora de acoes.ts porque arquivos "use server" só podem
 * exportar funções assíncronas — e os esquemas precisam ser testáveis.
 */

function texto(minimo: number, mensagem: string) {
  return z.string({ error: mensagem }).trim().min(minimo, mensagem);
}

/** Campo de texto opcional: string vazia vira undefined (ver deFormData). */
const textoOpcional = z.string().trim().min(1).optional();

const uf = z
  .string({ error: "Informe a UF." })
  .trim()
  .toUpperCase()
  .length(2, "A UF deve ter 2 letras (ex.: MG).");

export const esquemaGrupo = z.object({
  nome: texto(2, "Informe o nome do grupo."),
  administracao: z.enum(["mundo_novo", "terceiro"], {
    error: "Escolha quem administra o grupo.",
  }),
  nomeAdministrador: textoOpcional,
  cidade: textoOpcional,
  uf: uf.optional(),
});

export const esquemaGrupoExistente = esquemaGrupo.extend({
  id: texto(1, "Grupo não identificado."),
});

export const esquemaCliente = z.object({
  nome: texto(2, "Informe o nome do cliente."),
  tipo: z.enum(["fazenda", "cadeia_suprimentos"], {
    error: "Escolha o tipo do cliente.",
  }),
  /** Vazio = cliente direto (sem grupo). */
  grupoId: textoOpcional,
  produtor: textoOpcional,
  cidade: texto(2, "Informe a cidade."),
  uf,
  regiao: texto(2, "Informe a região."),
  /** Regra do produto: todo cliente novo começa em implantação. */
  fase: z
    .enum(["implantacao", "ativo", "inativo"], {
      error: "Escolha a fase do cliente.",
    })
    .default("implantacao"),
});

export const esquemaClienteExistente = esquemaCliente.extend({
  id: texto(1, "Cliente não identificado."),
});

export const esquemaContato = z.object({
  clienteId: texto(1, "Cliente não identificado."),
  nome: texto(2, "Informe o nome do contato."),
  area: z.enum(
    ["proprietario", "ambiental", "agricola", "rh_social", "administrativo", "outro"],
    { error: "Escolha a área do contato." },
  ),
  telefone: textoOpcional,
  email: z.email("E-mail do contato inválido.").optional(),
});

export const esquemaRemocaoContato = esquemaContato.pick({
  clienteId: true,
  nome: true,
  area: true,
});

export const TIPOS_REGISTRO_CONTATO = [
  "ligacao",
  "email",
  "whatsapp",
  "reuniao",
  "visita",
] as const;

export const esquemaRegistroContato = z.object({
  clienteId: texto(1, "Cliente não identificado."),
  tipo: z.enum(TIPOS_REGISTRO_CONTATO, {
    error: "Escolha o tipo de contato.",
  }),
  assunto: texto(3, "Informe o assunto do contato."),
  detalhes: textoOpcional,
  duracaoMinutos: z.coerce
    .number({ error: "A duração deve ser um número de minutos." })
    .int("A duração deve ser um número inteiro de minutos.")
    .positive("A duração deve ser maior que zero.")
    .max(1440, "A duração não pode passar de um dia (1440 minutos).")
    .optional(),
  ocorridoEm: z
    .string({ error: "Informe quando o contato ocorreu." })
    .refine((valor) => !Number.isNaN(Date.parse(valor)), {
      error: "Data e hora inválidas.",
    }),
});

export type DadosGrupo = z.infer<typeof esquemaGrupo>;
export type DadosCliente = z.infer<typeof esquemaCliente>;
export type DadosContato = z.infer<typeof esquemaContato>;
export type DadosRegistroContato = z.infer<typeof esquemaRegistroContato>;

/**
 * Converte um FormData em objeto simples para o zod:
 * campos em branco viram undefined (opcionais de verdade).
 */
export function deFormData(formData: FormData): Record<string, string> {
  const objeto: Record<string, string> = {};
  for (const [chave, valor] of formData.entries()) {
    if (typeof valor === "string" && valor.trim() !== "") {
      objeto[chave] = valor;
    }
  }
  return objeto;
}

/** Primeira mensagem de erro de uma validação zod, em linguagem de negócio. */
export function primeiroErro(erro: z.ZodError): string {
  return erro.issues[0]?.message ?? "Dados inválidos. Revise o formulário.";
}
