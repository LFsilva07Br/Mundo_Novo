"use server";

import { revalidatePath } from "next/cache";
import { z, type ZodError, type ZodType } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  esquemaAtualizarLote,
  esquemaLote,
  esquemaNegociacao,
} from "./esquemas";
import {
  formatarSacas,
  podeMarcarEntregue,
  podeReduzirSacas,
  sacasFechadas,
  statusLoteAposNegociacoes,
  validarSacasNegociacao,
  type StatusLote,
  type StatusNegociacao,
} from "./regras";

/**
 * Server Actions da comercialização de café. Toda regra é validada aqui,
 * no servidor — esconder um botão na tela nunca é a única proteção:
 * saldo disponível, fechamento que zera o lote e entrega são conferidos
 * contra o banco antes de gravar.
 */

export type EstadoAcao = { ok: boolean; mensagem: string } | null;
export type ResultadoAcao = { ok: true } | { ok: false; erro: string };

const MENSAGEM_DEMO =
  "Banco de dados ainda não conectado — em modo demonstração as alterações não são gravadas.";

const CODIGO_CONFLITO_UNICO = "23505";

const ROTA_PAINEL = "/painel/comercializacao";

type ClienteSupabase = NonNullable<Awaited<ReturnType<typeof createClient>>>;

type NegociacaoDoLote = {
  id: string;
  sacas: number | string;
  status: StatusNegociacao;
};

type LoteComNegociacoes = {
  id: string;
  sacas: number | string;
  status: StatusLote;
  negociacoes: NegociacaoDoLote[];
};

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

function negociacoesEmNumero(
  negociacoes: NegociacaoDoLote[],
): { id: string; sacas: number; status: StatusNegociacao }[] {
  return negociacoes.map((n) => ({ ...n, sacas: Number(n.sacas) }));
}

/** Valida o formulário, obtém o cliente Supabase e delega a gravação. */
async function executar<T>(
  esquema: ZodType<T>,
  formData: FormData,
  gravar: (supabase: ClienteSupabase, dados: T) => Promise<string | null>,
  mensagemSucesso: string,
): Promise<EstadoAcao> {
  const resultado = esquema.safeParse(dadosDoFormulario(formData));
  if (!resultado.success) {
    return { ok: false, mensagem: primeiraMensagem(resultado.error) };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, mensagem: MENSAGEM_DEMO };

  const erro = await gravar(supabase, resultado.data);
  if (erro) return { ok: false, mensagem: erro };

  revalidatePath(ROTA_PAINEL);
  return { ok: true, mensagem: mensagemSucesso };
}

async function buscarLote(
  supabase: ClienteSupabase,
  loteId: string,
): Promise<LoteComNegociacoes | null> {
  const { data } = await supabase
    .from("lotes")
    .select("id, sacas, status, negociacoes ( id, sacas, status )")
    .eq("id", loteId)
    .maybeSingle();
  return (data as unknown as LoteComNegociacoes | null) ?? null;
}

/** Recalcula o status do lote quando as negociações mudam. */
async function sincronizarStatusDoLote(
  supabase: ClienteSupabase,
  lote: LoteComNegociacoes,
  negociacoes: { sacas: number; status: StatusNegociacao }[],
): Promise<string | null> {
  const novoStatus = statusLoteAposNegociacoes(
    lote.status,
    Number(lote.sacas),
    negociacoes,
  );
  if (novoStatus === lote.status) return null;

  const { error } = await supabase
    .from("lotes")
    .update({ status: novoStatus })
    .eq("id", lote.id);
  return error
    ? `Negociação gravada, mas o status do lote não foi atualizado: ${error.message}`
    : null;
}

// ------------------------------------------------------------------
// Lotes
// ------------------------------------------------------------------

export async function criarLote(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  return executar(
    esquemaLote,
    formData,
    async (supabase, dados) => {
      const { error } = await supabase.from("lotes").insert({
        cliente_id: dados.clienteId,
        safra_id: dados.safraId ?? null,
        identificacao: dados.identificacao,
        sacas: dados.sacas,
        origem_talhoes: dados.origemTalhoes ?? null,
        peneira: dados.peneira ?? null,
        bebida: dados.bebida ?? null,
        observacao: dados.observacao ?? null,
        status: "estoque",
      });
      if (error?.code === CODIGO_CONFLITO_UNICO) {
        return `Já existe um lote "${dados.identificacao}" para este cliente — use outra identificação.`;
      }
      return error ? `Não foi possível criar o lote: ${error.message}` : null;
    },
    "Lote cadastrado no estoque.",
  );
}

export async function atualizarLote(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  return executar(
    esquemaAtualizarLote,
    formData,
    async (supabase, dados) => {
      const lote = await buscarLote(supabase, dados.id);
      if (!lote) return "Lote não encontrado.";

      const negociacoes = negociacoesEmNumero(lote.negociacoes);
      if (!podeReduzirSacas(dados.sacas, negociacoes)) {
        return `Não é possível reduzir o lote para ${formatarSacas(dados.sacas)} sacas: ${formatarSacas(sacasFechadas(negociacoes))} sacas já estão em negociações fechadas.`;
      }

      const { error } = await supabase
        .from("lotes")
        .update({
          safra_id: dados.safraId ?? null,
          identificacao: dados.identificacao,
          sacas: dados.sacas,
          origem_talhoes: dados.origemTalhoes ?? null,
          peneira: dados.peneira ?? null,
          bebida: dados.bebida ?? null,
          observacao: dados.observacao ?? null,
        })
        .eq("id", dados.id);
      if (error?.code === CODIGO_CONFLITO_UNICO) {
        return `Já existe um lote "${dados.identificacao}" para este cliente — use outra identificação.`;
      }
      if (error) return `Não foi possível salvar o lote: ${error.message}`;

      // Mudou a quantidade de sacas? O status acompanha o novo saldo.
      return sincronizarStatusDoLote(
        supabase,
        { ...lote, sacas: dados.sacas },
        negociacoes,
      );
    },
    "Lote atualizado.",
  );
}

