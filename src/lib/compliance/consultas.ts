import { createClient } from "@/lib/supabase/server";
import {
  ANO_PLANO_DEMO,
  CASOS_DEMO,
  METAS_DEMO,
  QUEIXAS_DEMO,
  RISCOS_DEMO,
} from "./dados-demo";
import type { MetaPlano, RiscoPlano, STATUS_CASO, TIPOS_CASO } from "./validacao";

/**
 * Camada de consulta do módulo Compliance Social.
 * Com o Supabase conectado, lê do banco (RLS garante acesso só à equipe);
 * sem conexão (testes/modo demonstração), serve dados plausíveis da carteira.
 */

export type StatusCaso = (typeof STATUS_CASO)[number];
export type TipoCaso = (typeof TIPOS_CASO)[number];
export type StatusQueixa = "recebida" | "em_analise" | "tratada";

export type CasoRegistro = {
  id: string;
  clienteId: string;
  clienteNome: string;
  tipo: TipoCaso;
  origem: "monitoramento" | "queixa" | "auditoria";
  descricao: string;
  remediacao?: string;
  status: StatusCaso;
  responsavelId?: string;
  criadoEm: string; // ISO
};

export type QueixaRegistro = {
  id: string;
  clienteId: string;
  clienteNome: string;
  mensagem: string;
  anonima: boolean;
  contato?: string;
  status: StatusQueixa;
  casoId?: string;
  casoStatus?: StatusCaso;
  criadoEm: string; // ISO
};

export type PlanoGestaoRegistro = {
  clienteId: string;
  ano: number;
  riscos: RiscoPlano[];
  metas: MetaPlano[];
  observacao?: string;
};

/** Id do cliente Alto da Serra na carga inicial (padrão dos módulos). */
export const CLIENTE_PADRAO_COMPLIANCE =
  "22222222-0000-4000-8000-000000000001";

/** Id do mesmo cliente no modo demonstração (sem banco). */
const CLIENTE_DEMO = "alto-da-serra";
const CLIENTE_DEMO_NOME = "Fazenda Alto da Serra";

// ------------------------------------------------------------------
// Casos sociais (avaliar-e-tratar, cap. 5.1)
// ------------------------------------------------------------------

export async function listarCasos(): Promise<CasoRegistro[]> {
  const supabase = await createClient();
  if (!supabase) {
    return CASOS_DEMO.map((c) => ({
      id: c.id,
      clienteId: CLIENTE_DEMO,
      clienteNome: CLIENTE_DEMO_NOME,
      tipo: c.tipo,
      origem: c.origem,
      descricao: c.descricao,
      remediacao: c.remediacao,
      status: c.status,
      criadoEm: c.criadoEm,
    }));
  }

  const { data, error } = await supabase
    .from("casos_sociais")
    .select(
      "id, cliente_id, tipo, origem, descricao, remediacao, status, responsavel_id, criado_em, clientes ( nome )",
    )
    .order("criado_em", { ascending: false });
  if (error) throw new Error(`Erro ao listar casos: ${error.message}`);

  type Linha = {
    id: string;
    cliente_id: string;
    tipo: TipoCaso;
    origem: "monitoramento" | "queixa" | "auditoria";
    descricao: string;
    remediacao: string | null;
    status: StatusCaso;
    responsavel_id: string | null;
    criado_em: string;
    clientes: { nome: string } | null;
  };

  return (data as unknown as Linha[]).map((c) => ({
    id: c.id,
    clienteId: c.cliente_id,
    clienteNome: c.clientes?.nome ?? "Cliente",
    tipo: c.tipo,
    origem: c.origem,
    descricao: c.descricao,
    remediacao: c.remediacao ?? undefined,
    status: c.status,
    responsavelId: c.responsavel_id ?? undefined,
    criadoEm: c.criado_em,
  }));
}

// ------------------------------------------------------------------
// Queixas (canal 1.5.1)
// ------------------------------------------------------------------

export async function listarQueixas(): Promise<QueixaRegistro[]> {
  const supabase = await createClient();
  if (!supabase) {
    return QUEIXAS_DEMO.map((q) => ({
      id: q.id,
      clienteId: CLIENTE_DEMO,
      clienteNome: CLIENTE_DEMO_NOME,
      mensagem: q.mensagem,
      anonima: q.anonima,
      contato: q.contato,
      status: q.status,
      casoId: q.casoId,
      casoStatus: q.casoId
        ? CASOS_DEMO.find((c) => c.id === q.casoId)?.status
        : undefined,
      criadoEm: q.criadoEm,
    }));
  }

  const { data, error } = await supabase
    .from("queixas")
    .select(
      "id, cliente_id, mensagem, anonima, contato, status, caso_id, criado_em, clientes ( nome ), casos_sociais ( status )",
    )
    .order("criado_em", { ascending: false });
  if (error) throw new Error(`Erro ao listar queixas: ${error.message}`);

  type Linha = {
    id: string;
    cliente_id: string;
    mensagem: string;
    anonima: boolean;
    contato: string | null;
    status: StatusQueixa;
    caso_id: string | null;
    criado_em: string;
    clientes: { nome: string } | null;
    casos_sociais: { status: StatusCaso } | null;
  };

  return (data as unknown as Linha[]).map((q) => ({
    id: q.id,
    clienteId: q.cliente_id,
    clienteNome: q.clientes?.nome ?? "Cliente",
    mensagem: q.mensagem,
    anonima: q.anonima,
    contato: q.contato ?? undefined,
    status: q.status,
    casoId: q.caso_id ?? undefined,
    casoStatus: q.casos_sociais?.status ?? undefined,
    criadoEm: q.criado_em,
  }));
}

// ------------------------------------------------------------------
// Plano de gestão (cap. 1.3)
// ------------------------------------------------------------------

export async function obterPlanoGestao(
  clienteId: string,
  ano: number,
): Promise<PlanoGestaoRegistro | null> {
  const supabase = await createClient();
  if (!supabase) {
    if (clienteId === CLIENTE_DEMO && ano === ANO_PLANO_DEMO) {
      return {
        clienteId,
        ano,
        riscos: RISCOS_DEMO,
        metas: METAS_DEMO,
        observacao:
          "Plano anual elaborado com a família na visita de janeiro.",
      };
    }
    return null;
  }

  const { data, error } = await supabase
    .from("planos_gestao")
    .select("cliente_id, ano, riscos, metas, observacao")
    .eq("cliente_id", clienteId)
    .eq("ano", ano)
    .maybeSingle();
  if (error) throw new Error(`Erro ao obter plano de gestão: ${error.message}`);
  if (!data) return null;

  return {
    clienteId: data.cliente_id,
    ano: data.ano,
    riscos: (data.riscos ?? []) as RiscoPlano[],
    metas: (data.metas ?? []) as MetaPlano[],
    observacao: data.observacao ?? undefined,
  };
}
