import { createClient } from "@/lib/supabase/server";
import {
  APLICACOES_DEMO,
  DESTINACOES_DEMO,
  PARTICIPACOES_DEFENSIVOS_DEMO,
  PRODUTOS_DEMO,
} from "./dados-demo";
import {
  avaliarAplicacao,
  situacaoTreinamentoNaData,
  TREINAMENTO_DEFENSIVOS,
  type ParticipacaoTreinamento,
  type SituacaoTreinamento,
} from "./regras";

/**
 * Camada de consulta do módulo Agroquímicos.
 * Com o Supabase conectado, lê do banco (RLS restringe à equipe);
 * sem conexão (testes/modo demonstração), serve os dados de demonstração
 * da Fazenda Alto da Serra.
 */

/** Id do cliente Alto da Serra na carga inicial (padrão do módulo agro). */
export const CLIENTE_PADRAO_AGRO = "22222222-0000-4000-8000-000000000001";

/** Ids do cliente Alto da Serra: slug do modo demonstração e uuid do banco. */
const IDS_ALTO_DA_SERRA = new Set(["alto-da-serra", CLIENTE_PADRAO_AGRO]);

export type ProdutoRegistro = {
  id: string;
  nome: string;
  ingredienteAtivo?: string;
  proibidoRa: boolean;
  observacao?: string;
};

export type AplicacaoRegistro = {
  id: string;
  talhaoId: string;
  talhaoNome: string;
  imovelNome: string;
  produtoId?: string;
  produtoNome: string;
  produtoProibido: boolean;
  dose?: string;
  data: string; // ISO
  aplicadorId?: string;
  aplicadorNome?: string;
  /** Situação do treinamento NR-31 (Defensivos) do aplicador NA data da aplicação. */
  treinamentoAplicador: SituacaoTreinamento;
  equipamento?: string;
  observacao?: string;
  /** Alertas de conformidade calculados pelas regras puras. */
  alertas: string[];
};

export type DestinacaoRegistro = {
  id: string;
  data: string; // ISO
  quantidade?: number;
  descricao?: string;
  comprovanteCaminho?: string;
};

function slug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ------------------------------------------------------------------
// Catálogo de produtos
// ------------------------------------------------------------------

function produtosDemo(): ProdutoRegistro[] {
  return PRODUTOS_DEMO.map((p) => ({
    id: slug(p.nome),
    nome: p.nome,
    ingredienteAtivo: p.ingredienteAtivo,
    proibidoRa: p.proibidoRa,
    observacao: p.observacao,
  }));
}

export async function listarProdutos(): Promise<ProdutoRegistro[]> {
  const supabase = await createClient();
  if (!supabase) return produtosDemo();

  const { data, error } = await supabase
    .from("produtos_agroquimicos")
    .select("id, nome, ingrediente_ativo, proibido_ra, observacao")
    .order("nome");
  if (error) throw new Error(`Erro ao listar produtos: ${error.message}`);

  type Linha = {
    id: string;
    nome: string;
    ingrediente_ativo: string | null;
    proibido_ra: boolean;
    observacao: string | null;
  };

  return (data as Linha[]).map((p) => ({
    id: p.id,
    nome: p.nome,
    ingredienteAtivo: p.ingrediente_ativo ?? undefined,
    proibidoRa: p.proibido_ra,
    observacao: p.observacao ?? undefined,
  }));
}

// ------------------------------------------------------------------
// Aplicações de defensivos com situação do treinamento do aplicador
// ------------------------------------------------------------------

function montarAplicacao(
  base: Omit<AplicacaoRegistro, "treinamentoAplicador" | "alertas">,
  participacoes: ParticipacaoTreinamento[],
): AplicacaoRegistro {
  const treinamentoAplicador = situacaoTreinamentoNaData(participacoes, base.data);
  return {
    ...base,
    treinamentoAplicador,
    alertas: avaliarAplicacao({
      produtoProibido: base.produtoProibido,
      treinamentoValido: treinamentoAplicador === "valido",
    }),
  };
}

function aplicacoesDemo(clienteId?: string): AplicacaoRegistro[] {
  if (clienteId && !IDS_ALTO_DA_SERRA.has(clienteId)) return [];

  const produtos = new Map(PRODUTOS_DEMO.map((p) => [p.nome, p]));
  return APLICACOES_DEMO.map((a, indice) => {
    const produto = produtos.get(a.produtoNome);
    return montarAplicacao(
      {
        id: `demo-aplicacao-${indice + 1}`,
        talhaoId: `demo-talhao-${a.talhaoIndice}`,
        talhaoNome: a.talhaoNome,
        imovelNome: a.imovelNome,
        produtoId: produto ? slug(produto.nome) : undefined,
        produtoNome: a.produtoNome,
        produtoProibido: produto?.proibidoRa ?? false,
        dose: a.dose,
        data: a.data,
        aplicadorId: a.aplicadorNome ? slug(a.aplicadorNome) : undefined,
        aplicadorNome: a.aplicadorNome,
        equipamento: a.equipamento,
        observacao: a.observacao,
      },
      a.aplicadorNome
        ? (PARTICIPACOES_DEFENSIVOS_DEMO[a.aplicadorNome] ?? [])
        : [],
    );
  }).sort((a, b) => b.data.localeCompare(a.data));
}

