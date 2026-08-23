"use server";

import { revalidatePath } from "next/cache";
import type { ZodError, ZodType } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  esquemaAtualizarImovel,
  esquemaAtualizarTalhao,
  esquemaCaptacao,
  esquemaDocumentoImovel,
  esquemaImovel,
  esquemaLancamentoSafra,
  esquemaTalhao,
} from "./imoveis-esquemas";

/**
 * Server Actions de imóveis rurais, documentos, captações, talhões e
 * lançamentos por safra. Todas validam com zod, gravam no Supabase e
 * revalidam a tela de Imóveis & Talhões.
 */

export type EstadoAcao = { ok: boolean; mensagem: string } | null;

type ClienteSupabase = NonNullable<Awaited<ReturnType<typeof createClient>>>;

const MENSAGEM_DEMO =
  "Banco de dados ainda não conectado — em modo demonstração os cadastros não são gravados.";

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

/** Valida, obtém o cliente Supabase e delega a gravação. */
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
  if (erro) {
    return { ok: false, mensagem: `Não foi possível salvar: ${erro}` };
  }

  revalidatePath("/painel/imoveis");
  return { ok: true, mensagem: mensagemSucesso };
}

// ------------------------------------------------------------------
// Imóveis rurais
// ------------------------------------------------------------------

export async function criarImovel(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  return executar(
    esquemaImovel,
    formData,
    async (supabase, dados) => {
      const { error } = await supabase.from("imoveis_rurais").insert({
        cliente_id: dados.clienteId,
        nome: dados.nome,
        proprietarios: dados.proprietarios ?? null,
        cidade: dados.cidade ?? null,
        uf: dados.uf ?? null,
        car: dados.car ?? null,
        matriculas: dados.matriculas ?? null,
        area_total_ha: dados.areaTotalHa,
        area_cafe_ha: dados.areaCafeHa ?? 0,
        area_app_ha: dados.areaAppHa ?? 0,
        area_reserva_ha: dados.areaReservaHa ?? 0,
        possui_captacao_agua: dados.possuiCaptacaoAgua,
      });
      return error?.message ?? null;
    },
    "Imóvel rural cadastrado.",
  );
}

export async function atualizarImovel(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  return executar(
    esquemaAtualizarImovel,
    formData,
    async (supabase, dados) => {
      const { error } = await supabase
        .from("imoveis_rurais")
        .update({
          nome: dados.nome,
          proprietarios: dados.proprietarios ?? null,
          cidade: dados.cidade ?? null,
          uf: dados.uf ?? null,
          car: dados.car ?? null,
          matriculas: dados.matriculas ?? null,
          area_total_ha: dados.areaTotalHa,
          area_cafe_ha: dados.areaCafeHa ?? 0,
          area_app_ha: dados.areaAppHa ?? 0,
          area_reserva_ha: dados.areaReservaHa ?? 0,
          possui_captacao_agua: dados.possuiCaptacaoAgua,
        })
        .eq("id", dados.id);
      return error?.message ?? null;
    },
    "Imóvel rural atualizado.",
  );
}

// ------------------------------------------------------------------
// Talhões
// ------------------------------------------------------------------

export async function criarTalhao(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  return executar(
    esquemaTalhao,
    formData,
    async (supabase, dados) => {
      const { error } = await supabase.from("talhoes").insert({
        imovel_id: dados.imovelId,
        nome: dados.nome,
        area_ha: dados.areaHa,
        plantas_por_ha: dados.plantasPorHa ?? null,
        espacamento: dados.espacamento ?? null,
        variedade: dados.variedade,
        ano_plantio: dados.anoPlantio,
        area_irrigada_ha: dados.areaIrrigadaHa ?? 0,
      });
      return error?.message ?? null;
    },
    "Talhão cadastrado.",
  );
}

export async function atualizarTalhao(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  return executar(
    esquemaAtualizarTalhao,
    formData,
    async (supabase, dados) => {
      const { error } = await supabase
        .from("talhoes")
        .update({
          imovel_id: dados.imovelId,
          nome: dados.nome,
          area_ha: dados.areaHa,
          plantas_por_ha: dados.plantasPorHa ?? null,
          espacamento: dados.espacamento ?? null,
          variedade: dados.variedade,
          ano_plantio: dados.anoPlantio,
          area_irrigada_ha: dados.areaIrrigadaHa ?? 0,
        })
        .eq("id", dados.id);
      return error?.message ?? null;
    },
    "Talhão atualizado.",
  );
}

// ------------------------------------------------------------------
// Lançamento por safra (upsert por talhão + safra)
// ------------------------------------------------------------------

export async function lancarSafraTalhao(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  return executar(
    esquemaLancamentoSafra,
    formData,
    async (supabase, dados) => {
      // Garante a safra pelo rótulo (cria se ainda não existir).
      const { data: safraExistente, error: erroBusca } = await supabase
        .from("safras")
        .select("id")
        .eq("rotulo", dados.safra)
        .maybeSingle();
      if (erroBusca) return erroBusca.message;

      let safraId = safraExistente?.id as string | undefined;
      if (!safraId) {
        const { data: novaSafra, error: erroSafra } = await supabase
          .from("safras")
          .insert({ rotulo: dados.safra })
          .select("id")
          .single();
        if (erroSafra) return erroSafra.message;
        safraId = novaSafra.id as string;
      }

      const { error } = await supabase.from("talhao_safras").upsert(
        {
          talhao_id: dados.talhaoId,
          safra_id: safraId,
          estado_lavoura: dados.estadoLavoura ?? null,
          previsao_sacas: dados.previsaoSacas ?? null,
          colheita_efetiva_sacas: dados.colheitaEfetivaSacas ?? null,
          previsao_poda_renovacao: dados.previsaoPodaRenovacao ?? null,
        },
        { onConflict: "talhao_id,safra_id" },
      );
      return error?.message ?? null;
    },
    "Lançamento da safra registrado.",
  );
}

// ------------------------------------------------------------------
// Documentos e captações do imóvel
// ------------------------------------------------------------------

export async function adicionarDocumentoImovel(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  return executar(
    esquemaDocumentoImovel,
    formData,
    async (supabase, dados) => {
      const { error } = await supabase.from("documentos_imovel").insert({
        imovel_id: dados.imovelId,
        tipo: dados.tipo,
        identificacao: dados.identificacao ?? null,
        vence_em: dados.venceEm ?? null,
        status: dados.status,
        observacao: dados.observacao ?? null,
      });
      return error?.message ?? null;
    },
    "Documento do imóvel cadastrado.",
  );
}

export async function adicionarCaptacao(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  return executar(
    esquemaCaptacao,
    formData,
    async (supabase, dados) => {
      const { error } = await supabase.from("captacoes_agua").insert({
        imovel_id: dados.imovelId,
        tipo_captacao: dados.tipoCaptacao,
        processo: dados.processo ?? null,
        classificacao: dados.classificacao ?? null,
        vence_em: dados.venceEm ?? null,
        status: dados.status,
      });
      return error?.message ?? null;
    },
    "Captação de água cadastrada.",
  );
}
