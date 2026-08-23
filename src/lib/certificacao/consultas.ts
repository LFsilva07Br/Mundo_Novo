import { createClient } from "@/lib/supabase/server";
import type { Norma, TipoCliente } from "@/lib/carteira/tipos";
import {
  CAPAS_DEMO,
  WORKFLOW_DEMO,
  type EtapaWorkflow,
} from "./dados-demo";
import { CONTRATOS_PENDENTES_DEMO } from "@/lib/equipe/dados-demo";
import { diasParado, type EtapaProcesso } from "./regras";

/**
 * Camada de consulta das operações de certificação.
 * Com o Supabase conectado, lê do banco (RLS garante acesso só à equipe);
 * sem conexão (testes/modo demonstração), serve os dados locais.
 */

// ---------------------------------------------------------------- tipos

export type ProcessoCertificacao = {
  id: string;
  clienteId: string;
  cliente: string;
  normas: string;
  conformidade?: number;
  etapa: EtapaProcesso;
  observacao?: string;
};

export type MovimentoWorkflow = {
  id: string;
  cliente: string;
  de: EtapaProcesso | null;
  para: EtapaProcesso;
  autor: string | null;
  ocorridoEm: string; // ISO
};

export type StatusContrato = "aguardando_alcada" | "aprovado" | "rejeitado";

export type ContratoAlcada = {
  id: string;
  codigo: string;
  clienteNome: string;
  /** Cliente da carteira, quando o contrato já está vinculado a um cadastro. */
  clienteId: string | null;
  tipo: TipoCliente;
  status: StatusContrato;
  solicitadoPor: string | null;
  solicitadoEm: string; // ISO yyyy-mm-dd
  diasParado: number;
  decididoPor: string | null;
  decididoEm: string | null; // ISO
  /**
   * Campo livre do contrato: guarda o motivo da rejeição e, quando houver,
   * o link do documento assinado (o único lugar do schema para isso).
   */
  observacao: string | null;
};

export type SeveridadeNc = "menor" | "maior" | "critica";
export type StatusCapa =
  | "aberta"
  | "em_correcao"
  | "aguardando_evidencia"
  | "fechada";
export type OrigemRegistro = "campo" | "escritorio";

export type AcaoCapa = {
  id: string;
  ordem: number;
  descricao: string;
  concluida: boolean;
  concluidaEm: string | null;
};

export type Capa = {
  id: string;
  numero: number;
  cliente: string;
  itemCodigo: string | null;
  descricao: string;
  severidade: SeveridadeNc;
  responsavel: string;
  prazo: string | null; // ISO yyyy-mm-dd
  status: StatusCapa;
  origem: OrigemRegistro;
  acoes: AcaoCapa[];
};

export type PerfilAtual = {
  id: string;
  nome: string;
  papel: string;
  alcadaAprovacao: boolean;
};

// ------------------------------------------------- conversões da demo

const ETAPA_DA_DEMO: Record<EtapaWorkflow, EtapaProcesso> = {
  "Auditoria interna": "auditoria_interna",
  "Correção de NCs": "correcao_ncs",
  "Revisão do gestor": "revisao_gestor",
  "Na certificadora": "na_certificadora",
  Aprovado: "aprovado",
};

const NORMA_CURTA: Record<Norma, string> = {
  ra: "RA",
  quatro_c: "4C",
  organico: "Orgânico",
};

const SEVERIDADE_DA_DEMO: Record<string, SeveridadeNc> = {
  Menor: "menor",
  Maior: "maior",
  Crítica: "critica",
};

const STATUS_CAPA_DA_DEMO: Record<string, StatusCapa> = {
  Aberta: "aberta",
  "Em correção": "em_correcao",
  "Aguardando evidência": "aguardando_evidencia",
  Fechada: "fechada",
};