export async function marcarLoteEntregue(
  loteId: string,
): Promise<ResultadoAcao> {
  const entrada = z.string().trim().min(1).safeParse(loteId);
  if (!entrada.success) return { ok: false, erro: "Lote inválido." };

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: MENSAGEM_DEMO };

  const lote = await buscarLote(supabase, entrada.data);
  if (!lote) return { ok: false, erro: "Lote não encontrado." };
  if (lote.status === "entregue") {
    return { ok: false, erro: "Este lote já está marcado como entregue." };
  }
  if (!podeMarcarEntregue(negociacoesEmNumero(lote.negociacoes))) {
    return {
      ok: false,
      erro: "Para marcar a entrega, o lote precisa de ao menos uma negociação fechada.",
    };
  }

  const { error } = await supabase
    .from("lotes")
    .update({ status: "entregue" })
    .eq("id", lote.id);
  if (error) {
    return { ok: false, erro: `Não foi possível marcar a entrega: ${error.message}` };
  }

  revalidatePath(ROTA_PAINEL);
  return { ok: true };
}

// ------------------------------------------------------------------
// Negociações
// ------------------------------------------------------------------

export async function criarNegociacao(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  return executar(
    esquemaNegociacao,
    formData,
    async (supabase, dados) => {
      const lote = await buscarLote(supabase, dados.loteId);
      if (!lote) return "Lote não encontrado.";
      if (lote.status === "entregue") {
        return "Este lote já foi entregue — não é possível registrar novas negociações.";
      }

      const negociacoes = negociacoesEmNumero(lote.negociacoes);
      const erroSaldo = validarSacasNegociacao(
        dados.sacas,
        Number(lote.sacas),
        negociacoes,
      );
      if (erroSaldo) return erroSaldo;

      const { error } = await supabase.from("negociacoes").insert({
        lote_id: dados.loteId,
        comprador: dados.comprador,
        sacas: dados.sacas,
        preco_por_saca: dados.precoPorSaca,
        data: dados.data ?? new Date().toISOString().slice(0, 10),
        contrato: dados.contrato ?? null,
        status: dados.status,
        observacao: dados.observacao ?? null,
      });
      if (error) {
        return `Não foi possível registrar a negociação: ${error.message}`;
      }

      // Fechada que zera o saldo → o lote inteiro vira "negociado".
      return sincronizarStatusDoLote(supabase, lote, [
        ...negociacoes,
        { id: "nova", sacas: dados.sacas, status: dados.status },
      ]);
    },
    "Negociação registrada.",
  );
}

export async function atualizarStatusNegociacao(
  negociacaoId: string,
  novoStatus: "fechada" | "cancelada",
): Promise<ResultadoAcao> {
  const entrada = z
    .object({
      negociacaoId: z.string().trim().min(1),
      novoStatus: z.enum(["fechada", "cancelada"]),
    })
    .safeParse({ negociacaoId, novoStatus });
  if (!entrada.success) {
    return { ok: false, erro: "Dados inválidos para atualizar a negociação." };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: MENSAGEM_DEMO };

  const { data } = await supabase
    .from("negociacoes")
    .select(
      "id, sacas, status, lote_id, lotes ( id, sacas, status, negociacoes ( id, sacas, status ) )",
    )
    .eq("id", entrada.data.negociacaoId)
    .maybeSingle();
  const negociacao = data as unknown as
    | (NegociacaoDoLote & { lote_id: string; lotes: LoteComNegociacoes | null })
    | null;
  if (!negociacao || !negociacao.lotes) {
    return { ok: false, erro: "Negociação não encontrada." };
  }
  if (negociacao.status === "cancelada") {
    return {
      ok: false,
      erro: "Negociação cancelada não pode ser reaberta — registre uma nova.",
    };
  }
  if (negociacao.status === entrada.data.novoStatus) {
    return {
      ok: false,
      erro: `A negociação já está ${entrada.data.novoStatus}.`,
    };
  }

  const lote = negociacao.lotes;
  const demais = negociacoesEmNumero(
    lote.negociacoes.filter((n) => n.id !== negociacao.id),
  );

  if (entrada.data.novoStatus === "fechada") {
    const erroSaldo = validarSacasNegociacao(
      Number(negociacao.sacas),
      Number(lote.sacas),
      demais,
    );
    if (erroSaldo) return { ok: false, erro: erroSaldo };
  }

  const { error } = await supabase
    .from("negociacoes")
    .update({ status: entrada.data.novoStatus })
    .eq("id", negociacao.id);
  if (error) {
    return { ok: false, erro: `Não foi possível atualizar a negociação: ${error.message}` };
  }

  // Fechamento que zera o saldo → lote "negociado";
  // cancelamento que libera saldo → lote volta para "estoque".
  const erroStatus = await sincronizarStatusDoLote(supabase, lote, [
    ...demais,
    {
      id: negociacao.id,
      sacas: Number(negociacao.sacas),
      status: entrada.data.novoStatus,
    },
  ]);
  if (erroStatus) return { ok: false, erro: erroStatus };

  revalidatePath(ROTA_PAINEL);
  return { ok: true };
}
