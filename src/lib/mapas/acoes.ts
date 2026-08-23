"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { converterParaGeoJson, TAMANHO_MAXIMO_BYTES } from "./conversao";

/**
 * Server Actions dos mapas das fazendas: recebem o KML/GeoJSON exportado
 * do CAR ou do Google Earth, convertem para GeoJSON, guardam o arquivo
 * original no bucket privado 'evidencias' (pasta mapas/) e registram na
 * tabela `mapas_imovel` para o visor da tela de Imóveis & Talhões.
 */

const BUCKET = "evidencias";

const MENSAGEM_DEMO =
  "Banco de dados ainda não conectado — em modo demonstração os mapas não são gravados.";

export type EstadoMapa = { ok: boolean; mensagem: string } | null;

/** Nome de arquivo seguro para o caminho no bucket (sem acentos/espaços). */
function nomeArquivoSeguro(nome: string): string {
  const limpo = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return limpo || "mapa";
}

/**
 * Envia um mapa para o imóvel: `formData` deve conter o campo "arquivo"
 * (.kml ou .geojson) e, opcionalmente, "nome" (apelido do mapa).
 */
export async function enviarMapa(
  imovelId: string,
  formData: FormData,
): Promise<NonNullable<EstadoMapa>> {
  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return {
      ok: false,
      mensagem: "Escolha um arquivo .kml ou .geojson para enviar.",
    };
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return {
      ok: false,
      mensagem:
        "O arquivo passa de 5 MB — exporte apenas os talhões/limites da fazenda.",
    };
  }

  const conversao = converterParaGeoJson(arquivo.name, await arquivo.text());
  if (!conversao.ok) return { ok: false, mensagem: conversao.erro };

  const nomeInformado = formData.get("nome");
  const nome =
    (typeof nomeInformado === "string" ? nomeInformado.trim() : "") ||
    arquivo.name.replace(/\.[^.]+$/, "");

  const supabase = await createClient();
  if (!supabase) return { ok: false, mensagem: MENSAGEM_DEMO };

  const idValido = z.uuid().safeParse(imovelId);
  if (!idValido.success) {
    return { ok: false, mensagem: "Imóvel inválido — recarregue a página." };
  }

  const { data: imovel } = await supabase
    .from("imoveis_rurais")
    .select("id")
    .eq("id", idValido.data)
    .maybeSingle();
  if (!imovel) return { ok: false, mensagem: "Imóvel rural não encontrado." };

  const caminho = `mapas/${idValido.data}/${Date.now()}-${nomeArquivoSeguro(arquivo.name)}`;
  const { error: erroUpload } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, arquivo, {
      contentType: arquivo.type || "application/octet-stream",
    });
  if (erroUpload) {
    return {
      ok: false,
      mensagem: `Falha ao guardar o arquivo original: ${erroUpload.message}`,
    };
  }

  const { error: erroInsercao } = await supabase.from("mapas_imovel").insert({
    imovel_id: idValido.data,
    nome,
    caminho_arquivo: caminho,
    geojson: conversao.geojson,
  });
  if (erroInsercao) {
    // Não deixa arquivo órfão no bucket se o registro falhar.
    await supabase.storage.from(BUCKET).remove([caminho]);
    return {
      ok: false,
      mensagem: `Arquivo enviado, mas o mapa não foi registrado: ${erroInsercao.message}`,
    };
  }

  revalidatePath("/painel/imoveis");
  return { ok: true, mensagem: "Mapa enviado — já aparece no visor da fazenda." };
}

/** Remove o mapa do imóvel (registro e arquivo original no bucket). */
export async function removerMapa(
  id: string,
): Promise<NonNullable<EstadoMapa>> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, mensagem: MENSAGEM_DEMO };

  const idValido = z.uuid().safeParse(id);
  if (!idValido.success) {
    return { ok: false, mensagem: "Mapa inválido — recarregue a página." };
  }

  const { data: mapa, error: erroBusca } = await supabase
    .from("mapas_imovel")
    .select("id, caminho_arquivo")
    .eq("id", idValido.data)
    .maybeSingle();
  if (erroBusca) {
    return {
      ok: false,
      mensagem: `Não foi possível buscar o mapa: ${erroBusca.message}`,
    };
  }
  if (!mapa) return { ok: false, mensagem: "Mapa não encontrado." };

  const { error: erroRemocao } = await supabase
    .from("mapas_imovel")
    .delete()
    .eq("id", idValido.data);
  if (erroRemocao) {
    return {
      ok: false,
      mensagem: `Não foi possível remover o mapa: ${erroRemocao.message}`,
    };
  }

  if (mapa.caminho_arquivo) {
    // Arquivo original é acessório: falha aqui não desfaz a remoção.
    await supabase.storage.from(BUCKET).remove([mapa.caminho_arquivo]);
  }

  revalidatePath("/painel/imoveis");
  return { ok: true, mensagem: "Mapa removido." };
}