/** Ações de demonstração (espelham a carga inicial do banco na CAPA #131). */
const ACOES_DEMO: Record<number, AcaoCapa[]> = {
  131: [
    { id: "131-1", ordem: 1, descricao: "Instalar sinalização NR-31 no depósito", concluida: false, concluidaEm: null },
    { id: "131-2", ordem: 2, descricao: "Impermeabilizar o piso do depósito", concluida: false, concluidaEm: null },
    { id: "131-3", ordem: 3, descricao: "Instalar trava/cadeado na porta", concluida: true, concluidaEm: "2026-08-20" },
  ],
  130: [
    { id: "130-1", ordem: 1, descricao: "Isolar os disjuntores expostos do barracão", concluida: true, concluidaEm: "2026-08-18" },
  ],
};

// ------------------------------------------------------------ workflow

export async function listarProcessos(): Promise<ProcessoCertificacao[]> {
  const supabase = await createClient();
  if (!supabase) {
    return WORKFLOW_DEMO.map((cartao) => ({
      id: cartao.clienteId,
      clienteId: cartao.clienteId,
      cliente: cartao.cliente,
      normas: cartao.normas,
      conformidade: cartao.conformidade,
      etapa: ETAPA_DA_DEMO[cartao.etapa],
      observacao: cartao.observacao,
    }));
  }

  const { data, error } = await supabase
    .from("processos_certificacao")
    .select(
      "id, etapa, observacao, clientes ( id, nome, conformidade, certificacoes ( norma, principal ) )",
    );
  if (error) throw new Error(`Erro ao listar processos: ${error.message}`);

  type Linha = {
    id: string;
    etapa: EtapaProcesso;
    observacao: string | null;
    clientes: {
      id: string;
      nome: string;
      conformidade: number | null;
      certificacoes: { norma: Norma; principal: boolean }[];
    } | null;
  };

  return (data as unknown as Linha[])
    .filter((linha) => linha.clientes)
    .map((linha) => {
      const cliente = linha.clientes!;
      const normas = [...cliente.certificacoes]
        .sort((a, b) => Number(b.principal) - Number(a.principal))
        .map((c) => NORMA_CURTA[c.norma] ?? c.norma)
        .join(", ");
      return {
        id: linha.id,
        clienteId: cliente.id,
        cliente: cliente.nome,
        normas,
        conformidade: cliente.conformidade ?? undefined,
        etapa: linha.etapa,
        observacao: linha.observacao ?? undefined,
      };
    })
    .sort((a, b) => a.cliente.localeCompare(b.cliente, "pt-BR"));
}

export async function listarMovimentos(limite = 12): Promise<MovimentoWorkflow[]> {
  const supabase = await createClient();
  if (!supabase) return []; // Demonstração: nenhum movimento registrado ainda.

  const { data, error } = await supabase
    .from("movimentos_workflow")
    .select(
      "id, de, para, ocorrido_em, autor:perfis ( nome ), processo:processos_certificacao ( clientes ( nome ) )",
    )
    .order("ocorrido_em", { ascending: false })
    .limit(limite);
  if (error) throw new Error(`Erro ao listar movimentos: ${error.message}`);

  type Linha = {
    id: string;
    de: EtapaProcesso | null;
    para: EtapaProcesso;
    ocorrido_em: string;
    autor: { nome: string } | null;
    processo: { clientes: { nome: string } | null } | null;
  };

  return (data as unknown as Linha[]).map((linha) => ({
    id: linha.id,
    cliente: linha.processo?.clientes?.nome ?? "Cliente removido",
    de: linha.de,
    para: linha.para,
    autor: linha.autor?.nome ?? null,
    ocorridoEm: linha.ocorrido_em,
  }));
}

// ------------------------------------------------------------ contratos

