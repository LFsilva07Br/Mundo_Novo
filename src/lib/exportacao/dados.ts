import { listarClientes } from "@/lib/carteira/consultas";
import {
  listarImoveisDoCliente,
  listarTalhoes,
  type ImovelDetalhado,
  type PanoramaTalhoes,
} from "@/lib/carteira/imoveis-consultas";
import type { Cliente } from "@/lib/carteira/tipos";
import { listarCapas, type Capa } from "@/lib/certificacao/consultas";
import { listarVisitas, obterVisita } from "@/lib/checklists/consultas";
import type { VisitaDetalhe } from "@/lib/checklists/tipos";
import { listarLotes, type Lote } from "@/lib/comercializacao/consultas";
import {
  listarMoradias,
  listarTrabalhadores,
  listarTreinamentos,
  type MoradiaComMoradores,
  type TrabalhadorRegistro,
  type TreinamentoResumo,
} from "@/lib/social/consultas";
import { listarFichasEpi, type FichaEpiRegistro } from "@/lib/social/epis";
import { createClient } from "@/lib/supabase/server";

/**
 * Exportação completa (portabilidade / backup — LGPD-ready).
 * Reúne, em um único JSON estruturado, tudo o que o sistema guarda sobre
 * um cliente ou sobre a carteira inteira, usando as mesmas camadas de
 * consulta das telas (com fallback de demonstração sem banco).
 */

export type ClienteExportado = {
  cadastro: Cliente;
  imoveis: ImovelDetalhado[];
  talhoesESafras: PanoramaTalhoes;
  visitas: VisitaDetalhe[];
  capas: Capa[];
  social: {
    trabalhadores: TrabalhadorRegistro[];
    moradias: MoradiaComMoradores[];
    treinamentos: TreinamentoResumo[];
    fichasEpi: FichaEpiRegistro[];
  };
  lotesENegociacoes: Lote[];
  tarefas: TarefaExportada[];
};

export type TarefaExportada = {
  id: string;
  titulo: string;
  detalhe: string | null;
  origem: string;
  regra: string | null;
  status: string;
  venceEm: string | null;
  clienteId: string | null;
};

export type ExportacaoCompleta = {
  sistema: "Mundo Novo Café";
  finalidade: string;
  geradoEm: string; // ISO
  escopo: "carteira" | "cliente";
  totalClientes: number;
  clientes: ClienteExportado[];
};

async function listarTarefas(clienteId?: string): Promise<TarefaExportada[]> {
  const supabase = await createClient();
  if (!supabase) return []; // Demonstração: sem tarefas persistidas.

  let consulta = supabase
    .from("tarefas")
    .select("id, titulo, detalhe, origem, regra, status, vence_em, cliente_id")
    .order("vence_em", { ascending: true });
  if (clienteId) consulta = consulta.eq("cliente_id", clienteId);

  const { data, error } = await consulta;
  if (error) throw new Error(`Erro ao exportar tarefas: ${error.message}`);

  type Linha = {
    id: string;
    titulo: string;
    detalhe: string | null;
    origem: string;
    regra: string | null;
    status: string;
    vence_em: string | null;
    cliente_id: string | null;
  };
  return (data as Linha[]).map((linha) => ({
    id: linha.id,
    titulo: linha.titulo,
    detalhe: linha.detalhe,
    origem: linha.origem,
    regra: linha.regra,
    status: linha.status,
    venceEm: linha.vence_em,
    clienteId: linha.cliente_id,
  }));
}

async function exportarCliente(
  cliente: Cliente,
  capas: Capa[],
  lotes: Lote[],
  tarefas: TarefaExportada[],
): Promise<ClienteExportado> {
  const [imoveis, talhoesESafras, resumosVisitas, trabalhadores, moradias, treinamentos, fichasEpi] =
    await Promise.all([
      listarImoveisDoCliente(cliente.id),
      listarTalhoes(cliente.id),
      listarVisitas(cliente.id),
      listarTrabalhadores(cliente.id),
      listarMoradias(cliente.id),
      listarTreinamentos(cliente.id),
      listarFichasEpi(cliente.id),
    ]);

  // Visita completa (itens + respostas) — o resumo não basta para backup.
  const visitas = (
    await Promise.all(resumosVisitas.map((v) => obterVisita(v.id)))
  ).filter((v): v is VisitaDetalhe => v !== null);

  return {
    cadastro: cliente,
    imoveis,
    talhoesESafras,
    visitas,
    // CAPAs vêm com o nome do cliente (não o id) — junção pelo nome.
    capas: capas.filter((c) => c.cliente === cliente.nome),
    social: { trabalhadores, moradias, treinamentos, fichasEpi },
    lotesENegociacoes: lotes.filter((l) => l.clienteId === cliente.id),
    tarefas: tarefas.filter((t) => t.clienteId === cliente.id),
  };
}

/**
 * Monta a exportação da carteira inteira ou de um cliente.
 * Devolve `null` quando o cliente pedido não existe.
 */
export async function montarExportacao(
  clienteId?: string,
): Promise<ExportacaoCompleta | null> {
  const todos = await listarClientes();
  const selecionados = clienteId
    ? todos.filter((c) => c.id === clienteId)
    : todos;
  if (clienteId && selecionados.length === 0) return null;

  const [capas, lotes, tarefas] = await Promise.all([
    listarCapas(),
    listarLotes(),
    listarTarefas(clienteId),
  ]);

  const clientes: ClienteExportado[] = [];
  // Sequencial de propósito: evita estourar conexões com a carteira inteira.
  for (const cliente of selecionados) {
    clientes.push(await exportarCliente(cliente, capas, lotes, tarefas));
  }

  return {
    sistema: "Mundo Novo Café",
    finalidade:
      "Exportação completa para portabilidade e backup (LGPD). Contém dados pessoais — trate com confidencialidade.",
    geradoEm: new Date().toISOString(),
    escopo: clienteId ? "cliente" : "carteira",
    totalClientes: clientes.length,
    clientes,
  };
}

/** Nome do arquivo de download, com a data do dia (AAAA-MM-DD). */
export function nomeArquivoExportacao(hoje: Date, clienteId?: string): string {
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  const escopo = clienteId ? `cliente-${clienteId}` : "carteira-completa";
  return `exportacao-mundo-novo-${escopo}-${ano}-${mes}-${dia}.json`;
}
