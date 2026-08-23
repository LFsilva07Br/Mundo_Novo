"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirEscrita } from "@/lib/auditor/guarda";
import { createClient, getUsuarioAtual } from "@/lib/supabase/server";
import {
  calcularConformidade,
  calcularConformidadeCliente,
  validarConclusaoVisita,
  validarDescricaoNc,
} from "./regras";
import type { Resposta } from "./tipos";

/**
 * Server Actions do editor de checklist versionado e da execução de visitas.
 *
 * Regras aplicadas aqui (além das políticas RLS do banco):
 * - edição só acontece em versão RASCUNHO; publicar arquiva a anterior;
 * - NC exige descrição com o mínimo de caracteres do item;
 * - visita só conclui com todos os itens obrigatórios respondidos.
 */

export type ResultadoAcao =
  | { ok: true; id?: string }
  | { ok: false; erro: string };

const ERRO_SEM_BANCO =
  "Modo demonstração — conecte o Supabase para gravar alterações.";

function erroDeValidacao(resultado: { error: z.ZodError }): ResultadoAcao {
  const primeiro = resultado.error.issues[0];
  return {
    ok: false,
    erro: `Dados inválidos: ${primeiro?.message ?? "confira os campos informados."}`,
  };
}

// ------------------------------------------------------------------
// Editor de checklist versionado
// ------------------------------------------------------------------

/**
 * Cria uma versão rascunho (número seguinte) copiando todos os itens da
 * versão publicada. Só pode existir um rascunho por checklist.
 */
export async function criarRascunho(checklistId: string): Promise<ResultadoAcao> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: ERRO_SEM_BANCO };

  const analise = z.uuid().safeParse(checklistId);
  if (!analise.success) {
    return { ok: false, erro: "Checklist inválido." };
  }

  const { data: versoes, error: erroVersoes } = await supabase
    .from("checklist_versoes")
    .select("id, numero, status")
    .eq("checklist_id", analise.data);
  if (erroVersoes) {
    return { ok: false, erro: `Erro ao ler versões: ${erroVersoes.message}` };
  }

  if (versoes.some((v) => v.status === "rascunho")) {
    return {
      ok: false,
      erro: "Já existe um rascunho em edição — publique ou continue editando a versão atual.",
    };
  }

  const publicada = versoes
    .filter((v) => v.status === "publicada")
    .sort((a, b) => b.numero - a.numero)[0];
  if (!publicada) {
    return { ok: false, erro: "Não há versão publicada para copiar." };
  }

  const proximoNumero = Math.max(...versoes.map((v) => v.numero)) + 1;
  const { data: rascunho, error: erroRascunho } = await supabase
    .from("checklist_versoes")
    .insert({
      checklist_id: analise.data,
      numero: proximoNumero,
      status: "rascunho",
    })
    .select("id")
    .single();
  if (erroRascunho) {
    return { ok: false, erro: `Erro ao criar rascunho: ${erroRascunho.message}` };
  }

  const { data: itens, error: erroItens } = await supabase
    .from("checklist_itens")
    .select(
      "ordem, codigo, capitulo, pergunta, obrigatorio, fotos_minimas, descricao_minima, referencia_norma, permite_na",
    )
    .eq("versao_id", publicada.id);
  if (erroItens) {
    return { ok: false, erro: `Erro ao copiar itens: ${erroItens.message}` };
  }

  if (itens.length > 0) {
    const { error: erroCopia } = await supabase
      .from("checklist_itens")
      .insert(itens.map((i) => ({ ...i, versao_id: rascunho.id })));
    if (erroCopia) {
      return { ok: false, erro: `Erro ao copiar itens: ${erroCopia.message}` };
    }
  }

  revalidatePath("/painel/checklists");
  return { ok: true, id: rascunho.id };
}

