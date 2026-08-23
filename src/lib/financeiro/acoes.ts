"use server";

import { revalidatePath } from "next/cache";
import { type ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  esquemaCompetencia,
  esquemaContratoFinanceiro,
  esquemaPagamento,
} from "./esquemas";
import { gerarCompetencias } from "./regras";

/**
 * Server Actions do financeiro. O módulo roda em MODO PREPARADO: toda
 * entrada já é validada com zod, mas enquanto a migration financeira não
 * cria as tabelas (contratos_financeiros e faturas), nada é gravado — as
 * ações respondem com o aviso de pré-ativação.
 */

export type EstadoAcao = { ok: boolean; mensagem: string } | null;
export type ResultadoAcao =
  | { ok: true; mensagem?: string }
  | { ok: false; erro: string };

const MENSAGEM_PRE_ATIVACAO =
  "Módulo financeiro em pré-ativação — este lançamento ficará disponível após a migration financeira.";

/** Código Postgres de "tabela não existe" — migration ainda não aplicada. */
const TABELA_INEXISTENTE = "42P01";
const CODIGO_CONFLITO_UNICO = "23505";

const ROTA_PAINEL = "/painel/financeiro";

type ClienteSupabase = NonNullable<Awaited<ReturnType<typeof createClient>>>;

function dadosDoFormulario(formData: FormData): Record<string, string> {
  const dados: Record<string, string> = {};
  for (const [campo, valor] of formData.entries()) {
    if (typeof valor === "string") dados[campo] = valor;
  }
  return dados;
}

function primeiraMensagem(erro: ZodError): string {
  return erro.issues[0]?.message ?? "Dados inválidos — revise o formulário.";
}

function hojeISO(): string {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

function faltaTabela(erro: { code?: string } | null): boolean {
  return erro?.code === TABELA_INEXISTENTE;
}

// ------------------------------------------------------------------
// Contratos
// ------------------------------------------------------------------

export async function criarContratoFinanceiro(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const resultado = esquemaContratoFinanceiro.safeParse(
    dadosDoFormulario(formData),
  );
  if (!resultado.success) {
    return { ok: false, mensagem: primeiraMensagem(resultado.error) };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, mensagem: MENSAGEM_PRE_ATIVACAO };

  const dados = resultado.data;
  const { error } = await supabase.from("contratos_financeiros").insert({
    cliente_id: dados.clienteId,
    descricao: dados.descricao,
    valor_mensal: dados.valorMensal,
    dia_vencimento: dados.diaVencimento,
    inicio: dados.inicio,
    fim: dados.fim ?? null,
    ativo: true,
  });
  if (faltaTabela(error)) return { ok: false, mensagem: MENSAGEM_PRE_ATIVACAO };
  if (error) {
    return {
      ok: false,
      mensagem: `Não foi possível criar o contrato: ${error.message}`,
    };
  }

  revalidatePath(ROTA_PAINEL);
  return {
    ok: true,
    mensagem: "Contrato criado — o primeiro mês sai proporcional (pró-rata).",
  };
}

// ------------------------------------------------------------------
// Faturas
// ------------------------------------------------------------------

export async function registrarPagamento(
  faturaId: string,
  data?: string,
): Promise<ResultadoAcao> {
  const entrada = esquemaPagamento.safeParse({
    faturaId,
    data: data ?? hojeISO(),
  });
  if (!entrada.success) {
    return { ok: false, erro: primeiraMensagem(entrada.error) };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: MENSAGEM_PRE_ATIVACAO };

  const { data: fatura, error: erroBusca } = await supabase
    .from("faturas")
    .select("id, pago_em")
    .eq("id", entrada.data.faturaId)
    .maybeSingle();
  if (faltaTabela(erroBusca)) return { ok: false, erro: MENSAGEM_PRE_ATIVACAO };
  if (erroBusca) {
    return { ok: false, erro: `Não foi possível buscar a fatura: ${erroBusca.message}` };
  }
  if (!fatura) return { ok: false, erro: "Fatura não encontrada." };
  if (fatura.pago_em) {
    return { ok: false, erro: "Esta fatura já está registrada como paga." };
  }

  const { error } = await supabase
    .from("faturas")
    .update({ pago_em: entrada.data.data, status: "paga" })
    .eq("id", entrada.data.faturaId);
  if (error) {
    return {
      ok: false,
      erro: `Não foi possível registrar o pagamento: ${error.message}`,
    };
  }

  revalidatePath(ROTA_PAINEL);
  return { ok: true, mensagem: "Pagamento registrado." };
}

/**
 * Gera as faturas da competência (padrão: mês corrente) para todos os
 * contratos ativos vigentes, sem duplicar as que já existem — a restrição
 * unique (contrato_id, competencia) protege contra corrida.
 */
export async function gerarFaturasDoMes(
  competencia?: string,
): Promise<ResultadoAcao> {
  const alvo = competencia ?? hojeISO().slice(0, 7);
  const entrada = esquemaCompetencia.safeParse(alvo);
  if (!entrada.success) {
    return { ok: false, erro: primeiraMensagem(entrada.error) };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: MENSAGEM_PRE_ATIVACAO };

  return gerarFaturasNoBanco(supabase, entrada.data);
}

type ContratoParaGeracao = {
  id: string;
  valor_mensal: number | string;
  dia_vencimento: number;
  inicio: string;
  fim: string | null;
};

async function gerarFaturasNoBanco(
  supabase: ClienteSupabase,
  competencia: string,
): Promise<ResultadoAcao> {
  const { data: contratos, error: erroContratos } = await supabase
    .from("contratos_financeiros")
    .select("id, valor_mensal, dia_vencimento, inicio, fim")
    .eq("ativo", true);
  if (faltaTabela(erroContratos)) {
    return { ok: false, erro: MENSAGEM_PRE_ATIVACAO };
  }
  if (erroContratos) {
    return { ok: false, erro: `Não foi possível ler os contratos: ${erroContratos.message}` };
  }

  const { data: existentes, error: erroFaturas } = await supabase
    .from("faturas")
    .select("contrato_id")
    .eq("competencia", competencia);
  if (erroFaturas) {
    return { ok: false, erro: `Não foi possível ler as faturas: ${erroFaturas.message}` };
  }
  const jaGeradas = new Set(
    (existentes as { contrato_id: string }[]).map((f) => f.contrato_id),
  );

  const novas = ((contratos as ContratoParaGeracao[]) ?? [])
    .filter((c) => !jaGeradas.has(c.id))
    .flatMap((c) => {
      const contrato = {
        valorMensal: Number(c.valor_mensal),
        diaVencimento: c.dia_vencimento,
        inicio: c.inicio,
        fim: c.fim ?? undefined,
      };
      // O pró-rata do primeiro mês é aplicado dentro de gerarCompetencias.
      return gerarCompetencias(contrato, competencia)
        .filter((f) => f.competencia === competencia)
        .map((f) => ({
          contrato_id: c.id,
          competencia: f.competencia,
          valor: f.valor,
          vencimento: f.vencimento,
          status: "em_aberto",
        }));
    });

  if (novas.length === 0) {
    return {
      ok: true,
      mensagem: `Nenhuma fatura nova — a competência ${competencia} já está gerada.`,
    };
  }

  const { error } = await supabase.from("faturas").insert(novas);
  if (error && error.code !== CODIGO_CONFLITO_UNICO) {
    return { ok: false, erro: `Não foi possível gerar as faturas: ${error.message}` };
  }

  revalidatePath(ROTA_PAINEL);
  return {
    ok: true,
    mensagem: `${novas.length} fatura(s) gerada(s) para ${competencia}.`,
  };
}
