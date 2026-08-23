import { createClient } from "@/lib/supabase/server";
import { CHECKLIST_DEMO, VISITAS_DEMO } from "./dados-demo";
import { calcularConformidade } from "./regras";
import type {
  ChecklistAtual,
  ItemVersao,
  Resposta,
  VersaoChecklist,
  VisitaDetalhe,
  VisitaResumo,
} from "./tipos";

/**
 * Camada de consulta de checklists versionados e visitas.
 * Com o Supabase conectado, lê do banco (RLS garante acesso só à equipe);
 * sem conexão (testes/modo demonstração), serve os dados locais.
 */

const SELECT_ITEM = `
  id, versao_id, ordem, codigo, capitulo, pergunta,
  obrigatorio, fotos_minimas, descricao_minima, referencia_norma, permite_na
`;

type LinhaItem = {
  id: string;
  versao_id: string;
  ordem: number;
  codigo: string;
  capitulo: string | null;
  pergunta: string;
  obrigatorio: boolean;
  fotos_minimas: number;
  descricao_minima: number;
  referencia_norma: string;
  permite_na: boolean;
};

type LinhaVersao = {
  id: string;
  numero: number;
  status: VersaoChecklist["status"];
  publicada_em: string | null;
  checklist_itens: LinhaItem[];
};

function paraItem(linha: LinhaItem): ItemVersao {
  return {
    id: linha.id,
    versaoId: linha.versao_id,
    ordem: linha.ordem,
    codigo: linha.codigo,
    capitulo: linha.capitulo,
    pergunta: linha.pergunta,
    obrigatorio: linha.obrigatorio,
    fotosMinimas: linha.fotos_minimas,
    descricaoMinima: linha.descricao_minima,
    referenciaNorma: linha.referencia_norma,
    permiteNa: linha.permite_na,
  };
}

function paraVersao(linha: LinhaVersao): VersaoChecklist {
  return {
    id: linha.id,
    numero: linha.numero,
    status: linha.status,
    publicadaEm: linha.publicada_em,
    itens: linha.checklist_itens
      .map(paraItem)
      .sort((a, b) => a.ordem - b.ordem),
  };
}

/** Resumo de um checklist cadastrado — para o seletor de normas. */
export type ChecklistResumo = {
  id: string;
  nome: string;
  norma: string;
  versaoNorma: string | null;
};

/** Todos os checklists cadastrados (um por norma), na ordem de criação. */
export async function listarChecklists(): Promise<ChecklistResumo[]> {
  const supabase = await createClient();
  if (!supabase) {
    return [
      {
        id: CHECKLIST_DEMO.id,
        nome: CHECKLIST_DEMO.nome,
        norma: CHECKLIST_DEMO.norma,
        versaoNorma: CHECKLIST_DEMO.versaoNorma,
      },
    ];
  }

  const { data, error } = await supabase
    .from("checklists")
    .select("id, nome, norma, versao_norma")
    .order("criado_em");
  if (error) throw new Error(`Erro ao listar checklists: ${error.message}`);

  return data.map((linha) => ({
    id: linha.id,
    nome: linha.nome,
    norma: linha.norma,
    versaoNorma: linha.versao_norma,
  }));
}

/**
 * Checklist em uso, com a versão publicada e a versão rascunho — quando
 * existir uma em edição. Sem `checklistId`, devolve o primeiro cadastrado
 * (comportamento original); com o id, devolve o checklist daquela norma.
 */