type LinhaAplicacao = {
  id: string;
  produto_id: string | null;
  produto_nome: string;
  dose: string | null;
  data: string;
  equipamento: string | null;
  observacao: string | null;
  talhao: {
    id: string;
    nome: string;
    imovel: { nome: string; cliente_id: string };
  };
  produto: { proibido_ra: boolean } | null;
  aplicador: { id: string; nome: string } | null;
};

/**
 * Participações no treinamento "Defensivos" (NR-31) dos aplicadores
 * informados, agrupadas por trabalhador.
 */
async function participacoesDefensivos(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  aplicadorIds: string[],
): Promise<Map<string, ParticipacaoTreinamento[]>> {
  const porAplicador = new Map<string, ParticipacaoTreinamento[]>();
  if (aplicadorIds.length === 0) return porAplicador;

  const { data, error } = await supabase
    .from("treinamento_participacoes")
    .select(
      "trabalhador_id, realizado_em, vence_em, treinamento:treinamentos!inner ( nome )",
    )
    .eq("treinamento.nome", TREINAMENTO_DEFENSIVOS)
    .in("trabalhador_id", aplicadorIds);
  if (error) {
    throw new Error(
      `Erro ao consultar treinamentos dos aplicadores: ${error.message}`,
    );
  }

  type Linha = {
    trabalhador_id: string;
    realizado_em: string;
    vence_em: string | null;
  };
  for (const linha of (data ?? []) as unknown as Linha[]) {
    const lista = porAplicador.get(linha.trabalhador_id) ?? [];
    lista.push({ realizadoEm: linha.realizado_em, venceEm: linha.vence_em });
    porAplicador.set(linha.trabalhador_id, lista);
  }
  return porAplicador;
}

export async function listarAplicacoes(
  clienteId?: string,
): Promise<AplicacaoRegistro[]> {
  const supabase = await createClient();
  if (!supabase) return aplicacoesDemo(clienteId);

  let consulta = supabase
    .from("aplicacoes_defensivos")
    .select(
      `
      id, produto_id, produto_nome, dose, data, equipamento, observacao,
      talhao:talhoes!inner ( id, nome, imovel:imoveis_rurais!inner ( nome, cliente_id ) ),
      produto:produtos_agroquimicos ( proibido_ra ),
      aplicador:trabalhadores ( id, nome )
    `,
    )
    .order("data", { ascending: false });
  if (clienteId) {
    consulta = consulta.eq("talhao.imovel.cliente_id", clienteId);
  }

  const { data, error } = await consulta;
  if (error) throw new Error(`Erro ao listar aplicações: ${error.message}`);

  const linhas = (data ?? []) as unknown as LinhaAplicacao[];
  const aplicadores = [
    ...new Set(
      linhas
        .map((l) => l.aplicador?.id)
        .filter((id): id is string => id !== undefined),
    ),
  ];
  const participacoes = await participacoesDefensivos(supabase, aplicadores);

  return linhas.map((linha) =>
    montarAplicacao(
      {
        id: linha.id,
        talhaoId: linha.talhao.id,
        talhaoNome: linha.talhao.nome,
        imovelNome: linha.talhao.imovel.nome,
        produtoId: linha.produto_id ?? undefined,
        produtoNome: linha.produto_nome,
        produtoProibido: linha.produto?.proibido_ra ?? false,
        dose: linha.dose ?? undefined,
        data: linha.data,
        aplicadorId: linha.aplicador?.id,
        aplicadorNome: linha.aplicador?.nome,
        equipamento: linha.equipamento ?? undefined,
        observacao: linha.observacao ?? undefined,
      },
      linha.aplicador ? (participacoes.get(linha.aplicador.id) ?? []) : [],
    ),
  );
}

// ------------------------------------------------------------------
// Destinação de embalagens
// ------------------------------------------------------------------

function destinacoesDemo(clienteId: string): DestinacaoRegistro[] {
  if (!IDS_ALTO_DA_SERRA.has(clienteId)) return [];
  return DESTINACOES_DEMO.map((d, indice) => ({
    id: `demo-destinacao-${indice + 1}`,
    data: d.data,
    quantidade: d.quantidade,
    descricao: d.descricao,
    comprovanteCaminho: d.temComprovante
      ? `embalagens/demo/comprovante-${indice + 1}.jpg`
      : undefined,
  }));
}

export async function listarDestinacoes(
  clienteId: string,
): Promise<DestinacaoRegistro[]> {
  const supabase = await createClient();
  if (!supabase) return destinacoesDemo(clienteId);

  const { data, error } = await supabase
    .from("destinacoes_embalagens")
    .select("id, data, quantidade, descricao, comprovante_caminho")
    .eq("cliente_id", clienteId)
    .order("data", { ascending: false });
  if (error) throw new Error(`Erro ao listar destinações: ${error.message}`);

  type Linha = {
    id: string;
    data: string;
    quantidade: number | null;
    descricao: string | null;
    comprovante_caminho: string | null;
  };

  return (data as Linha[]).map((d) => ({
    id: d.id,
    data: d.data,
    quantidade: d.quantidade ?? undefined,
    descricao: d.descricao ?? undefined,
    comprovanteCaminho: d.comprovante_caminho ?? undefined,
  }));
}
