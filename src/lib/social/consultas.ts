import { createClient } from "@/lib/supabase/server";
import {
  EXAMES_POR_CARGO,
  MORADIAS_DEMO,
  TRABALHADORES_DEMO,
  TREINAMENTOS_DEMO,
  vencimentoTreinamento,
  type ExamesCargo,
} from "./dados-demo";

/**
 * Camada de consulta do módulo Social & Colaboradores.
 * Com o Supabase conectado, lê do banco (RLS garante acesso só à equipe);
 * sem conexão (testes/modo demonstração), serve os dados da planilha da cliente.
 */

export type GeneroTrabalhador = "masculino" | "feminino" | "outro";

export type TrabalhadorRegistro = {
  id: string;
  clienteId: string;
  nome: string;
  vinculo: "fixo" | "temporario";
  funcao: string;
  cbo?: string;
  salario?: number;
  admissao?: string; // ISO
  nascimento?: string; // ISO
  genero?: GeneroTrabalhador;
  moradia: boolean;
  alimentacao: boolean;
  transporte: boolean;
  cestaBasica: boolean;
  gratificacoes: boolean;
  insalubridade: boolean;
  periculosidade: boolean;
  funcoesHabilitadas: string[];
  ativo: boolean;
};

export type MoradiaComMoradores = {
  id: string;
  nome: string;
  observacao?: string;
  totalMoradores: number;
  moradores: { id?: string; nome: string; parentesco: string }[];
};

export type TreinamentoResumo = {
  id: string;
  nome: string;
  norma?: string;
  periodicidadeMeses: number;
  /** Colaboradores distintos que já participaram. */
  participantes: number;
  totalTrabalhadores: number;
  /** Data da turma mais recente (ISO). */
  ultimaRealizacao?: string;
  /**
   * Menor vence_em entre a participação mais recente de cada colaborador —
   * se já passou, o treinamento está vencido para alguém da equipe.
   */
  proximoVencimento?: string;
};

/** Id do cliente Alto da Serra na carga inicial (padrão do módulo social). */
export const CLIENTE_PADRAO_SOCIAL = "22222222-0000-4000-8000-000000000001";

