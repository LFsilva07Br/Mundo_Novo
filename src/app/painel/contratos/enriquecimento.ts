import type { ContratoAlcada } from "@/lib/certificacao/consultas";
import {
  formatarMoeda,
  type ContratoFinanceiro,
} from "@/lib/financeiro/regras";

/**
 * Contexto comercial do contrato em alçada — o que falta para a decisão
 * deixar de ser "às cegas": valor, vigência, escopo e link do documento.
 *
 * Tudo aqui é função pura: o servidor busca os dados (contratos do cliente
 * no financeiro) e estas funções apenas casam e formatam.
 */

export type ContextoContrato = {
  /** Valor mensal em reais — nulo quando não há contrato no financeiro. */
  valorMensal: number | null;
  /** "R$ 3.500,00/mês" ou null. */
  valorFormatado: string | null;
  /** "Desde 01/08/2025, sem prazo de término" / "De … a …". */
  vigencia: string | null;
  /** Escopo contratado, como está descrito no financeiro. */
  escopo: string | null;
  /** Link do documento, quando alguém registrou um na observação. */
  documentoUrl: string | null;
};

export type ContratoDecidivel = ContratoAlcada & {
  contexto: ContextoContrato;
};

/**
 * Normaliza o nome do cliente para casar contrato de alçada com contrato
 * financeiro: sem acento, sem caixa, sem pontuação e sem os parênteses de
 * anotação ("Fazenda Rio Verde (novo cadastro)" → "fazenda rio verde").
 */
export function normalizarNomeCliente(nome: string): string {
  return nome
    .replace(/\([^)]*\)/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Contrato financeiro do cliente: casa primeiro pelo vínculo de cadastro
 * (clienteId) e, na falta dele, pelo nome normalizado. Entre vários, o
 * contrato ativo tem preferência.
 */
export function casarContratoFinanceiro(
  contrato: Pick<ContratoAlcada, "clienteId" | "clienteNome">,
  financeiros: ContratoFinanceiro[],
): ContratoFinanceiro | null {
  const porId = contrato.clienteId
    ? financeiros.filter((f) => f.clienteId === contrato.clienteId)
    : [];

  const candidatos =
    porId.length > 0
      ? porId
      : financeiros.filter(
          (f) =>
            normalizarNomeCliente(f.clienteNome) ===
            normalizarNomeCliente(contrato.clienteNome),
        );

  if (candidatos.length === 0) return null;
  return candidatos.find((f) => f.ativo) ?? candidatos[0];
}

/** Primeiro link http(s) encontrado no campo livre do contrato. */
export function extrairLinkDocumento(
  observacao: string | null | undefined,
): string | null {
  if (!observacao) return null;
  const achado = observacao.match(/https?:\/\/[^\s<>"')]+/i);
  if (!achado) return null;
  // Pontuação final de frase não faz parte do endereço.
  return achado[0].replace(/[.,;:]+$/, "");
}

function formatarDataISO(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : iso;
}

/** Vigência em linguagem de negócio, a partir do contrato financeiro. */
export function descreverVigencia(
  financeiro: Pick<ContratoFinanceiro, "inicio" | "fim"> | null,
): string | null {
  if (!financeiro) return null;
  const inicio = formatarDataISO(financeiro.inicio);
  return financeiro.fim
    ? `De ${inicio} a ${formatarDataISO(financeiro.fim)}`
    : `Desde ${inicio}, sem prazo de término`;
}

/** Monta o contexto comercial de um contrato em alçada. */
export function montarContexto(
  contrato: ContratoAlcada,
  financeiros: ContratoFinanceiro[],
): ContextoContrato {
  const financeiro = casarContratoFinanceiro(contrato, financeiros);
  return {
    valorMensal: financeiro?.valorMensal ?? null,
    valorFormatado: financeiro
      ? `${formatarMoeda(financeiro.valorMensal)}/mês`
      : null,
    vigencia: descreverVigencia(financeiro),
    escopo: financeiro?.descricao ?? null,
    documentoUrl: extrairLinkDocumento(contrato.observacao),
  };
}

/** Aplica o contexto comercial a toda a lista — usado no servidor. */
export function enriquecerContratos(
  contratos: ContratoAlcada[],
  financeiros: ContratoFinanceiro[],
): ContratoDecidivel[] {
  return contratos.map((contrato) => ({
    ...contrato,
    contexto: montarContexto(contrato, financeiros),
  }));
}
