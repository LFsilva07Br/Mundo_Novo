"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ResultadoAcao } from "./acoes";
import { BIBLIOTECA_NORMAS, type NormaBiblioteca } from "./biblioteca";

/**
 * Ação da biblioteca multi-normas: cria um checklist novo a partir do
 * template da norma escolhida (4C ou Orgânico), com a versão 1 em RASCUNHO
 * e todos os itens do template. NÃO publica — a publicação continua sendo o
 * passo manual que leva o checklist ao app (regra do checklist versionado).
 */
export async function criarChecklistDeTemplate(
  norma: NormaBiblioteca,
): Promise<ResultadoAcao> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      ok: false,
      erro: "Modo demonstração — conecte o Supabase para gravar alterações.",
    };
  }

  const template = BIBLIOTECA_NORMAS[norma];
  if (!template) {
    return { ok: false, erro: "Norma não disponível na biblioteca." };
  }

  const { data: existente, error: erroExistente } = await supabase
    .from("checklists")
    .select("id")
    .eq("norma", template.norma)
    .limit(1)
    .maybeSingle();
  if (erroExistente) {
    return {
      ok: false,
      erro: `Erro ao verificar checklists: ${erroExistente.message}`,
    };
  }
  if (existente) {
    return {
      ok: false,
      erro: "Já existe um checklist desta norma — selecione-o no topo da tela para continuar a edição.",
    };
  }

  const { data: checklist, error: erroChecklist } = await supabase
    .from("checklists")
    .insert({
      nome: template.nome,
      norma: template.norma,
      versao_norma: template.versaoNorma,
    })
    .select("id")
    .single();
  if (erroChecklist) {
    return {
      ok: false,
      erro: `Erro ao criar o checklist: ${erroChecklist.message}`,
    };
  }

  const { data: versao, error: erroVersao } = await supabase
    .from("checklist_versoes")
    .insert({
      checklist_id: checklist.id,
      numero: 1,
      status: "rascunho",
    })
    .select("id")
    .single();
  if (erroVersao) {
    return {
      ok: false,
      erro: `Erro ao criar a versão rascunho: ${erroVersao.message}`,
    };
  }

  const { error: erroItens } = await supabase.from("checklist_itens").insert(
    template.itens.map((item, indice) => ({
      versao_id: versao.id,
      ordem: indice + 1,
      codigo: item.codigo,
      capitulo: item.capitulo,
      pergunta: item.pergunta,
      obrigatorio: item.obrigatorio,
      fotos_minimas: item.fotosMinimas,
      descricao_minima: item.descricaoMinima,
      referencia_norma: item.referenciaNorma,
      permite_na: true,
    })),
  );
  if (erroItens) {
    return {
      ok: false,
      erro: `Erro ao criar os itens do template: ${erroItens.message}`,
    };
  }

  revalidatePath("/painel/checklists");
  return { ok: true, id: checklist.id };
}