const EsquemaCamposItem = z.object({
  codigo: z.string().trim().min(1, "informe o código do item.").optional(),
  capitulo: z.string().trim().nullable().optional(),
  pergunta: z.string().trim().min(1, "a pergunta não pode ficar vazia.").optional(),
  obrigatorio: z.boolean().optional(),
  fotosMinimas: z.number().int().min(0).max(20).optional(),
  descricaoMinima: z.number().int().min(0).max(2000).optional(),
  referenciaNorma: z
    .string()
    .trim()
    .min(1, "o vínculo com a norma é obrigatório.")
    .optional(),
  permiteNa: z.boolean().optional(),
});

export type CamposItem = z.infer<typeof EsquemaCamposItem>;

function paraColunasItem(campos: CamposItem) {
  return {
    ...(campos.codigo !== undefined && { codigo: campos.codigo }),
    ...(campos.capitulo !== undefined && { capitulo: campos.capitulo }),
    ...(campos.pergunta !== undefined && { pergunta: campos.pergunta }),
    ...(campos.obrigatorio !== undefined && {
      obrigatorio: campos.obrigatorio,
    }),
    ...(campos.fotosMinimas !== undefined && {
      fotos_minimas: campos.fotosMinimas,
    }),
    ...(campos.descricaoMinima !== undefined && {
      descricao_minima: campos.descricaoMinima,
    }),
    ...(campos.referenciaNorma !== undefined && {
      referencia_norma: campos.referenciaNorma,
    }),
    ...(campos.permiteNa !== undefined && { permite_na: campos.permiteNa }),
  };
}

async function statusDaVersao(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  versaoId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("checklist_versoes")
    .select("status")
    .eq("id", versaoId)
    .maybeSingle();
  return data?.status ?? null;
}

/** Atualiza as propriedades de um item — permitido apenas em versão rascunho. */
export async function atualizarItem(
  itemId: string,
  campos: CamposItem,
): Promise<ResultadoAcao> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: ERRO_SEM_BANCO };

  const analiseId = z.uuid().safeParse(itemId);
  if (!analiseId.success) return { ok: false, erro: "Item inválido." };
  const analise = EsquemaCamposItem.safeParse(campos);
  if (!analise.success) return erroDeValidacao(analise);

  const { data: item, error: erroItem } = await supabase
    .from("checklist_itens")
    .select("versao_id")
    .eq("id", analiseId.data)
    .maybeSingle();
  if (erroItem || !item) {
    return { ok: false, erro: "Item não encontrado." };
  }

  if ((await statusDaVersao(supabase, item.versao_id)) !== "rascunho") {
    return {
      ok: false,
      erro: "Somente itens de uma versão em rascunho podem ser editados — crie um rascunho primeiro.",
    };
  }

  const { error } = await supabase
    .from("checklist_itens")
    .update(paraColunasItem(analise.data))
    .eq("id", analiseId.data);
  if (error) {
    return { ok: false, erro: `Erro ao salvar o item: ${error.message}` };
  }

  revalidatePath("/painel/checklists");
  return { ok: true };
}

const EsquemaNovoItem = z.object({
  codigo: z.string().trim().min(1, "informe o código do item."),
  capitulo: z.string().trim().nullable().optional(),
  pergunta: z.string().trim().min(1, "a pergunta não pode ficar vazia."),
  referenciaNorma: z
    .string()
    .trim()
    .min(1, "o vínculo com a norma é obrigatório."),
  obrigatorio: z.boolean().default(true),
  fotosMinimas: z.number().int().min(0).max(20).default(2),
  descricaoMinima: z.number().int().min(0).max(2000).default(100),
  permiteNa: z.boolean().default(true),
});

export type NovoItem = z.input<typeof EsquemaNovoItem>;

