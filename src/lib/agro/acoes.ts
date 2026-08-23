"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUsuarioAtual } from "@/lib/supabase/server";
import {
  extensaoDoTipo,
  validarArquivoEvidencia,
} from "@/lib/evidencias/regras";
import {
  esquemaAplicacao,
  esquemaDestinacao,
  esquemaProduto,
  primeiraMensagem,
} from "./esquemas";
import {
  ALERTA_PRODUTO_PROIBIDO,
  ALERTA_SEM_TREINAMENTO,
  avaliarAplicacao,
  TREINAMENTO_DEFENSIVOS,
  treinamentoValidoNaData,
  type ParticipacaoTreinamento,
} from "./regras";

/**
 * Server Actions do módulo Agroquímicos.
 *
 * Política da Fase 10: a aplicação irregular É registrada (o histórico
 * precisa refletir o campo), mas dispara alerta crítico na agenda —
 * tarefa por evento com regra 'agro-proibido' ou 'agro-sem-treinamento' —
 * e devolve aviso vermelho para quem registrou.
 */

export type EstadoAcao =
  | { ok: true; mensagem: string; avisos?: string[] }
  | { ok: false; erro: string }
  | null;

const AVISO_DEMONSTRACAO =
  "Modo demonstração: conecte o banco de dados para gravar as alterações.";

const BUCKET = "evidencias";
const CODIGO_CONFLITO_UNICO = "23505";

function texto(formData: FormData, campo: string): string | undefined {
  const valor = formData.get(campo);
  if (typeof valor !== "string") return undefined;
  const limpo = valor.trim();
  return limpo === "" ? undefined : limpo;
}

// ------------------------------------------------------------------
// Catálogo de produtos
// ------------------------------------------------------------------

export async function cadastrarProduto(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const resultado = esquemaProduto.safeParse({
    nome: texto(formData, "nome"),
    ingredienteAtivo: texto(formData, "ingredienteAtivo"),
    proibidoRa: formData.get("proibidoRa") !== null,
    observacao: texto(formData, "observacao"),
  });
  if (!resultado.success) {
    return { ok: false, erro: primeiraMensagem(resultado.error) };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: AVISO_DEMONSTRACAO };

  const { error } = await supabase.from("produtos_agroquimicos").insert({
    nome: resultado.data.nome,
    ingrediente_ativo: resultado.data.ingredienteAtivo ?? null,
    proibido_ra: resultado.data.proibidoRa,
    observacao: resultado.data.observacao ?? null,
  });
  if (error) {
    if (error.code === CODIGO_CONFLITO_UNICO) {
      return {
        ok: false,
        erro: `O produto ${resultado.data.nome} já está no catálogo.`,
      };
    }
    return { ok: false, erro: `Não foi possível salvar: ${error.message}` };
  }

  revalidatePath("/painel/agro");
  return {
    ok: true,
    mensagem: resultado.data.proibidoRa
      ? `Produto ${resultado.data.nome} cadastrado como PROIBIDO pela RA — aplicações dele gerarão alerta crítico.`
      : `Produto ${resultado.data.nome} cadastrado no catálogo.`,
  };
}

// ------------------------------------------------------------------
// Aplicações de defensivos
// ------------------------------------------------------------------

type Supabase = NonNullable<Awaited<ReturnType<typeof createClient>>>;

/** Cria a tarefa crítica do alerta; conflito de unicidade = já criada hoje. */
async function criarTarefaCritica(
  supabase: Supabase,
  tarefa: {
    clienteId: string;
    regra: "agro-proibido" | "agro-sem-treinamento";
    titulo: string;
    detalhe: string;
  },
): Promise<string | null> {
  const { error } = await supabase.from("tarefas").insert({
    titulo: tarefa.titulo,
    detalhe: tarefa.detalhe,
    cliente_id: tarefa.clienteId,
    origem: "evento",
    regra: tarefa.regra,
    vence_em: new Date().toISOString().slice(0, 10),
  });
  if (error && error.code !== CODIGO_CONFLITO_UNICO) {
    return `Alerta não registrado na agenda: ${error.message}`;
  }
  return null;
}