export async function listarContratos(): Promise<ContratoAlcada[]> {
  const supabase = await createClient();
  if (!supabase) {
    return CONTRATOS_PENDENTES_DEMO.map((contrato) => ({
      id: contrato.id,
      codigo: contrato.id,
      clienteNome: contrato.cliente,
      clienteId: contrato.clienteId ?? null,
      tipo:
        contrato.tipo === "Fazenda"
          ? ("fazenda" as const)
          : ("cadeia_suprimentos" as const),
      status: "aguardando_alcada" as const,
      solicitadoPor: contrato.solicitadoPor,
      solicitadoEm: contrato.solicitadoEm,
      diasParado: contrato.diasParado,
      decididoPor: null,
      decididoEm: null,
      observacao: contrato.observacao ?? null,
    }));
  }

  const { data, error } = await supabase
    .from("contratos")
    .select(
      "id, codigo, cliente_nome, cliente_id, tipo, status, solicitado_por, solicitado_em, decidido_em, observacao, decidido:perfis ( nome )",
    )
    .order("solicitado_em", { ascending: true });
  if (error) throw new Error(`Erro ao listar contratos: ${error.message}`);

  type Linha = {
    id: string;
    codigo: string;
    cliente_nome: string;
    cliente_id: string | null;
    tipo: TipoCliente;
    status: StatusContrato;
    solicitado_por: string | null;
    solicitado_em: string;
    decidido_em: string | null;
    observacao: string | null;
    decidido: { nome: string } | null;
  };

  return (data as unknown as Linha[]).map((linha) => ({
    id: linha.id,
    codigo: linha.codigo,
    clienteNome: linha.cliente_nome,
    clienteId: linha.cliente_id,
    tipo: linha.tipo,
    status: linha.status,
    solicitadoPor: linha.solicitado_por,
    solicitadoEm: linha.solicitado_em,
    diasParado:
      linha.status === "aguardando_alcada" ? diasParado(linha.solicitado_em) : 0,
    decididoPor: linha.decidido?.nome ?? null,
    decididoEm: linha.decidido_em,
    observacao: linha.observacao,
  }));
}

export async function obterPerfilAtual(): Promise<PerfilAtual | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("perfis")
    .select("id, nome, papel, alcada_aprovacao")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !data) return null;

  return {
    id: data.id,
    nome: data.nome,
    papel: data.papel,
    alcadaAprovacao: data.alcada_aprovacao,
  };
}

// ---------------------------------------------------------------- CAPAs

export async function listarCapas(): Promise<Capa[]> {
  const supabase = await createClient();
  if (!supabase) {
    return CAPAS_DEMO.map((capa) => ({
      id: String(capa.numero),
      numero: capa.numero,
      cliente: capa.cliente,
      itemCodigo: capa.origem,
      descricao: capa.descricao,
      severidade: SEVERIDADE_DA_DEMO[capa.severidade],
      responsavel: capa.responsavel,
      prazo: capa.prazo ?? null,
      status: STATUS_CAPA_DA_DEMO[capa.status],
      origem:
        capa.origemRegistro === "Campo"
          ? ("campo" as const)
          : ("escritorio" as const),
      acoes: ACOES_DEMO[capa.numero] ?? [],
    }));
  }

  const { data, error } = await supabase
    .from("capas")
    .select(
      "id, numero, item_codigo, descricao, severidade, responsavel, prazo, status, origem, clientes ( nome ), capa_acoes ( id, ordem, descricao, concluida, concluida_em )",
    )
    .order("numero", { ascending: false });
  if (error) throw new Error(`Erro ao listar CAPAs: ${error.message}`);

  type Linha = {
    id: string;
    numero: number;
    item_codigo: string | null;
    descricao: string;
    severidade: SeveridadeNc;
    responsavel: string;
    prazo: string | null;
    status: StatusCapa;
    origem: OrigemRegistro;
    clientes: { nome: string } | null;
    capa_acoes: {
      id: string;
      ordem: number;
      descricao: string;
      concluida: boolean;
      concluida_em: string | null;
    }[];
  };

  return (data as unknown as Linha[]).map((linha) => ({
    id: linha.id,
    numero: linha.numero,
    cliente: linha.clientes?.nome ?? "Cliente removido",
    itemCodigo: linha.item_codigo,
    descricao: linha.descricao,
    severidade: linha.severidade,
    responsavel: linha.responsavel,
    prazo: linha.prazo,
    status: linha.status,
    origem: linha.origem,
    acoes: [...linha.capa_acoes]
      .sort((a, b) => a.ordem - b.ordem)
      .map((acao) => ({
        id: acao.id,
        ordem: acao.ordem,
        descricao: acao.descricao,
        concluida: acao.concluida,
        concluidaEm: acao.concluida_em,
      })),
  }));
}
