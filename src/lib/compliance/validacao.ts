import { z } from "zod";

/**
 * Validações do módulo Compliance Social (RA cap. 5.1 avaliar-e-tratar,
 * cap. 1.3 plano de gestão e 1.5.1 canal de queixas).
 * Mensagens em linguagem de negócio — o PO não é dev.
 */

export const TIPOS_CASO = [
  "trabalho_infantil",
  "trabalho_forcado",
  "discriminacao",
  "assedio",
  "outro",
] as const;

export const ROTULOS_TIPO_CASO: Record<(typeof TIPOS_CASO)[number], string> = {
  trabalho_infantil: "Trabalho infantil",
  trabalho_forcado: "Trabalho forçado",
  discriminacao: "Discriminação",
  assedio: "Assédio",
  outro: "Outro",
};

export const ORIGENS_CASO = ["monitoramento", "queixa", "auditoria"] as const;

export const STATUS_CASO = ["aberto", "em_remediacao", "encerrado"] as const;

export const ROTULOS_STATUS_CASO: Record<(typeof STATUS_CASO)[number], string> =
  {
    aberto: "Aberto",
    em_remediacao: "Em remediação",
    encerrado: "Encerrado",
  };

const dataIso = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data no formato correto.");

export const esquemaCaso = z.object({
  clienteId: z.uuid("Selecione o cliente."),
  tipo: z.enum(TIPOS_CASO, { error: "Escolha o tipo do caso." }),
  origem: z.enum(ORIGENS_CASO, {
    error: "Informe a origem: monitoramento, queixa ou auditoria.",
  }),
  descricao: z
    .string()
    .trim()
    .min(10, "Descreva o caso com mais detalhes (mínimo 10 letras)."),
  remediacao: z.string().trim().min(1).optional(),
});

export type DadosCaso = z.infer<typeof esquemaCaso>;

/**
 * Regra inegociável do cap. 5.1: nenhum caso é encerrado sem o registro
 * da remediação aplicada — é ela que comprova o tratamento na auditoria.
 */
export const esquemaAtualizarStatusCaso = z
  .object({
    id: z.uuid("Caso inválido."),
    status: z.enum(STATUS_CASO, { error: "Escolha o novo status do caso." }),
    remediacao: z.string().trim().min(1).optional(),
  })
  .refine((dados) => dados.status !== "encerrado" || Boolean(dados.remediacao), {
    message:
      "Para encerrar o caso, descreva a remediação aplicada — sem ela o tratamento não fica comprovado.",
    path: ["remediacao"],
  });

export type DadosAtualizarStatusCaso = z.infer<
  typeof esquemaAtualizarStatusCaso
>;

// ------------------------------------------------------------------
// Queixas (canal 1.5.1)
// ------------------------------------------------------------------

export const esquemaQueixaPublica = z.object({
  // No banco o id é uuid, mas no modo demonstração é um apelido — a
  // existência real do cliente é conferida no servidor antes de gravar.
  clienteId: z
    .string()
    .trim()
    .min(1, "Endereço do canal inválido — confira o link recebido.")
    .max(100, "Endereço do canal inválido — confira o link recebido."),
  mensagem: z
    .string()
    .trim()
    .min(10, "Conte o que aconteceu com um pouco mais de detalhe (mínimo 10 letras)."),
  anonima: z.boolean().default(true),
  contato: z.string().trim().max(200).optional(),
});

export type DadosQueixaPublica = z.infer<typeof esquemaQueixaPublica>;

export const esquemaTriagemQueixa = z.object({
  queixaId: z.uuid("Queixa inválida."),
  clienteId: z.uuid("Cliente inválido."),
  tipo: z.enum(TIPOS_CASO, { error: "Escolha o tipo do caso a abrir." }),
  descricao: z
    .string()
    .trim()
    .min(10, "Descreva o caso que será aberto (mínimo 10 letras)."),
});

export const esquemaTratarQueixa = z.object({
  queixaId: z.uuid("Queixa inválida."),
  justificativa: z.string().trim().min(1).optional(),
});