export async function registrarAplicacao(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const resultado = esquemaAplicacao.safeParse({
    clienteId: texto(formData, "clienteId"),
    talhaoId: texto(formData, "talhaoId"),
    produtoId: texto(formData, "produtoId"),
    dose: texto(formData, "dose"),
    data: texto(formData, "data"),
    aplicadorId: texto(formData, "aplicadorId"),
    equipamento: texto(formData, "equipamento"),
    observacao: texto(formData, "observacao"),
  });
  if (!resultado.success) {
    return { ok: false, erro: primeiraMensagem(resultado.error) };
  }
  const dados = resultado.data;

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: AVISO_DEMONSTRACAO };

  const { data: produto, error: erroProduto } = await supabase
    .from("produtos_agroquimicos")
    .select("id, nome, proibido_ra")
    .eq("id", dados.produtoId)
    .maybeSingle();
  if (erroProduto) {
    return {
      ok: false,
      erro: `Não foi possível buscar o produto: ${erroProduto.message}`,
    };
  }
  if (!produto) return { ok: false, erro: "Produto não encontrado no catálogo." };

  // Situação do treinamento NR-31 do aplicador na data da aplicação.
  let treinamentoValido = false;
  let aplicadorNome: string | undefined;
  if (dados.aplicadorId) {
    const { data: participacoes, error: erroParticipacoes } = await supabase
      .from("treinamento_participacoes")
      .select(
        "realizado_em, vence_em, treinamento:treinamentos!inner ( nome ), trabalhador:trabalhadores!inner ( nome )",
      )
      .eq("treinamento.nome", TREINAMENTO_DEFENSIVOS)
      .eq("trabalhador_id", dados.aplicadorId);
    if (erroParticipacoes) {
      return {
        ok: false,
        erro: `Não foi possível conferir o treinamento do aplicador: ${erroParticipacoes.message}`,
      };
    }
    type Linha = {
      realizado_em: string;
      vence_em: string | null;
      trabalhador: { nome: string };
    };
    const linhas = (participacoes ?? []) as unknown as Linha[];
    aplicadorNome = linhas[0]?.trabalhador.nome;
    const lista: ParticipacaoTreinamento[] = linhas.map((p) => ({
      realizadoEm: p.realizado_em,
      venceEm: p.vence_em,
    }));
    treinamentoValido = treinamentoValidoNaData(lista, dados.data);
    if (!aplicadorNome) {
      const { data: aplicador } = await supabase
        .from("trabalhadores")
        .select("nome")
        .eq("id", dados.aplicadorId)
        .maybeSingle();
      aplicadorNome = aplicador?.nome;
    }
  }

  const usuario = await getUsuarioAtual();
  const { error: erroInsercao } = await supabase
    .from("aplicacoes_defensivos")
    .insert({
      talhao_id: dados.talhaoId,
      produto_id: produto.id,
      produto_nome: produto.nome,
      dose: dados.dose ?? null,
      data: dados.data,
      aplicador_id: dados.aplicadorId ?? null,
      equipamento: dados.equipamento ?? null,
      observacao: dados.observacao ?? null,
      criado_por: usuario?.id ?? null,
    });
  if (erroInsercao) {
    return {
      ok: false,
      erro: `Não foi possível registrar a aplicação: ${erroInsercao.message}`,
    };
  }

  // Registra MAS alerta: aplicação irregular vira tarefa crítica na agenda.
  const alertas = avaliarAplicacao({
    produtoProibido: produto.proibido_ra,
    treinamentoValido,
  });
  const avisos: string[] = [];

  if (produto.proibido_ra) {
    const falha = await criarTarefaCritica(supabase, {
      clienteId: dados.clienteId,
      regra: "agro-proibido",
      titulo: `URGENTE: aplicação de produto proibido pela RA (${produto.nome})`,
      detalhe:
        `O produto ${produto.nome} está na lista de banidos da Rainforest Alliance e foi aplicado em ${dados.data
          .split("-")
          .reverse()
          .join("/")}. ` +
        "Suspenda o uso, isole o estoque e abra o plano de ação com o cliente.",
    });
    avisos.push(
      `${ALERTA_PRODUTO_PROIBIDO}: ${produto.nome} está na lista de banidos da Rainforest Alliance. A aplicação foi registrada e um alerta crítico entrou na agenda.`,
    );
    if (falha) avisos.push(falha);
  }

  if (alertas.includes(ALERTA_SEM_TREINAMENTO)) {
    const quem = aplicadorNome ?? "O aplicador informado";
    const falha = await criarTarefaCritica(supabase, {
      clienteId: dados.clienteId,
      regra: "agro-sem-treinamento",
      titulo: `Aplicador sem treinamento NR-31 válido: ${quem}`,
      detalhe:
        `${quem} aplicou defensivo em ${dados.data.split("-").reverse().join("/")} sem treinamento de Defensivos (NR-31) válido na data. ` +
        "Agende a reciclagem do treinamento antes da próxima aplicação.",
    });
    avisos.push(
      `${ALERTA_SEM_TREINAMENTO}: ${quem} não tinha treinamento de Defensivos (NR-31) válido na data. Um alerta crítico entrou na agenda.`,
    );
    if (falha) avisos.push(falha);
  }

  revalidatePath("/painel/agro");
  revalidatePath("/painel/agenda");
  return {
    ok: true,
    mensagem:
      avisos.length > 0
        ? `Aplicação de ${produto.nome} registrada com pendências de conformidade.`
        : `Aplicação de ${produto.nome} registrada sem pendências.`,
    avisos: avisos.length > 0 ? avisos : undefined,
  };
}

