"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, getUsuarioAtual } from "@/lib/supabase/server";
import { montarCaminhoEvidencia, validarArquivoEvidencia } from "./regras";

/**
 * Server Actions das evidências fotográficas.
 *
 * Upload sempre pelo servidor: valida tipo/tamanho, grava no bucket privado
 * 'evidencias' e registra na tabela correspondente (visita_fotos ou
 * capa_evidencias). Para exibir, as consultas devolvem URLs assinadas com
 * validade de 1 hora — o bucket nunca fica público.
 */

const BUCKET = "evidencias";
const VALIDADE_URL_SEGUNDOS = 3600; // 1 hora

const ERRO_SEM_BANCO =
  "Modo demonstração — conecte o Supabase para anexar evidências.";

export type ResultadoAcao = { ok: true } | { ok: false; erro: string };

export type FotoVisita = {
  id: string;
  itemId: string | null;
  caminho: string;
  gps: string | null;
  tiradaEm: string;
  /** URL assinada (1h) para exibição — null se a assinatura falhar. */
  url: string | null;
};

export type EvidenciaCapa = {
  id: string;
  acaoId: string | null;
  caminho: string;
  descricao: string | null;
  autorNome: string | null;
  criadoEm: string;
  /** URL assinada (1h) para exibição — null se a assinatura falhar. */
  url: string | null;
};

const esquemaGps = z
  .string()
  .trim()
  .regex(/^-?\d{1,2}(\.\d+)?,\s*-?\d{1,3}(\.\d+)?$/, "GPS inválido — use \"lat,long\".");

function extrairArquivo(formData: FormData): File | null {
  const arquivo = formData.get("arquivo");
  return arquivo instanceof File ? arquivo : null;
}

type Supabase = NonNullable<Awaited<ReturnType<typeof createClient>>>;

async function subirParaBucket(
  supabase: Supabase,
  caminho: string,
  arquivo: File,
): Promise<ResultadoAcao> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, arquivo, { contentType: arquivo.type });
  if (error) {
    return { ok: false, erro: `Falha ao enviar a foto: ${error.message}` };
  }
  return { ok: true };
}

async function assinarUrls(
  supabase: Supabase,
  caminhos: string[],
): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (caminhos.length === 0) return urls;

  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(caminhos, VALIDADE_URL_SEGUNDOS);
  for (const assinada of data ?? []) {
    if (assinada.path && assinada.signedUrl) {
      urls.set(assinada.path, assinada.signedUrl);
    }
  }
  return urls;
}

// ------------------------------------------------------------------
// Fotos de visita
// ------------------------------------------------------------------

/**
 * Anexa uma foto à visita (opcionalmente vinculada a um item do checklist).
 * `formData` deve conter o campo "arquivo"; `gps` é opcional ("lat,long").
 */
export async function enviarFotoVisita(
  visitaId: string,
  itemId: string | null,
  formData: FormData,
  gps?: string,
): Promise<ResultadoAcao> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: ERRO_SEM_BANCO };

  const ids = z
    .object({ visitaId: z.uuid(), itemId: z.uuid().nullable() })
    .safeParse({ visitaId, itemId });
  if (!ids.success) return { ok: false, erro: "Visita ou item inválido." };

  let gpsValidado: string | null = null;
  if (gps) {
    const analise = esquemaGps.safeParse(gps);
    if (!analise.success) {
      return { ok: false, erro: "Localização inválida — a foto não foi enviada." };
    }
    gpsValidado = analise.data;
  }

  const arquivo = extrairArquivo(formData);
  if (!arquivo) return { ok: false, erro: "Escolha uma foto para enviar." };

  const validacao = validarArquivoEvidencia(arquivo);
  if (!validacao.ok) return validacao;

  const { data: visita } = await supabase
    .from("visitas")
    .select("id")
    .eq("id", ids.data.visitaId)
    .maybeSingle();
  if (!visita) return { ok: false, erro: "Visita não encontrada." };

  const caminho = montarCaminhoEvidencia("visitas", ids.data.visitaId, arquivo.type);
  const upload = await subirParaBucket(supabase, caminho, arquivo);
  if (!upload.ok) return upload;

  const { error } = await supabase.from("visita_fotos").insert({
    visita_id: ids.data.visitaId,
    item_id: ids.data.itemId,
    caminho,
    gps: gpsValidado,
    tirada_em: new Date().toISOString(),
  });
  if (error) {
    // Não deixa arquivo órfão no bucket se o registro falhar.
    await supabase.storage.from(BUCKET).remove([caminho]);
    return { ok: false, erro: `Foto enviada, mas não registrada: ${error.message}` };
  }

  revalidatePath(`/painel/visitas/${ids.data.visitaId}`);
  return { ok: true };
}

