import { z } from "zod";

/**
 * Esquemas de validação (zod) e rótulos dos cadastros de imóveis rurais,
 * documentos, captações de água, talhões e lançamentos por safra.
 * Compartilhados entre os formulários (client) e as Server Actions.
 */

export const TIPOS_DOCUMENTO_IMOVEL = [
  "car",
  "matricula",
  "licenca",
  "dispensa_licenca",
  "itr",
  "georreferenciamento",
  "averbacao_reserva",
] as const;

export type TipoDocumentoImovel = (typeof TIPOS_DOCUMENTO_IMOVEL)[number];

export const ROTULO_TIPO_DOCUMENTO: Record<TipoDocumentoImovel, string> = {
  car: "CAR",
  matricula: "Matrícula",
  licenca: "Licença ambiental",
  dispensa_licenca: "Dispensa de licença",
  itr: "ITR",
  georreferenciamento: "Georreferenciamento",
  averbacao_reserva: "Averbação de reserva",
};

export const STATUS_DOCUMENTO = [
  "ok",
  "proximo_vencimento",
  "vencido",
  "pendente",
] as const;

export type StatusDocumento = (typeof STATUS_DOCUMENTO)[number];

export const ROTULO_STATUS_DOCUMENTO: Record<StatusDocumento, string> = {
  ok: "OK",
  proximo_vencimento: "Próximo do vencimento",
  vencido: "Vencido",
  pendente: "Pendente",
};

/** Estados de lavoura usados na planilha da cliente (texto livre no banco). */
export const ESTADOS_LAVOURA = [
  "Produção",
  "Plantio",
  "Poda",
  "Esqueletado",
  "Recepa",
  "Decote",
] as const;

// ------------------------------------------------------------------
// Auxiliares de conversão (formulários chegam como texto)
// ------------------------------------------------------------------

/** Converte texto em número aceitando vírgula decimal ("5,34" → 5.34). */
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

const areaObrigatoria = z.preprocess(
  paraNumero,
  z
    .number({ error: "Informe a área em hectares (ex.: 5,34)." })
    .positive("A área deve ser maior que zero.")
    .max(100000, "Área acima do limite esperado."),
);

const areaOpcional = z.preprocess(
  paraNumero,
  z
    .number({ error: "Área inválida — use números (ex.: 2,5)." })
    .min(0, "A área não pode ser negativa.")
    .max(100000, "Área acima do limite esperado.")
    .optional(),
);

const sacasOpcional = z.preprocess(
  paraNumero,
  z
    .number({ error: "Informe as sacas em número (ex.: 373,8)." })
    .min(0, "Sacas não podem ser negativas.")
    .max(1000000, "Valor de sacas acima do limite esperado.")
    .optional(),
);

const dataOpcional = z.preprocess(
  vazioParaUndefined,
  z.iso.date("Data inválida — use o formato do calendário.").optional(),
);

const identificador = z
  .string({ error: "Identificador ausente." })
  .trim()
  .min(1, "Identificador ausente.");

// ------------------------------------------------------------------
// Imóvel rural
// ------------------------------------------------------------------

export const esquemaImovel = z.object({
  clienteId: identificador,
  nome: z
    .string({ error: "Informe o nome do imóvel." })
    .trim()
    .min(2, "Informe o nome do imóvel."),
  proprietarios: textoOpcional,
  cidade: textoOpcional,
  uf: z.preprocess(
    vazioParaUndefined,
    z
      .string()
      .trim()
      .toUpperCase()
      .length(2, "UF deve ter 2 letras (ex.: MG).")
      .optional(),
  ),
  car: textoOpcional,
  matriculas: textoOpcional,
  areaTotalHa: areaObrigatoria,
  areaCafeHa: areaOpcional,
  areaAppHa: areaOpcional,
  areaReservaHa: areaOpcional,
  possuiCaptacaoAgua: z.preprocess(
    (v) => v === "on" || v === "true" || v === true,
    z.boolean(),
  ),
});

export const esquemaAtualizarImovel = esquemaImovel.extend({
  id: identificador,
});

// ------------------------------------------------------------------
// Talhão
// ------------------------------------------------------------------

const anoAtual = new Date().getFullYear();