export async function obterChecklistAtual(
  checklistId?: string,
): Promise<ChecklistAtual | null> {
  const supabase = await createClient();
  if (!supabase) return CHECKLIST_DEMO;

  let consulta = supabase
    .from("checklists")
    .select(
      `id, nome, norma, versao_norma,
       checklist_versoes ( id, numero, status, publicada_em,
         checklist_itens ( ${SELECT_ITEM} ) )`,
    );
  if (checklistId) consulta = consulta.eq("id", checklistId);

  const { data, error } = await consulta
    .order("criado_em")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Erro ao obter checklist: ${error.message}`);
  if (!data) return null;

  const versoes = (data.checklist_versoes as unknown as LinhaVersao[]).map(
    paraVersao,
  );
  const publicadas = versoes.filter((v) => v.status === "publicada");
  const rascunhos = versoes.filter((v) => v.status === "rascunho");
  const maisRecente = (a: VersaoChecklist, b: VersaoChecklist) =>
    b.numero - a.numero;

  return {
    id: data.id,
    nome: data.nome,
    norma: data.norma,
    versaoNorma: data.versao_norma,
    publicada: publicadas.sort(maisRecente)[0] ?? null,
    rascunho: rascunhos.sort(maisRecente)[0] ?? null,
  };
}

type LinhaVisitaResumo = {
  id: string;
  titulo: string;
  origem: VisitaResumo["origem"];
  status: VisitaResumo["status"];
  iniciada_em: string;
  concluida_em: string | null;
  clientes: { nome: string } | null;
  checklist_versoes: { checklist_itens: { id: string }[] } | null;
  visita_respostas: { resposta: Resposta }[];
};

function paraResumo(linha: LinhaVisitaResumo): VisitaResumo {
  const respostas = linha.visita_respostas;
  return {
    id: linha.id,
    titulo: linha.titulo,
    clienteNome: linha.clientes?.nome ?? "Cliente removido",
    origem: linha.origem,
    status: linha.status,
    iniciadaEm: linha.iniciada_em,
    concluidaEm: linha.concluida_em,
    totalItens: linha.checklist_versoes?.checklist_itens.length ?? 0,
    respondidos: respostas.length,
    naoConformes: respostas.filter((r) => r.resposta === "nao_conforme")
      .length,
    conformidade:
      linha.status === "em_andamento" ? null : calcularConformidade(respostas),
  };
}

/**
 * Visitas mais recentes primeiro, com o resumo agregado das respostas.
 * Com `clienteId`, devolve apenas as visitas daquele cliente.
 */
export async function listarVisitas(
  clienteId?: string,
): Promise<VisitaResumo[]> {
  const supabase = await createClient();
  if (!supabase) {
    return VISITAS_DEMO.filter(
      (v) => !clienteId || v.clienteId === clienteId,
    ).map((v) =>
      paraResumo({
        id: v.id,
        titulo: v.titulo,
        origem: v.origem,
        status: v.status,
        iniciada_em: v.iniciadaEm,
        concluida_em: v.concluidaEm,
        clientes: { nome: v.clienteNome },
        checklist_versoes: {
          checklist_itens: v.itens.map((i) => ({ id: i.id })),
        },
        visita_respostas: v.respostas.map((r) => ({ resposta: r.resposta })),
      }),
    ).sort((a, b) => b.iniciadaEm.localeCompare(a.iniciadaEm));
  }

  let consulta = supabase
    .from("visitas")
    .select(
      `id, titulo, origem, status, iniciada_em, concluida_em,
       clientes ( nome ),
       checklist_versoes ( checklist_itens ( id ) ),
       visita_respostas ( resposta )`,
    );
  if (clienteId) consulta = consulta.eq("cliente_id", clienteId);

  const { data, error } = await consulta.order("iniciada_em", {
    ascending: false,
  });
  if (error) throw new Error(`Erro ao listar visitas: ${error.message}`);

  return (data as unknown as LinhaVisitaResumo[]).map(paraResumo);
}

type LinhaVisitaDetalhe = {
  id: string;
  titulo: string;
  cliente_id: string;
  origem: VisitaDetalhe["origem"];
  status: VisitaDetalhe["status"];
  iniciada_em: string;
  concluida_em: string | null;
  clientes: { nome: string } | null;
  checklist_versoes: { checklist_itens: LinhaItem[] } | null;
  visita_respostas: {
    item_id: string;
    resposta: Resposta;
    descricao: string | null;
  }[];
};

/** Visita com os itens da versão do checklist usada e as respostas dadas. */
export async function obterVisita(id: string): Promise<VisitaDetalhe | null> {
  const supabase = await createClient();
  if (!supabase) return VISITAS_DEMO.find((v) => v.id === id) ?? null;

  const { data, error } = await supabase
    .from("visitas")
    .select(
      `id, titulo, cliente_id, origem, status, iniciada_em, concluida_em,
       clientes ( nome ),
       checklist_versoes ( checklist_itens ( ${SELECT_ITEM} ) ),
       visita_respostas ( item_id, resposta, descricao )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Erro ao obter visita: ${error.message}`);
  if (!data) return null;

  const linha = data as unknown as LinhaVisitaDetalhe;
  return {
    id: linha.id,
    titulo: linha.titulo,
    clienteId: linha.cliente_id,
    clienteNome: linha.clientes?.nome ?? "Cliente removido",
    origem: linha.origem,
    status: linha.status,
    iniciadaEm: linha.iniciada_em,
    concluidaEm: linha.concluida_em,
    itens: (linha.checklist_versoes?.checklist_itens ?? [])
      .map(paraItem)
      .sort((a, b) => a.ordem - b.ordem),
    respostas: linha.visita_respostas.map((r) => ({
      itemId: r.item_id,
      resposta: r.resposta,
      descricao: r.descricao,
    })),
  };
}