/** Fotos da visita com URL assinada (1h) para exibição. */
export async function listarFotosVisita(visitaId: string): Promise<FotoVisita[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const analise = z.uuid().safeParse(visitaId);
  if (!analise.success) return [];

  const { data, error } = await supabase
    .from("visita_fotos")
    .select("id, item_id, caminho, gps, tirada_em")
    .eq("visita_id", analise.data)
    .order("tirada_em", { ascending: true });
  if (error) throw new Error(`Erro ao listar fotos da visita: ${error.message}`);

  type Linha = {
    id: string;
    item_id: string | null;
    caminho: string;
    gps: string | null;
    tirada_em: string;
  };
  const linhas = (data ?? []) as Linha[];
  const urls = await assinarUrls(supabase, linhas.map((l) => l.caminho));

  return linhas.map((linha) => ({
    id: linha.id,
    itemId: linha.item_id,
    caminho: linha.caminho,
    gps: linha.gps,
    tiradaEm: linha.tirada_em,
    url: urls.get(linha.caminho) ?? null,
  }));
}

// ------------------------------------------------------------------
// Evidências de CAPA
// ------------------------------------------------------------------

/**
 * Anexa uma evidência à CAPA (opcionalmente vinculada a uma ação do plano).
 * `formData` deve conter o campo "arquivo"; `descricao` é opcional.
 */
export async function enviarEvidenciaCapa(
  capaId: string,
  acaoId: string | null,
  formData: FormData,
  descricao?: string,
): Promise<ResultadoAcao> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: ERRO_SEM_BANCO };

  const ids = z
    .object({
      capaId: z.uuid(),
      acaoId: z.uuid().nullable(),
      descricao: z.string().trim().max(500).optional(),
    })
    .safeParse({ capaId, acaoId, descricao });
  if (!ids.success) return { ok: false, erro: "CAPA ou ação inválida." };

  const arquivo = extrairArquivo(formData);
  if (!arquivo) return { ok: false, erro: "Escolha uma foto para enviar." };

  const validacao = validarArquivoEvidencia(arquivo);
  if (!validacao.ok) return validacao;

  const { data: capa } = await supabase
    .from("capas")
    .select("id, status")
    .eq("id", ids.data.capaId)
    .maybeSingle();
  if (!capa) return { ok: false, erro: "CAPA não encontrada." };
  if (capa.status === "fechada") {
    return { ok: false, erro: "Esta CAPA já foi fechada — evidências estão travadas." };
  }

  const caminho = montarCaminhoEvidencia("capas", ids.data.capaId, arquivo.type);
  const upload = await subirParaBucket(supabase, caminho, arquivo);
  if (!upload.ok) return upload;

  const usuario = await getUsuarioAtual();
  const { error } = await supabase.from("capa_evidencias").insert({
    capa_id: ids.data.capaId,
    acao_id: ids.data.acaoId,
    caminho,
    descricao: ids.data.descricao || null,
    autor_id: usuario?.id ?? null,
  });
  if (error) {
    await supabase.storage.from(BUCKET).remove([caminho]);
    return {
      ok: false,
      erro: `Evidência enviada, mas não registrada: ${error.message}`,
    };
  }

  revalidatePath("/painel/capas");
  return { ok: true };
}

/** Evidências da CAPA com URL assinada (1h) para exibição. */
export async function listarEvidenciasCapa(
  capaId: string,
): Promise<EvidenciaCapa[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const analise = z.uuid().safeParse(capaId);
  if (!analise.success) return [];

  const { data, error } = await supabase
    .from("capa_evidencias")
    .select("id, acao_id, caminho, descricao, criado_em, autor:perfis ( nome )")
    .eq("capa_id", analise.data)
    .order("criado_em", { ascending: true });
  if (error) {
    throw new Error(`Erro ao listar evidências da CAPA: ${error.message}`);
  }

  type Linha = {
    id: string;
    acao_id: string | null;
    caminho: string;
    descricao: string | null;
    criado_em: string;
    autor: { nome: string } | null;
  };
  const linhas = (data ?? []) as unknown as Linha[];
  const urls = await assinarUrls(supabase, linhas.map((l) => l.caminho));

  return linhas.map((linha) => ({
    id: linha.id,
    acaoId: linha.acao_id,
    caminho: linha.caminho,
    descricao: linha.descricao,
    autorNome: linha.autor?.nome ?? null,
    criadoEm: linha.criado_em,
    url: urls.get(linha.caminho) ?? null,
  }));
}