export const esquemaTalhao = z.object({
  clienteId: identificador,
  imovelId: z
    .string({ error: "Escolha o imóvel rural do talhão." })
    .trim()
    .min(1, "Escolha o imóvel rural do talhão."),
  nome: z
    .string({ error: "Informe o nome do talhão." })
    .trim()
    .min(1, "Informe o nome do talhão."),
  areaHa: areaObrigatoria,
  plantasPorHa: z.preprocess(
    paraNumero,
    z
      .number({ error: "Plantas/ha deve ser um número inteiro." })
      .int("Plantas/ha deve ser um número inteiro.")
      .positive("Plantas/ha deve ser maior que zero.")
      .max(50000, "Plantas/ha acima do limite esperado.")
      .optional(),
  ),
  espacamento: textoOpcional,
  variedade: z
    .string({ error: "Informe a variedade do café." })
    .trim()
    .min(2, "Informe a variedade do café."),
  anoPlantio: z.preprocess(
    paraNumero,
    z
      .number({ error: "Informe o ano de plantio (ex.: 2019)." })
      .int("Ano de plantio deve ser um número inteiro.")
      .min(1950, "Ano de plantio muito antigo.")
      .max(anoAtual + 1, "Ano de plantio no futuro."),
  ),
  areaIrrigadaHa: areaOpcional,
});

export const esquemaAtualizarTalhao = esquemaTalhao.extend({
  id: identificador,
});

// ------------------------------------------------------------------
// Lançamento por safra (previsão × colheita)
// ------------------------------------------------------------------

export const esquemaLancamentoSafra = z
  .object({
    clienteId: identificador,
    talhaoId: z
      .string({ error: "Escolha o talhão." })
      .trim()
      .min(1, "Escolha o talhão."),
    safra: z
      .string({ error: "Informe a safra (ex.: 2025/26)." })
      .trim()
      .regex(/^\d{4}\/\d{2}$/, "Safra no formato 2025/26."),
    estadoLavoura: textoOpcional,
    previsaoSacas: sacasOpcional,
    colheitaEfetivaSacas: sacasOpcional,
    previsaoPodaRenovacao: textoOpcional,
  })
  .refine(
    (dados) =>
      dados.estadoLavoura !== undefined ||
      dados.previsaoSacas !== undefined ||
      dados.colheitaEfetivaSacas !== undefined ||
      dados.previsaoPodaRenovacao !== undefined,
    {
      message:
        "Informe ao menos um dado da safra (estado, previsão, colheita ou poda).",
    },
  );

// ------------------------------------------------------------------
// Documento do imóvel
// ------------------------------------------------------------------

export const esquemaDocumentoImovel = z.object({
  clienteId: identificador,
  imovelId: z
    .string({ error: "Escolha o imóvel rural." })
    .trim()
    .min(1, "Escolha o imóvel rural."),
  tipo: z.enum(TIPOS_DOCUMENTO_IMOVEL, {
    error: "Escolha o tipo de documento.",
  }),
  identificacao: textoOpcional,
  venceEm: dataOpcional,
  status: z.enum(STATUS_DOCUMENTO, { error: "Escolha o status." }),
  observacao: textoOpcional,
});

// ------------------------------------------------------------------
// Captação de água
// ------------------------------------------------------------------

export const esquemaCaptacao = z.object({
  clienteId: identificador,
  imovelId: z
    .string({ error: "Escolha o imóvel rural." })
    .trim()
    .min(1, "Escolha o imóvel rural."),
  tipoCaptacao: z
    .string({ error: "Descreva a captação (ex.: nascente, poço)." })
    .trim()
    .min(3, "Descreva a captação (ex.: nascente, poço)."),
  processo: textoOpcional,
  classificacao: textoOpcional,
  venceEm: dataOpcional,
  status: z.enum(STATUS_DOCUMENTO, { error: "Escolha o status." }),
});

export type DadosImovel = z.infer<typeof esquemaImovel>;
export type DadosTalhao = z.infer<typeof esquemaTalhao>;
export type DadosLancamentoSafra = z.infer<typeof esquemaLancamentoSafra>;
export type DadosDocumentoImovel = z.infer<typeof esquemaDocumentoImovel>;
export type DadosCaptacao = z.infer<typeof esquemaCaptacao>;