/** Adiciona um item ao final de uma versão rascunho. */
export async function adicionarItem(
  versaoId: string,
  dados: NovoItem,
): Promise<ResultadoAcao> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: ERRO_SEM_BANCO };

  const analiseId = z.uuid().safeParse(versaoId);
  if (!analiseId.success) return { ok: false, erro: "Versão inválida." };
  const analise = EsquemaNovoItem.safeParse(dados);
  if (!analise.success) return erroDeValidacao(analise);

  if ((await statusDaVersao(supabase, analiseId.data)) !== "rascunho") {
    return {
      ok: false,
      erro: "Itens só podem ser adicionados a uma versão em rascunho.",
    };
  }

  const { data: ultimo } = await supabase
    .from("checklist_itens")
    .select("ordem")
    .eq("versao_id", analiseId.data)
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle();

  const novo = analise.data;
  const { data: criado, error } = await supabase
    .from("checklist_itens")
    .insert({
      versao_id: analiseId.data,
      ordem: (ultimo?.ordem ?? 0) + 1,
      codigo: novo.codigo,
      capitulo: novo.capitulo ?? null,
      pergunta: novo.pergunta,
      obrigatorio: novo.obrigatorio,
      fotos_minimas: novo.fotosMinimas,
      descricao_minima: novo.descricaoMinima,
      referencia_norma: novo.referenciaNorma,
      permite_na: novo.permiteNa,
    })
    .select("id")
    .single();
  if (error) {
    return { ok: false, erro: `Erro ao adicionar o item: ${error.message}` };
  }

  revalidatePath("/painel/checklists");
  return { ok: true, id: criado.id };
}

/** Remove um item — permitido apenas em versão rascunho. */
export async function removerItem(itemId: string): Promise<ResultadoAcao> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: ERRO_SEM_BANCO };

  const analise = z.uuid().safeParse(itemId);
  if (!analise.success) return { ok: false, erro: "Item inválido." };

  const { data: item } = await supabase
    .from("checklist_itens")
    .select("versao_id")
    .eq("id", analise.data)
    .maybeSingle();
  if (!item) return { ok: false, erro: "Item não encontrado." };

  if ((await statusDaVersao(supabase, item.versao_id)) !== "rascunho") {
    return {
      ok: false,
      erro: "Somente itens de uma versão em rascunho podem ser removidos.",
    };
  }

  const { error } = await supabase
    .from("checklist_itens")
    .delete()
    .eq("id", analise.data);
  if (error) {
    return { ok: false, erro: `Erro ao remover o item: ${error.message}` };
  }

  revalidatePath("/painel/checklists");
  return { ok: true };
}

/**
 * Publica a versão rascunho: a publicada atual é arquivada e o rascunho
 * passa a valer no app. Só a publicação leva as alterações ao uso.
 */
export async function publicarVersao(versaoId: string): Promise<ResultadoAcao> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: ERRO_SEM_BANCO };

  const analise = z.uuid().safeParse(versaoId);
  if (!analise.success) return { ok: false, erro: "Versão inválida." };

  const { data: versao } = await supabase
    .from("checklist_versoes")
    .select("id, checklist_id, status")
    .eq("id", analise.data)
    .maybeSingle();
  if (!versao) return { ok: false, erro: "Versão não encontrada." };
  if (versao.status !== "rascunho") {
    return { ok: false, erro: "Apenas uma versão em rascunho pode ser publicada." };
  }

  const { count } = await supabase
    .from("checklist_itens")
    .select("id", { count: "exact", head: true })
    .eq("versao_id", versao.id);
  if (!count) {
    return { ok: false, erro: "A versão precisa ter ao menos um item para ser publicada." };
  }

  const { error: erroArquivar } = await supabase
    .from("checklist_versoes")
    .update({ status: "arquivada" })
    .eq("checklist_id", versao.checklist_id)
    .eq("status", "publicada");
  if (erroArquivar) {
    return { ok: false, erro: `Erro ao arquivar a versão atual: ${erroArquivar.message}` };
  }

  const usuario = await getUsuarioAtual();
  const { error: erroPublicar } = await supabase
    .from("checklist_versoes")
    .update({
      status: "publicada",
      publicada_em: new Date().toISOString(),
      publicada_por: usuario?.id ?? null,
    })
    .eq("id", versao.id);
  if (erroPublicar) {
    return { ok: false, erro: `Erro ao publicar: ${erroPublicar.message}` };
  }

  revalidatePath("/painel/checklists");
  revalidatePath("/painel/visitas");
  return { ok: true };
}