// ------------------------------------------------------------------
// Destinação de embalagens
// ------------------------------------------------------------------

function extrairArquivo(formData: FormData): File | null {
  const arquivo = formData.get("comprovante");
  return arquivo instanceof File && arquivo.size > 0 ? arquivo : null;
}

export async function registrarDestinacao(
  _estadoAnterior: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const resultado = esquemaDestinacao.safeParse({
    clienteId: texto(formData, "clienteId"),
    data: texto(formData, "data"),
    quantidade: texto(formData, "quantidade"),
    descricao: texto(formData, "descricao"),
  });
  if (!resultado.success) {
    return { ok: false, erro: primeiraMensagem(resultado.error) };
  }
  const dados = resultado.data;

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: AVISO_DEMONSTRACAO };

  // Comprovante é opcional; quando vem, sobe para o bucket privado.
  let comprovanteCaminho: string | null = null;
  const arquivo = extrairArquivo(formData);
  if (arquivo) {
    const validacao = validarArquivoEvidencia(arquivo);
    if (!validacao.ok) return { ok: false, erro: validacao.erro };

    comprovanteCaminho = `embalagens/${dados.clienteId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${extensaoDoTipo(arquivo.type)}`;
    const { error: erroUpload } = await supabase.storage
      .from(BUCKET)
      .upload(comprovanteCaminho, arquivo, { contentType: arquivo.type });
    if (erroUpload) {
      return {
        ok: false,
        erro: `Falha ao enviar o comprovante: ${erroUpload.message}`,
      };
    }
  }

  const { error } = await supabase.from("destinacoes_embalagens").insert({
    cliente_id: dados.clienteId,
    data: dados.data,
    quantidade: dados.quantidade ?? null,
    descricao: dados.descricao,
    comprovante_caminho: comprovanteCaminho,
  });
  if (error) {
    // Não deixa arquivo órfão no bucket se o registro falhar.
    if (comprovanteCaminho) {
      await supabase.storage.from(BUCKET).remove([comprovanteCaminho]);
    }
    return { ok: false, erro: `Não foi possível registrar: ${error.message}` };
  }

  revalidatePath("/painel/agro");
  return {
    ok: true,
    mensagem: comprovanteCaminho
      ? "Destinação registrada com comprovante anexado."
      : "Destinação registrada — anexe o comprovante quando o tiver em mãos.",
  };
}
