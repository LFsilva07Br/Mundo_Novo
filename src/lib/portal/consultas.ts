import { listarCapas, type Capa } from "@/lib/certificacao/consultas";
import { createClient } from "@/lib/supabase/server";

/**
 * Consultas do Portal do Produtor.
 *
 * Com o Supabase conectado, o RLS (migration 0010) já garante que o produtor
 * enxerga apenas os próprios dados; sem conexão (modo demonstração/testes),
 * os fallbacks servem os dados de demonstração da Fazenda Alto da Serra.
 */

/**
 * CAPAs (pendências) do cliente do portal. Com o banco conectado o RLS já
 * limita a lista às CAPAs do próprio cliente; o filtro pelo nome mantém o
 * comportamento também no modo demonstração.
 */
export async function capasDoProdutor(nomeCliente: string): Promise<Capa[]> {
  const capas = await listarCapas();
  return capas.filter((capa) => capa.cliente === nomeCliente);
}

export type ProximaVisita = {
  titulo: string;
  detalhe: string | null;
  venceEm: string | null; // ISO yyyy-mm-dd
};

/**
 * Próxima visita/tarefa agendada para o cliente (tabela `tarefas`).
 * No modo demonstração devolve null — a tela mostra o aviso correspondente.
 */
export async function proximaVisitaAgendada(
  clienteId: string,
): Promise<ProximaVisita | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("tarefas")
    .select("titulo, detalhe, vence_em")
    .eq("cliente_id", clienteId)
    .eq("status", "pendente")
    .order("vence_em", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;

  const linha = data as {
    titulo: string;
    detalhe: string | null;
    vence_em: string | null;
  };
  return {
    titulo: linha.titulo,
    detalhe: linha.detalhe,
    venceEm: linha.vence_em,
  };
}
