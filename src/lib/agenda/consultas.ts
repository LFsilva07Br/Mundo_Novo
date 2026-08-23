import { listarClientes } from "@/lib/carteira/consultas";
import { listarPlanejamentos } from "@/lib/planejamento/consultas";
import { createClient } from "@/lib/supabase/server";
import { compromissosDemo } from "./dados-demo";
import { chaveDia, diasDaSemana, somarDias } from "./semana";
import type {
  AgendaSemana,
  Compromisso,
  OrigemTarefa,
  PrevistoMes,
} from "./tipos";

/**
 * Camada de consulta da agenda semanal.
 * Com o Supabase conectado, lê do banco (RLS garante acesso só à equipe);
 * sem conexão (testes/modo demonstração), serve os compromissos locais.
 *
 * As consultas devolvem lista vazia — nunca lançam — porque a agenda é uma
 * tela de leitura: melhor mostrar a semana com menos itens do que quebrar.
 */

const ORIGENS: readonly OrigemTarefa[] = ["data", "evento", "manual"];

type LinhaTarefa = {
  id: string;
  titulo: string;
  detalhe: string | null;
  origem: string;
  regra: string | null;
  vence_em: string | null;
  cliente_id: string | null;
  clientes: { nome: string } | null;
};

function paraCompromissoTarefa(linha: LinhaTarefa): Compromisso {
  const origem = (ORIGENS as readonly string[]).includes(linha.origem)
    ? (linha.origem as OrigemTarefa)
    : "manual";
  return {
    id: linha.id,
    tipo: "tarefa",
    titulo: linha.titulo,
    detalhe: linha.detalhe,
    clienteId: linha.cliente_id,
    clienteNome: linha.clientes?.nome ?? null,
    // `vence_em` é DATE: os 10 primeiros caracteres já são o dia, sem fuso.
    dia: linha.vence_em ? linha.vence_em.slice(0, 10) : null,
    origem,
    regra: linha.regra,
    concluido: false,
    href: linha.cliente_id ? `/painel/clientes/${linha.cliente_id}` : null,
  };
}

/**
 * Todas as tarefas pendentes (com e sem data), das mais próximas de vencer
 * às sem prazo. Alimenta tanto a grade da semana quanto a lista.
 */
export async function listarTarefasPendentes(
  hoje: Date = new Date(),
): Promise<Compromisso[]> {
  const supabase = await createClient();
  if (!supabase) {
    return compromissosDemo(hoje).filter((c) => c.tipo === "tarefa");
  }

  const { data } = await supabase
    .from("tarefas")
    .select(
      "id, titulo, detalhe, origem, regra, vence_em, status, cliente_id, clientes ( nome )",
    )
    .eq("status", "pendente")
    .order("vence_em", { ascending: true, nullsFirst: false });

  return ((data as unknown as LinhaTarefa[]) ?? []).map(paraCompromissoTarefa);
}

type LinhaVisita = {
  id: string;
  titulo: string;
  status: string;
  iniciada_em: string;
  concluida_em: string | null;
  cliente_id: string | null;
  clientes: { nome: string } | null;
};

/**
 * Visitas iniciadas no intervalo [inicio, fim) — as datas entram como
 * meia-noite local e viram instante ISO para bater com o `timestamptz`.
 */
export async function listarVisitasNoIntervalo(
  inicio: Date,
  fim: Date,
  hoje: Date = new Date(),
): Promise<Compromisso[]> {
  const supabase = await createClient();
  if (!supabase) {
    const de = chaveDia(inicio);
    const ate = chaveDia(fim);
    return compromissosDemo(hoje).filter(
      (c) => c.tipo === "visita" && c.dia !== null && c.dia >= de && c.dia < ate,
    );
  }

  const { data } = await supabase
    .from("visitas")
    .select(
      "id, titulo, status, iniciada_em, concluida_em, cliente_id, clientes ( nome )",
    )
    .gte("iniciada_em", inicio.toISOString())
    .lt("iniciada_em", fim.toISOString())
    .order("iniciada_em");

  return ((data as unknown as LinhaVisita[]) ?? []).map((linha) => ({
    id: linha.id,
    tipo: "visita" as const,
    titulo: linha.titulo,
    detalhe: null,
    clienteId: linha.cliente_id,
    clienteNome: linha.clientes?.nome ?? null,
    dia: chaveDia(new Date(linha.iniciada_em)),
    origem: null,
    regra: null,
    concluido: linha.status === "concluida",
    href: `/painel/visitas/${linha.id}`,
  }));
}

/**
 * Planejamento anual previsto para o mês da data de referência. Esses itens
 * não têm dia — só mês —, então a tela os mostra como previsão, fora da grade.
 */
export async function listarPrevistosDoMes(
  referencia: Date,
): Promise<PrevistoMes[]> {
  const ano = referencia.getFullYear();
  const mes = referencia.getMonth() + 1;

  try {
    const [planejamentos, clientes] = await Promise.all([
      listarPlanejamentos(ano),
      listarClientes(),
    ]);
    const nomes = new Map(clientes.map((c) => [c.id, c.nome]));

    return planejamentos
      .filter((p) => p.mesPrevisto === mes)
      .map((p) => ({
        id: p.id,
        clienteId: p.clienteId,
        clienteNome: nomes.get(p.clienteId) ?? "Cliente removido",
        tipo: p.tipo,
        ano: p.ano,
        mes: p.mesPrevisto,
        realizado: Boolean(p.visitaId),
      }))
      .sort((a, b) => a.clienteNome.localeCompare(b.clienteNome, "pt-BR"));
  } catch {
    // Planejamento indisponível não pode derrubar a agenda da semana.
    return [];
  }
}

/**
 * Tudo o que a semana precisa, numa única lista de compromissos: visitas
 * iniciadas na semana, tarefas que vencem na semana, tarefas sem data (que
 * não podem sumir) e o planejamento previsto para o mês exibido.
 */
export async function agendaDaSemana(
  segunda: Date,
  hoje: Date = new Date(),
): Promise<AgendaSemana> {
  const dias = diasDaSemana(segunda);
  const fim = somarDias(dias[0], 7);

  const [tarefas, visitas, previstos] = await Promise.all([
    listarTarefasPendentes(hoje),
    listarVisitasNoIntervalo(dias[0], fim, hoje),
    listarPrevistosDoMes(dias[0]),
  ]);

  const chaves = new Set(dias.map(chaveDia));
  const naSemana = tarefas.filter((t) => t.dia !== null && chaves.has(t.dia));

  return {
    segunda: dias[0],
    dias,
    compromissos: [...visitas, ...naSemana],
    semData: tarefas.filter((t) => t.dia === null),
    previstos,
    tarefas,
  };
}
