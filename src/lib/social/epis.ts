"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { FICHAS_EPI_DEMO, TRABALHADORES_DEMO } from "./dados-demo";
import {
  base64DaAssinatura,
  caminhoAssinatura,
  esquemaFichaEpi,
  slugSocial,
} from "./regras";
import { primeiraMensagem } from "./validacao";
import type { EstadoAcao } from "./acoes";

/**
 * Fichas de EPI — consultas e ações.
 * A entrega pode colher a assinatura do colaborador no quadro de assinatura;
 * o PNG vai para o bucket privado 'evidencias' (pasta epis/) e a ficha
 * guarda só o caminho.
 */

const BUCKET = "evidencias";

const AVISO_DEMONSTRACAO =
  "Modo demonstração: conecte o banco de dados para gravar as alterações.";

export type FichaEpiRegistro = {
  id: string;
  trabalhadorId: string;
  trabalhadorNome: string;
  epi: string;
  ca?: string;
  quantidade: number;
  entregueEm: string; // ISO
  /** true quando a assinatura do colaborador foi colhida na entrega. */
  assinada: boolean;
};

function fichasDemo(): FichaEpiRegistro[] {
  return FICHAS_EPI_DEMO.map((f, indice) => ({
    id: `${slugSocial(f.trabalhador)}-${indice}`,
    trabalhadorId: slugSocial(f.trabalhador),
    trabalhadorNome:
      TRABALHADORES_DEMO.find((t) => t.nome === f.trabalhador)?.nome ??
      f.trabalhador,
    epi: f.epi,
    ca: f.ca,
    quantidade: f.quantidade,
    entregueEm: f.entregueEm,
    assinada: f.assinada,
  }));
}

/** Entregas de EPI do cliente, mais recentes primeiro (join com trabalhador). */
export async function listarFichasEpi(
  clienteId: string,
): Promise<FichaEpiRegistro[]> {
  const supabase = await createClient();
  if (!supabase) return fichasDemo();

  const { data, error } = await supabase
    .from("fichas_epi")
    .select(
      "id, trabalhador_id, epi, ca, quantidade, entregue_em, assinatura_caminho, trabalhador:trabalhadores!inner ( nome, cliente_id )",
    )
    .eq("trabalhador.cliente_id", clienteId)
    .order("entregue_em", { ascending: false });
  if (error) throw new Error(`Erro ao listar fichas de EPI: ${error.message}`);

  type Linha = {
    id: string;
    trabalhador_id: string;
    epi: string;
    ca: string | null;
    quantidade: number;
    entregue_em: string;
    assinatura_caminho: string | null;
    trabalhador: { nome: string; cliente_id: string } | null;
  };

  return ((data ?? []) as unknown as Linha[]).map((f) => ({
    id: f.id,
    trabalhadorId: f.trabalhador_id,
    trabalhadorNome: f.trabalhador?.nome ?? "—",
    epi: f.epi,
    ca: f.ca ?? undefined,
    quantidade: f.quantidade,
    entregueEm: f.entregue_em,
    assinada: f.assinatura_caminho !== null,
  }));
}

/**
 * Registra a entrega de um EPI ao colaborador. Se a assinatura vier do
 * quadro (data URL PNG), sobe para o bucket e grava o caminho na ficha.
 */
export async function entregarEpi(
  trabalhadorId: string,
  epi: string,
  ca: string | undefined,
  quantidade: number,
  data: string,
  assinaturaDataUrl?: string,
): Promise<EstadoAcao> {
  const resultado = esquemaFichaEpi.safeParse({
    trabalhadorId,
    epi,
    ca: ca || undefined,
    quantidade,
    entregueEm: data,
  });
  if (!resultado.success) {
    return { ok: false, erro: primeiraMensagem(resultado.error) };
  }

  let assinaturaBase64: string | null = null;
  if (assinaturaDataUrl) {
    assinaturaBase64 = base64DaAssinatura(assinaturaDataUrl);
    if (!assinaturaBase64) {
      return {
        ok: false,
        erro: "A assinatura não pôde ser lida — limpe o quadro e assine de novo.",
      };
    }
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: AVISO_DEMONSTRACAO };

  const { data: trabalhador, error: erroTrabalhador } = await supabase
    .from("trabalhadores")
    .select("id, nome")
    .eq("id", resultado.data.trabalhadorId)
    .maybeSingle();
  if (erroTrabalhador) {
    return {
      ok: false,
      erro: `Não foi possível buscar o colaborador: ${erroTrabalhador.message}`,
    };
  }
  if (!trabalhador) return { ok: false, erro: "Colaborador não encontrado." };

  let caminho: string | null = null;
  if (assinaturaBase64) {
    caminho = caminhoAssinatura("epis", trabalhador.id);
    const { error: erroUpload } = await supabase.storage
      .from(BUCKET)
      .upload(caminho, Buffer.from(assinaturaBase64, "base64"), {
        contentType: "image/png",
      });
    if (erroUpload) {
      return {
        ok: false,
        erro: `Não foi possível enviar a assinatura: ${erroUpload.message}`,
      };
    }
  }

  const { error } = await supabase.from("fichas_epi").insert({
    trabalhador_id: trabalhador.id,
    epi: resultado.data.epi,
    ca: resultado.data.ca ?? null,
    quantidade: resultado.data.quantidade,
    entregue_em: resultado.data.entregueEm,
    assinatura_caminho: caminho,
  });
  if (error) {
    // Não deixa assinatura órfã no bucket se o registro falhar.
    if (caminho) await supabase.storage.from(BUCKET).remove([caminho]);
    return { ok: false, erro: `Não foi possível registrar: ${error.message}` };
  }

  revalidatePath("/painel/social");
  return {
    ok: true,
    mensagem: `${resultado.data.epi} entregue a ${trabalhador.nome}${
      caminho ? " — assinatura arquivada" : ""
    }.`,
  };
}