function slug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function paraIso(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// ------------------------------------------------------------------
// Trabalhadores
// ------------------------------------------------------------------

type LinhaTrabalhador = {
  id: string;
  cliente_id: string;
  nome: string;
  vinculo: "fixo" | "temporario";
  funcao: string;
  cbo: string | null;
  salario: number | null;
  admissao: string | null;
  nascimento: string | null;
  genero: GeneroTrabalhador | null;
  moradia: boolean;
  alimentacao: boolean;
  transporte: boolean;
  cesta_basica: boolean;
  gratificacoes: boolean;
  insalubridade: boolean;
  periculosidade: boolean;
  funcoes_habilitadas: string[] | null;
  ativo: boolean;
};

function trabalhadoresDemo(clienteId: string): TrabalhadorRegistro[] {
  return TRABALHADORES_DEMO.map((t) => ({
    id: slug(t.nome),
    clienteId,
    nome: t.nome,
    vinculo: "fixo" as const,
    funcao: t.funcao,
    cbo: t.cbo,
    salario: t.salario,
    admissao: t.admissao,
    nascimento: t.nascimento,
    genero: t.genero === "Feminino" ? ("feminino" as const) : ("masculino" as const),
    moradia: t.moradia,
    alimentacao: false,
    transporte: false,
    cestaBasica: false,
    gratificacoes: false,
    insalubridade: t.insalubridade,
    periculosidade: t.periculosidade,
    funcoesHabilitadas: t.funcoesHabilitadas,
    ativo: true,
  }));
}

export async function listarTrabalhadores(
  clienteId: string,
): Promise<TrabalhadorRegistro[]> {
  const supabase = await createClient();
  if (!supabase) return trabalhadoresDemo(clienteId);

  const { data, error } = await supabase
    .from("trabalhadores")
    .select(
      "id, cliente_id, nome, vinculo, funcao, cbo, salario, admissao, nascimento, genero, moradia, alimentacao, transporte, cesta_basica, gratificacoes, insalubridade, periculosidade, funcoes_habilitadas, ativo",
    )
    .eq("cliente_id", clienteId)
    .eq("ativo", true)
    .order("nome");
  if (error) throw new Error(`Erro ao listar trabalhadores: ${error.message}`);

  return (data as LinhaTrabalhador[]).map((t) => ({
    id: t.id,
    clienteId: t.cliente_id,
    nome: t.nome,
    vinculo: t.vinculo,
    funcao: t.funcao,
    cbo: t.cbo ?? undefined,
    salario: t.salario !== null ? Number(t.salario) : undefined,
    admissao: t.admissao ?? undefined,
    nascimento: t.nascimento ?? undefined,
    genero: t.genero ?? undefined,
    moradia: t.moradia,
    alimentacao: t.alimentacao,
    transporte: t.transporte,
    cestaBasica: t.cesta_basica,
    gratificacoes: t.gratificacoes,
    insalubridade: t.insalubridade,
    periculosidade: t.periculosidade,
    funcoesHabilitadas: t.funcoes_habilitadas ?? [],
    ativo: t.ativo,
  }));
}

// ------------------------------------------------------------------
// Moradias
// ------------------------------------------------------------------

function moradiasDemo(): MoradiaComMoradores[] {
  return MORADIAS_DEMO.map((m) => ({
    id: slug(m.casa),
    nome: m.casa,
    totalMoradores: m.totalMoradores,
    moradores: m.moradores,
  }));
}

export async function listarMoradias(
  clienteId: string,
): Promise<MoradiaComMoradores[]> {
  const supabase = await createClient();
  if (!supabase) return moradiasDemo();

  const { data, error } = await supabase
    .from("moradias")
    .select("id, nome, observacao, moradores ( id, nome, parentesco )")
    .eq("cliente_id", clienteId)
    .order("nome");
  if (error) throw new Error(`Erro ao listar moradias: ${error.message}`);

  type Linha = {
    id: string;
    nome: string;
    observacao: string | null;
    moradores: { id: string; nome: string; parentesco: string }[];
  };

  return (data as Linha[]).map((m) => ({
    id: m.id,
    nome: m.nome,
    observacao: m.observacao ?? undefined,
    totalMoradores: m.moradores.length,
    moradores: m.moradores,
  }));
}

// ------------------------------------------------------------------
// Treinamentos com participações agregadas
// ------------------------------------------------------------------

function treinamentosDemo(): TreinamentoResumo[] {
  return TREINAMENTOS_DEMO.map((t) => {
    const vencimento = vencimentoTreinamento(t);
    return {
      id: slug(t.nome),
      nome: t.nome,
      periodicidadeMeses: t.periodicidadeMeses,
      participantes: t.participantes,
      totalTrabalhadores: t.totalTrabalhadores,
      ultimaRealizacao: t.ultimaRealizacao,
      proximoVencimento: vencimento ? paraIso(vencimento) : undefined,
    };
  });
}

export async function listarTreinamentos(
  clienteId: string,
): Promise<TreinamentoResumo[]> {
  const supabase = await createClient();
  if (!supabase) return treinamentosDemo();

  const [treinamentos, trabalhadores] = await Promise.all([
    supabase
      .from("treinamentos")
      .select(
        "id, nome, norma, periodicidade_meses, treinamento_participacoes ( trabalhador_id, realizado_em, vence_em )",
      )
      .order("nome"),
    supabase
      .from("trabalhadores")
      .select("id")
      .eq("cliente_id", clienteId)
      .eq("ativo", true),
  ]);
  if (treinamentos.error) {
    throw new Error(`Erro ao listar treinamentos: ${treinamentos.error.message}`);
  }
  if (trabalhadores.error) {
    throw new Error(
      `Erro ao contar trabalhadores: ${trabalhadores.error.message}`,
    );
  }

  const equipe = new Set(trabalhadores.data.map((t) => t.id as string));

  type Linha = {
    id: string;
    nome: string;
    norma: string | null;
    periodicidade_meses: number;
    treinamento_participacoes: {
      trabalhador_id: string;
      realizado_em: string;
      vence_em: string | null;
    }[];
  };

  return (treinamentos.data as Linha[]).map((t) => {
    const participacoes = t.treinamento_participacoes.filter((p) =>
      equipe.has(p.trabalhador_id),
    );

    // Participação mais recente de cada colaborador.
    const maisRecentePorTrabalhador = new Map<
      string,
      { realizado_em: string; vence_em: string | null }
    >();
    for (const p of participacoes) {
      const atual = maisRecentePorTrabalhador.get(p.trabalhador_id);
      if (!atual || p.realizado_em > atual.realizado_em) {
        maisRecentePorTrabalhador.set(p.trabalhador_id, p);
      }
    }

    const vencimentos = [...maisRecentePorTrabalhador.values()]
      .map((p) => p.vence_em)
      .filter((v): v is string => v !== null)
      .sort();
    const realizacoes = participacoes.map((p) => p.realizado_em).sort();

    return {
      id: t.id,
      nome: t.nome,
      norma: t.norma ?? undefined,
      periodicidadeMeses: t.periodicidade_meses,
      participantes: maisRecentePorTrabalhador.size,
      totalTrabalhadores: equipe.size,
      ultimaRealizacao: realizacoes.at(-1),
      proximoVencimento: vencimentos[0],
    };
  });
}

// ------------------------------------------------------------------
// Exames por cargo
// ------------------------------------------------------------------

export async function listarExamesCargo(): Promise<ExamesCargo[]> {
  const supabase = await createClient();
  if (!supabase) return EXAMES_POR_CARGO;

  const { data, error } = await supabase
    .from("exames_cargo")
    .select("cargo, exame, periodicidade")
    .order("cargo")
    .order("id");
  if (error) throw new Error(`Erro ao listar exames: ${error.message}`);

  const porCargo = new Map<string, ExamesCargo>();
  for (const linha of data as {
    cargo: string;
    exame: string;
    periodicidade: string;
  }[]) {
    const grupo = porCargo.get(linha.cargo) ?? {
      cargo: linha.cargo,
      periodicidade: linha.periodicidade,
      exames: [],
    };
    grupo.exames.push(linha.exame);
    porCargo.set(linha.cargo, grupo);
  }
  return [...porCargo.values()];
}
