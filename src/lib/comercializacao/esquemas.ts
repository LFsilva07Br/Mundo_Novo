import { z } from "zod";

/**
 * Esquemas de validação (zod) dos cadastros de comercialização.
 * Compartilhados entre os formulários (client) e as Server Actions —
 * as mensagens são em linguagem de negócio, para a equipe e a cliente.
 */

// ------------------------------------------------------------------
// Auxiliares de conversão (formulários chegam como texto)
// ------------------------------------------------------------------

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

const textoOpcional = z.preprocess(
  vazioParaUndefined,
  z.string().trim().max(400, "Texto longo demais.").optional(),
);

const identificador = z
  .string({ error: "Identificador ausente." })
  .trim()
  .min(1, "Identificador ausente.");

const sacasObrigatorias = z.preprocess(
  paraNumero,
  z
    .number({ error: "Informe a quantidade de sacas (ex.: 350)." })
    .positive("A quantidade de sacas deve ser maior que zero.")
    .max(1000000, "Quantidade de sacas acima do limite esperado."),
);

// ------------------------------------------------------------------
// Lote de café
// ------------------------------------------------------------------

export const esquemaLote = z.object({
  clienteId: z
    .string({ error: "Escolha o cliente dono do lote." })
    .trim()
    .min(1, "Escolha o cliente dono do lote."),
  safraId: z.preprocess(vazioParaUndefined, z.string().trim().optional()),
  identificacao: z
    .string({ error: "Informe a identificação do lote (ex.: LOTE-2026-001)." })
    .trim()
    .min(1, "Informe a identificação do lote (ex.: LOTE-2026-001)."),
  sacas: sacasObrigatorias,
  origemTalhoes: textoOpcional,
  peneira: textoOpcional,
  bebida: textoOpcional,
  observacao: textoOpcional,
});

export const esquemaAtualizarLote = esquemaLote.extend({
  id: identificador,
});

export type DadosLote = z.output<typeof esquemaLote>;

// ------------------------------------------------------------------
// Negociação de venda
// ------------------------------------------------------------------

export const esquemaNegociacao = z.object({
  loteId: z
    .string({ error: "Escolha o lote negociado." })
    .trim()
    .min(1, "Escolha o lote negociado."),
  comprador: z
    .string({ error: "Informe o comprador." })
    .trim()
    .min(2, "Informe o comprador."),
  sacas: sacasObrigatorias,
  precoPorSaca: z.preprocess(
    paraNumero,
    z
      .number({ error: "Informe o preço por saca (ex.: 2.450,00)." })
      .positive("O preço por saca deve ser maior que zero.")
      .max(1000000, "Preço por saca acima do limite esperado."),
  ),
  data: z.preprocess(
    vazioParaUndefined,
    z.iso.date("Data inválida — use o formato do calendário.").optional(),
  ),
  contrato: textoOpcional,
  status: z.enum(["proposta", "fechada"], {
    error: "Escolha a situação da negociação.",
  }),
  observacao: textoOpcional,
});

export type DadosNegociacao = z.output<typeof esquemaNegociacao>;
