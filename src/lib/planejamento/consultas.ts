import { VISITAS_DEMO } from "@/lib/checklists/dados-demo";
import { createClient } from "@/lib/supabase/server";
import { PLANEJAMENTOS_DEMO } from "./dados-demo";
import { vincularRealizadas, type PlanejamentoComStatus } from "./regras";
import type {
  PlanejamentoVisita,
  TipoPlanejamento,
  VisitaConcluida,
} from "./tipos";
import { TIPOS_PLANEJAMENTO } from "./tipos";

/**
 * Camada de consulta do planejamento anual de visitas.
 * Com o Supabase conectado, lê do banco (RLS garante acesso só à equipe);
 * sem conexão (testes/modo demonstração), serve os dados locais.
 */

type LinhaPlanejamento = {
  id: string;
  cliente_id: string;
  ano: number;
  mes_previsto: number;
  tipo: string;
  visita_id: string | null;
  observacao: string | null;
};

function paraPlanejamento(linha: LinhaPlanejamento): PlanejamentoVisita {
  return {
    id: linha.id,
    clienteId: linha.cliente_id,
    ano: linha.ano,
    mesPrevisto: linha.mes_previsto,
    tipo: (TIPOS_PLANEJAMENTO as readonly string[]).includes(linha.tipo)
      ? (linha.tipo as TipoPlanejamento)
      : "outra",
    visitaId: linha.visita_id,
    observacao: linha.observacao,
  };
}

/** Planejamentos cadastrados para o ano. */
export async function listarPlanejamentos(
  ano: number,
): Promise<PlanejamentoVisita[]> {
  const supabase = await createClient();
  if (!supabase) return PLANEJAMENTOS_DEMO.filter((p) => p.ano === ano);

  const { data, error } = await supabase
    .from("planejamento_visitas")
    .select("id, cliente_id, ano, mes_previsto, tipo, visita_id, observacao")
    .eq("ano", ano)
    .order("mes_previsto");
  if (error) {
    throw new Error(`Erro ao listar o planejamento: ${error.message}`);
  }
  return (data as LinhaPlanejamento[]).map(paraPlanejamento);
}

/** Visitas concluídas dentro do ano (para vincular aos planejamentos). */
export async function listarVisitasConcluidasDoAno(
  ano: number,
): Promise<VisitaConcluida[]> {
  const supabase = await createClient();
  if (!supabase) {
    return VISITAS_DEMO.filter(
      (v) =>
        v.status !== "em_andamento" &&
        v.concluidaEm &&
        new Date(v.concluidaEm).getFullYear() === ano,
    ).map((v) => ({
      id: v.id,
      clienteId: v.clienteId,
      concluidaEm: v.concluidaEm as string,
    }));
  }

  const { data, error } = await supabase
    .from("visitas")
    .select("id, cliente_id, concluida_em")
    .eq("status", "concluida")
    .gte("concluida_em", `${ano}-01-01`)
    .lt("concluida_em", `${ano + 1}-01-01`);
  if (error) {
    throw new Error(`Erro ao listar visitas do ano: ${error.message}`);
  }
  return (data as { id: string; cliente_id: string; concluida_em: string }[]).map(
    (v) => ({ id: v.id, clienteId: v.cliente_id, concluidaEm: v.concluida_em }),
  );
}

/**
 * Planejamentos do ano já com o vínculo automático de visitas realizadas.
 * Conectado ao banco, persiste os vínculos novos (melhor esforço — a tela
 * funciona mesmo se a gravação falhar).
 */
export async function planejamentosDoAno(
  ano: number,
): Promise<PlanejamentoComStatus[]> {
  const [planejamentos, visitas] = await Promise.all([
    listarPlanejamentos(ano),
    listarVisitasConcluidasDoAno(ano),
  ]);
  const vinculados = vincularRealizadas(planejamentos, visitas);

  const supabase = await createClient();
  if (supabase) {
    const novosVinculos = vinculados.filter(
      (v, indice) => v.visitaId && !planejamentos[indice].visitaId,
    );
    await Promise.all(
      novosVinculos.map((v) =>
        supabase
          .from("planejamento_visitas")
          .update({ visita_id: v.visitaId })
          .eq("id", v.id),
      ),
    );
  }
  return vinculados;
}