// ------------------------------------------------------------------
// Execução de visitas
// ------------------------------------------------------------------

const EsquemaNovaVisita = z.object({
  clienteId: z.uuid("selecione o cliente."),
  titulo: z.string().trim().min(3, "informe um título para a visita."),
  origem: z.enum(["campo", "escritorio"]),
});

export type NovaVisita = z.infer<typeof EsquemaNovaVisita>;

/** Inicia uma visita com a versão publicada do checklist. */
export async function iniciarVisita(dados: NovaVisita): Promise<ResultadoAcao> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: ERRO_SEM_BANCO };

  const analise = EsquemaNovaVisita.safeParse(dados);
  if (!analise.success) return erroDeValidacao(analise);

  const { data: publicada, error: erroVersao } = await supabase
    .from("checklist_versoes")
    .select("id")
    .eq("status", "publicada")
    .order("numero", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (erroVersao || !publicada) {
    return {
      ok: false,
      erro: "Não há versão publicada do checklist — publique uma versão antes de iniciar visitas.",
    };
  }

  const usuario = await getUsuarioAtual();
  const { data: visita, error } = await supabase
    .from("visitas")
    .insert({
      cliente_id: analise.data.clienteId,
      versao_checklist_id: publicada.id,
      titulo: analise.data.titulo,
      origem: analise.data.origem,
      responsavel_id: usuario?.id ?? null,
    })
    .select("id")
    .single();
  if (error) {
    return { ok: false, erro: `Erro ao iniciar a visita: ${error.message}` };
  }

  revalidatePath("/painel/visitas");
  return { ok: true, id: visita.id };
}

const EsquemaResposta = z.object({
  visitaId: z.uuid("visita inválida."),
  itemId: z.uuid("item inválido."),
  resposta: z.enum(["conforme", "nao_conforme", "nao_aplicavel"]),
  descricao: z.string().trim().optional(),
});

export type RespostaItem = z.infer<typeof EsquemaResposta>;

/**
 * Registra (ou atualiza) a resposta de um item da visita.
 * NC exige descrição com o mínimo de caracteres do item; a gravação de uma
 * NC dispara a criação automática da CAPA no banco.
 */
export async function responderItem(dados: RespostaItem): Promise<ResultadoAcao> {
  // Auditor externo é somente leitura — recusa antes de qualquer consulta.
  const bloqueio = await exigirEscrita();
  if (bloqueio) return bloqueio;

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: ERRO_SEM_BANCO };

  const analise = EsquemaResposta.safeParse(dados);
  if (!analise.success) return erroDeValidacao(analise);

  const { data: visita } = await supabase
    .from("visitas")
    .select("status")
    .eq("id", analise.data.visitaId)
    .maybeSingle();
  if (!visita) return { ok: false, erro: "Visita não encontrada." };
  if (visita.status !== "em_andamento") {
    return { ok: false, erro: "Esta visita já foi concluída — as respostas estão travadas." };
  }

  const { data: item } = await supabase
    .from("checklist_itens")
    .select("descricao_minima, permite_na")
    .eq("id", analise.data.itemId)
    .maybeSingle();
  if (!item) return { ok: false, erro: "Item do checklist não encontrado." };

  if (analise.data.resposta === "nao_aplicavel" && !item.permite_na) {
    return { ok: false, erro: "Este item não permite a resposta N.A." };
  }

  const validacao = validarDescricaoNc(
    analise.data.resposta,
    analise.data.descricao,
    item.descricao_minima,
  );
  if (!validacao.ok) return { ok: false, erro: validacao.erro };

  const { error } = await supabase.from("visita_respostas").upsert(
    {
      visita_id: analise.data.visitaId,
      item_id: analise.data.itemId,
      resposta: analise.data.resposta,
      descricao:
        analise.data.resposta === "nao_conforme"
          ? (analise.data.descricao ?? null)
          : null,
      respondido_em: new Date().toISOString(),
    },
    { onConflict: "visita_id,item_id" },
  );
  if (error) {
    return { ok: false, erro: `Erro ao gravar a resposta: ${error.message}` };
  }

  revalidatePath(`/painel/visitas/${analise.data.visitaId}`);
  revalidatePath("/painel/visitas");
  return { ok: true };
}

