import { createClient } from "@/lib/supabase/server";
import { PAGAMENTOS_DEMO } from "./dados-demo";
import { totaisPorTipoAno, type TipoPagamentoDs, type TotalAno } from "./regras";

/**
 * Camada de consulta dos pagamentos de sustentabilidade (DS/DI).
 * Com o Supabase conectado, lê do banco (RLS garante acesso só à equipe);
 * sem conexão (testes/modo demonstração), serve os dados locais.
 */

export type PagamentoSustentabilidade = {
  id: string;
  clienteId: string;
  cliente: string;
  tipo: TipoPagamentoDs;
  valor: number;
  data: string; // ISO yyyy-mm-dd
  descricao: string | null;
  comprovanteCaminho: string | null;
};

export async function listarPagamentos(
  clienteId?: string,
): Promise<PagamentoSustentabilidade[]> {
  const supabase = await createClient();
  if (!supabase) {
    return PAGAMENTOS_DEMO.filter(
      (p) => !clienteId || p.clienteId === clienteId,
    ).map((p) => ({
      id: p.id,
      clienteId: p.clienteId,
      cliente: p.cliente,
      tipo: p.tipo,
      valor: p.valor,
      data: p.data,
      descricao: p.descricao,
      comprovanteCaminho: null,
    }));
  }

  let consulta = supabase
    .from("pagamentos_sustentabilidade")
    .select(
      "id, cliente_id, tipo, valor, data, descricao, comprovante_caminho, clientes ( nome )",
    )
    .order("data", { ascending: false });
  if (clienteId) consulta = consulta.eq("cliente_id", clienteId);

  const { data, error } = await consulta;
  if (error) throw new Error(`Erro ao listar pagamentos: ${error.message}`);

  type Linha = {
    id: string;
    cliente_id: string;
    tipo: TipoPagamentoDs;
    valor: number | string;
    data: string;
    descricao: string | null;
    comprovante_caminho: string | null;
    clientes: { nome: string } | null;
  };

  return (data as unknown as Linha[]).map((linha) => ({
    id: linha.id,
    clienteId: linha.cliente_id,
    cliente: linha.clientes?.nome ?? "Cliente removido",
    tipo: linha.tipo,
    valor: Number(linha.valor),
    data: linha.data,
    descricao: linha.descricao,
    comprovanteCaminho: linha.comprovante_caminho,
  }));
}

/** Totais de DS e DI por ano (mais recente primeiro) do cliente ou da carteira. */
export async function totaisPorAno(clienteId?: string): Promise<TotalAno[]> {
  const pagamentos = await listarPagamentos(clienteId);
  return totaisPorTipoAno(pagamentos);
}
