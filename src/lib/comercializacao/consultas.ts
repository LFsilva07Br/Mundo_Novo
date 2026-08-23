import { createClient } from "@/lib/supabase/server";
import { HISTORICO_SAFRAS_ALTO_DA_SERRA } from "@/lib/carteira/talhoes-demo";
import {
  melhorPreco,
  sacasFechadas,
  saldoDisponivel,
  ultimoPreco,
  type StatusLote,
  type StatusNegociacao,
} from "./regras";
import { LOTES_DEMO, NEGOCIACOES_DEMO } from "./dados-demo";

/**
 * Camada de consulta da comercialização de café.
 * Com o Supabase conectado, lê do banco (RLS restringe à equipe);
 * sem conexão (testes/modo demonstração), serve os lotes de exemplo
 * da Fazenda Alto da Serra.
 */

export type Negociacao = {
  id: string;
  loteId: string;
  loteIdentificacao?: string;
  comprador: string;
  sacas: number;
  precoPorSaca: number;
  /** Data da negociação (AAAA-MM-DD). */
  data: string;
  contrato?: string;
  status: StatusNegociacao;
  observacao?: string;
};

/** Lote como está no cadastro, sem os agregados de negociação. */
export type LoteBase = {
  id: string;
  clienteId: string;
  clienteNome: string;
  safraId: string | null;
  safraRotulo: string | null;
  identificacao: string;
  sacas: number;
  origemTalhoes?: string;
  peneira?: string;
  bebida?: string;
  status: StatusLote;
  observacao?: string;
};

/** Lote com as negociações e os agregados prontos para a tela. */
export type Lote = LoteBase & {
  negociacoes: Negociacao[];
  /** Sacas comprometidas em negociações fechadas. */
  sacasNegociadas: number;
  /** Sacas do lote − sacas negociadas (fechadas). */
  saldoDisponivel: number;
  /** Melhor preço por saca entre as negociações ativas. */
  melhorPreco: number | null;
  /** Preço da negociação ativa mais recente. */
  ultimoPreco: number | null;
};

export type OpcaoSafra = { id: string; rotulo: string };

const SELECT_LOTE = `
  id, cliente_id, safra_id, identificacao, sacas, origem_talhoes,
  peneira, bebida, status, observacao,
  clientes ( nome ),
  safras ( rotulo ),
  negociacoes ( id, comprador, sacas, preco_por_saca, data, contrato, status, observacao )
`;

type LinhaNegociacao = {
  id: string;
  comprador: string;
  sacas: number | string;
  preco_por_saca: number | string;
  data: string;
  contrato: string | null;
  status: StatusNegociacao;
  observacao: string | null;
};

type LinhaLote = {
  id: string;
  cliente_id: string;
  safra_id: string | null;
  identificacao: string;
  sacas: number | string;
  origem_talhoes: string | null;
  peneira: string | null;
  bebida: string | null;
  status: StatusLote;
  observacao: string | null;
  clientes: { nome: string } | null;
  safras: { rotulo: string } | null;
  negociacoes: LinhaNegociacao[];
};

function paraNegociacao(
  linha: LinhaNegociacao,
  loteId: string,
  loteIdentificacao?: string,
): Negociacao {
  return {
    id: linha.id,
    loteId,
    loteIdentificacao,
    comprador: linha.comprador,
    sacas: Number(linha.sacas),
    precoPorSaca: Number(linha.preco_por_saca),
    data: linha.data,
    contrato: linha.contrato ?? undefined,
    status: linha.status,
    observacao: linha.observacao ?? undefined,
  };
}

/** Junta o lote às suas negociações e calcula os agregados da tela. */
export function montarLote(base: LoteBase, negociacoes: Negociacao[]): Lote {
  const ordenadas = [...negociacoes].sort((a, b) =>
    b.data.localeCompare(a.data),
  );
  return {
    ...base,
    negociacoes: ordenadas,
    sacasNegociadas: sacasFechadas(ordenadas),
    saldoDisponivel: saldoDisponivel(base.sacas, ordenadas),
    melhorPreco: melhorPreco(ordenadas),
    ultimoPreco: ultimoPreco(ordenadas),
  };
}

function paraLote(linha: LinhaLote): Lote {
  const base: LoteBase = {
    id: linha.id,
    clienteId: linha.cliente_id,
    clienteNome: linha.clientes?.nome ?? "Cliente",
    safraId: linha.safra_id,
    safraRotulo: linha.safras?.rotulo ?? null,
    identificacao: linha.identificacao,
    sacas: Number(linha.sacas),
    origemTalhoes: linha.origem_talhoes ?? undefined,
    peneira: linha.peneira ?? undefined,
    bebida: linha.bebida ?? undefined,
    status: linha.status,
    observacao: linha.observacao ?? undefined,
  };
  return montarLote(
    base,
    linha.negociacoes.map((n) =>
      paraNegociacao(n, linha.id, linha.identificacao),
    ),
  );
}

/** Lotes com cliente, safra e negociações — mais recentes primeiro. */
export async function listarLotes(): Promise<Lote[]> {
  const supabase = await createClient();

  const lotes = !supabase
    ? LOTES_DEMO.map((base) =>
        montarLote(
          base,
          NEGOCIACOES_DEMO.filter((n) => n.loteId === base.id),
        ),
      )
    : await (async () => {
        const { data, error } = await supabase
          .from("lotes")
          .select(SELECT_LOTE);
        if (error) throw new Error(`Erro ao listar lotes: ${error.message}`);
        return (data as unknown as LinhaLote[]).map(paraLote);
      })();

  return lotes.sort((a, b) =>
    b.identificacao.localeCompare(a.identificacao, "pt-BR"),
  );
}

/** Negociações (opcionalmente de um lote), mais recentes primeiro. */
export async function listarNegociacoes(loteId?: string): Promise<Negociacao[]> {
  const supabase = await createClient();
  if (!supabase) {
    return NEGOCIACOES_DEMO.filter(
      (n) => !loteId || n.loteId === loteId,
    ).sort((a, b) => b.data.localeCompare(a.data));
  }

  let consulta = supabase
    .from("negociacoes")
    .select(
      "id, lote_id, comprador, sacas, preco_por_saca, data, contrato, status, observacao, lotes ( identificacao )",
    )
    .order("data", { ascending: false });
  if (loteId) consulta = consulta.eq("lote_id", loteId);

  const { data, error } = await consulta;
  if (error) throw new Error(`Erro ao listar negociações: ${error.message}`);

  type Linha = LinhaNegociacao & {
    lote_id: string;
    lotes: { identificacao: string } | null;
  };
  return (data as unknown as Linha[]).map((linha) =>
    paraNegociacao(linha, linha.lote_id, linha.lotes?.identificacao),
  );
}

/** Safras para o seletor do formulário de lote. */
export async function listarSafras(): Promise<OpcaoSafra[]> {
  const supabase = await createClient();
  if (!supabase) {
    return HISTORICO_SAFRAS_ALTO_DA_SERRA.map((s) => ({
      id: `safra-${s.safra.replace("/", "-")}`,
      rotulo: s.safra,
    }));
  }

  const { data, error } = await supabase
    .from("safras")
    .select("id, rotulo")
    .order("rotulo");
  if (error) throw new Error(`Erro ao listar safras: ${error.message}`);

  return data.map((s) => ({ id: s.id, rotulo: s.rotulo }));
}