/**
 * Conclui a visita — recusada enquanto houver item obrigatório sem resposta.
 */
export async function concluirVisita(visitaId: string): Promise<ResultadoAcao> {
  // Auditor externo é somente leitura — recusa antes de qualquer consulta.
  const bloqueio = await exigirEscrita();
  if (bloqueio) return bloqueio;

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: ERRO_SEM_BANCO };

  const analise = z.uuid().safeParse(visitaId);
  if (!analise.success) return { ok: false, erro: "Visita inválida." };

  const { data: visita, error: erroVisita } = await supabase
    .from("visitas")
    .select(
      `id, status, cliente_id,
       checklist_versoes ( checklist_itens ( id, codigo, obrigatorio ) ),
       visita_respostas ( item_id )`,
    )
    .eq("id", analise.data)
    .maybeSingle();
  if (erroVisita || !visita) return { ok: false, erro: "Visita não encontrada." };
  if (visita.status !== "em_andamento") {
    return { ok: false, erro: "Esta visita já foi concluída." };
  }

  const linha = visita as unknown as {
    cliente_id: string;
    checklist_versoes: {
      checklist_itens: { id: string; codigo: string; obrigatorio: boolean }[];
    } | null;
    visita_respostas: { item_id: string }[];
  };
  const validacao = validarConclusaoVisita(
    linha.checklist_versoes?.checklist_itens ?? [],
    linha.visita_respostas.map((r) => ({ itemId: r.item_id })),
  );
  if (!validacao.ok) return { ok: false, erro: validacao.erro };

  const { error } = await supabase
    .from("visitas")
    .update({ status: "concluida", concluida_em: new Date().toISOString() })
    .eq("id", analise.data);
  if (error) {
    return { ok: false, erro: `Erro ao concluir a visita: ${error.message}` };
  }

  await atualizarConformidadeCliente(supabase, linha.cliente_id);

  revalidatePath(`/painel/visitas/${analise.data}`);
  revalidatePath("/painel/visitas");
  return { ok: true };
}

/**
 * Conformidade viva: recalcula `clientes.conformidade` como a média
 * arredondada das conformidades de todas as visitas concluídas do cliente.
 * Sem visita com conformidade calculável, o valor do cliente não é alterado.
 * Melhor esforço — uma falha aqui não desfaz a conclusão da visita.
 */
async function atualizarConformidadeCliente(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  clienteId: string,
): Promise<void> {
  const { data: visitas, error } = await supabase
    .from("visitas")
    .select("id, visita_respostas ( resposta )")
    .eq("cliente_id", clienteId)
    .neq("status", "em_andamento");
  if (error || !visitas) return;

  const linhas = visitas as unknown as {
    visita_respostas: { resposta: Resposta }[];
  }[];
  const conformidade = calcularConformidadeCliente(
    linhas.map((v) => ({
      conformidade: calcularConformidade(v.visita_respostas),
    })),
  );
  if (conformidade === null) return;

  await supabase
    .from("clientes")
    .update({ conformidade })
    .eq("id", clienteId);

  revalidatePath(`/painel/clientes/${clienteId}`);
  revalidatePath("/painel");
}
