import { createClient } from "@/lib/supabase/server";
import { statusFatura, type ContratoFinanceiro, type Fatura } from "./regras";
import { CONTRATOS_DEMO, FATURAS_DEMO } from "./dados-demo";

/*
 * ============================================================================
 * SCHEMA PROPOSTO — migration 0012 (financeiro da consultoria)
 * ============================================================================
 * O módulo roda em MODO PREPARADO: a interface abaixo já consulta estas
 * tabelas quando existirem; enquanto a migration não é aplicada, serve os
 * dados de demonstração. SQL de referência para o coordenador criar a
 * migration `supabase/migrations/0012_financeiro.sql`:
 *
 *   -- Contratos de mensalidade da consultoria com os clientes da carteira.
 *   create table contratos_financeiros (
 *     id              uuid primary key default gen_random_uuid(),
 *     cliente_id      uuid not null references clientes (id) on delete cascade,
 *     descricao       text not null,
 *     valor_mensal    numeric(12, 2) not null check (valor_mensal > 0),
 *     -- Dia do mês do vencimento; até 28 para existir em todo mês.
 *     dia_vencimento  smallint not null check (dia_vencimento between 1 and 28),
 *     inicio          date not null,
 *     fim             date check (fim is null or fim > inicio),
 *     ativo           boolean not null default true,
 *     criado_em       timestamptz not null default now()
 *   );
 *
 *   -- Faturas (mensalidades) geradas por competência de cada contrato.
 *   create table faturas (
 *     id           uuid primary key default gen_random_uuid(),
 *     contrato_id  uuid not null references contratos_financeiros (id)
 *                  on delete cascade,
 *     -- Competência no formato AAAA-MM (ex.: 2026-08).
 *     competencia  text not null check (competencia ~ '^\d{4}-(0[1-9]|1[0-2])$'),
 *     valor        numeric(12, 2) not null check (valor > 0),
 *     vencimento   date not null,
 *     pago_em      date,
 *     -- Status persistido por conveniência de filtro; a fonte da verdade é
 *     -- a função pura statusFatura(vencimento, pago_em, hoje) em regras.ts.
 *     status       text not null default 'em_aberto'
 *                  check (status in ('em_aberto', 'paga', 'atrasada')),
 *     criado_em    timestamptz not null default now(),
 *     unique (contrato_id, competencia)
 *   );
 *
 *   create index faturas_competencia_idx on faturas (competencia);
 *
 *   -- RLS no padrão do projeto: habilitar nas duas tabelas e liberar
 *   -- select/insert/update apenas para usuários autenticados da equipe
 *   -- (mesmas políticas das demais tabelas internas, ex.: 0008/0010).
 *   alter table contratos_financeiros enable row level security;
 *   alter table faturas enable row level security;
 * ============================================================================
 */

/** Código Postgres de "tabela não existe" — migration ainda não aplicada. */
const TABELA_INEXISTENTE = "42P01";

const SELECT_CONTRATO = `
  id, cliente_id, descricao, valor_mensal, dia_vencimento, inicio, fim, ativo,
  clientes ( nome )
`;

type LinhaContrato = {
  id: string;
  cliente_id: string;
  descricao: string;
  valor_mensal: number | string;
  dia_vencimento: number;
  inicio: string;
  fim: string | null;
  ativo: boolean;
  clientes: { nome: string } | null;
};

const SELECT_FATURA = `
  id, contrato_id, competencia, valor, vencimento, pago_em,
  contratos_financeiros ( cliente_id, clientes ( nome ) )
`;

type LinhaFatura = {
  id: string;
  contrato_id: string;
  competencia: string;
  valor: number | string;
  vencimento: string;
  pago_em: string | null;
  contratos_financeiros: {
    cliente_id: string;
    clientes: { nome: string } | null;
  } | null;
};

function hojeISO(): string {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

function paraContrato(linha: LinhaContrato): ContratoFinanceiro {
  return {
    id: linha.id,
    clienteId: linha.cliente_id,
    clienteNome: linha.clientes?.nome ?? "Cliente",
    descricao: linha.descricao,
    valorMensal: Number(linha.valor_mensal),
    diaVencimento: linha.dia_vencimento,
    inicio: linha.inicio,
    fim: linha.fim ?? undefined,
    ativo: linha.ativo,
  };
}

function paraFatura(linha: LinhaFatura, hoje: string): Fatura {
  const base = {
    id: linha.id,
    contratoId: linha.contrato_id,
    clienteId: linha.contratos_financeiros?.cliente_id ?? "",
    clienteNome: linha.contratos_financeiros?.clientes?.nome ?? "Cliente",
    competencia: linha.competencia,
    valor: Number(linha.valor),
    vencimento: linha.vencimento,
    pagoEm: linha.pago_em ?? undefined,
  };
  return { ...base, status: statusFatura(base, hoje) };
}

/**
 * O financeiro está pronto para gravar? Exige Supabase conectado E a
 * migration financeira aplicada (tabela contratos_financeiros existente).
 */
export async function financeiroPronto(): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;
  const { error } = await supabase
    .from("contratos_financeiros")
    .select("id", { head: true, count: "exact" });
  return !error;
}

/** Contratos de mensalidade com o nome do cliente, em ordem alfabética. */
export async function listarContratosFinanceiros(): Promise<
  ContratoFinanceiro[]
> {
  const supabase = await createClient();
  if (!supabase) return CONTRATOS_DEMO;

  const { data, error } = await supabase
    .from("contratos_financeiros")
    .select(SELECT_CONTRATO);
  if (error) {
    if (error.code === TABELA_INEXISTENTE) return CONTRATOS_DEMO;
    throw new Error(`Erro ao listar contratos financeiros: ${error.message}`);
  }

  return (data as unknown as LinhaContrato[])
    .map(paraContrato)
    .sort((a, b) => a.clienteNome.localeCompare(b.clienteNome, "pt-BR"));
}

/**
 * Faturas com o status calculado pela data de hoje — opcionalmente só as
 * de uma competência (AAAA-MM). Mais recentes primeiro.
 */
export async function listarFaturas(competencia?: string): Promise<Fatura[]> {
  const supabase = await createClient();
  if (!supabase) {
    return FATURAS_DEMO.filter(
      (f) => !competencia || f.competencia === competencia,
    );
  }

  let consulta = supabase.from("faturas").select(SELECT_FATURA);
  if (competencia) consulta = consulta.eq("competencia", competencia);

  const { data, error } = await consulta;
  if (error) {
    if (error.code === TABELA_INEXISTENTE) {
      return FATURAS_DEMO.filter(
        (f) => !competencia || f.competencia === competencia,
      );
    }
    throw new Error(`Erro ao listar faturas: ${error.message}`);
  }

  const hoje = hojeISO();
  return (data as unknown as LinhaFatura[])
    .map((linha) => paraFatura(linha, hoje))
    .sort(
      (a, b) =>
        b.competencia.localeCompare(a.competencia) ||
        a.clienteNome.localeCompare(b.clienteNome, "pt-BR"),
    );
}