/**
 * Uma queixa só pode ser marcada como tratada quando o caso vinculado a
 * ela foi encerrado — ou, se não virou caso, com uma justificativa
 * registrada por quem tratou.
 */
export function podeTratarQueixa(entrada: {
  statusCasoVinculado?: (typeof STATUS_CASO)[number];
  justificativa?: string;
}): { ok: true } | { ok: false; erro: string } {
  if (entrada.statusCasoVinculado === "encerrado") return { ok: true };
  if (entrada.justificativa && entrada.justificativa.trim() !== "") {
    return { ok: true };
  }
  if (entrada.statusCasoVinculado) {
    return {
      ok: false,
      erro: "O caso vinculado ainda não foi encerrado — encerre o caso (com remediação) ou registre uma justificativa.",
    };
  }
  return {
    ok: false,
    erro: "Explique como a queixa foi resolvida (justificativa) ou converta em caso antes de marcar como tratada.",
  };
}

// ------------------------------------------------------------------
// Plano de gestão e avaliação de risco (cap. 1.3)
// ------------------------------------------------------------------

export const NIVEIS_RISCO = ["baixo", "medio", "alto"] as const;

export const ROTULOS_NIVEL_RISCO: Record<(typeof NIVEIS_RISCO)[number], string> =
  {
    baixo: "Baixo",
    medio: "Médio",
    alto: "Alto",
  };

export const esquemaRiscoPlano = z.object({
  area: z.string().trim().min(1, "Informe a área do risco (ex.: Social)."),
  risco: z.string().trim().min(1, "Descreva o risco identificado."),
  probabilidade: z.enum(NIVEIS_RISCO, {
    error: "Escolha a probabilidade: baixo, médio ou alto.",
  }),
  impacto: z.enum(NIVEIS_RISCO, {
    error: "Escolha o impacto: baixo, médio ou alto.",
  }),
  mitigacao: z
    .string()
    .trim()
    .min(1, "Descreva a mitigação prevista para o risco."),
});

export const esquemaMetaPlano = z.object({
  meta: z.string().trim().min(1, "Descreva a meta do plano."),
  prazo: dataIso.optional(),
  responsavel: z.string().trim().min(1).optional(),
  concluida: z.boolean().default(false),
});

export const esquemaPlanoGestao = z.object({
  clienteId: z.uuid("Selecione o cliente."),
  ano: z.coerce
    .number({ error: "Informe o ano do plano (ex.: 2026)." })
    .int()
    .min(2000, "Informe um ano válido.")
    .max(2100, "Informe um ano válido."),
  riscos: z.array(esquemaRiscoPlano).default([]),
  metas: z.array(esquemaMetaPlano).default([]),
  observacao: z.string().trim().optional(),
});

export type RiscoPlano = z.infer<typeof esquemaRiscoPlano>;
export type MetaPlano = z.infer<typeof esquemaMetaPlano>;
export type DadosPlanoGestao = z.infer<typeof esquemaPlanoGestao>;

// ------------------------------------------------------------------
// Limitador de taxa do canal público (função pura, testável)
// ------------------------------------------------------------------

export type LimitadorTaxa = {
  /** true = requisição permitida; false = limite atingido na janela. */
  permitir: (chave: string, agora?: number) => boolean;
};

/**
 * Limitador simples em memória por chave (IP): no máximo `maximo`
 * requisições por `janelaMs`. Suficiente para o canal público de queixas
 * — o objetivo é frear abuso básico, não substituir um WAF.
 */
export function criarLimitadorTaxa(
  maximo: number,
  janelaMs: number,
): LimitadorTaxa {
  const registros = new Map<string, number[]>();

  return {
    permitir(chave: string, agora: number = Date.now()): boolean {
      const recentes = (registros.get(chave) ?? []).filter(
        (momento) => agora - momento < janelaMs,
      );
      if (recentes.length >= maximo) {
        registros.set(chave, recentes);
        return false;
      }
      recentes.push(agora);
      registros.set(chave, recentes);
      return true;
    },
  };
}

/** Primeira mensagem de erro de um resultado zod, em linguagem clara. */
export function primeiraMensagem(erro: z.ZodError): string {
  return erro.issues[0]?.message ?? "Confira os dados informados.";
}
