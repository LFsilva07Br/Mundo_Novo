import { createClient } from "@/lib/supabase/server";
import type { StatusDocumento, TipoDocumentoImovel } from "./imoveis-esquemas";
import { obterCliente } from "./consultas";
import {
  HISTORICO_SAFRAS_ALTO_DA_SERRA,
  TALHOES_ALTO_DA_SERRA,
} from "./talhoes-demo";

/**
 * Camada de consulta de imóveis rurais e talhões.
 * Com o Supabase conectado, lê do banco (RLS restringe à equipe);
 * sem conexão (testes/modo demonstração), serve os dados da planilha
 * da Fazenda Alto da Serra mapeados de talhoes-demo.
 */

export const SAFRA_ATUAL = "2025/26";
export const SAFRA_ANTERIOR = "2024/25";

/** Ids do cliente Alto da Serra: slug do modo demonstração e uuid do banco. */
const IDS_ALTO_DA_SERRA = new Set([
  "alto-da-serra",
  "22222222-0000-4000-8000-000000000001",
]);

export type DocumentoDoImovel = {
  id: string;
  tipo: TipoDocumentoImovel;
  identificacao?: string;
  venceEm?: string;
  status: StatusDocumento;
  observacao?: string;
};

export type CaptacaoDeAgua = {
  id: string;
  tipoCaptacao: string;
  processo?: string;
  classificacao?: string;
  venceEm?: string;
  status: StatusDocumento;
};

export type ImovelDetalhado = {
  id: string;
  nome: string;
  proprietarios?: string;
  cidade?: string;
  uf?: string;
  car?: string;
  matriculas?: string;
  areaTotalHa: number;
  areaCafeHa: number;
  areaAppHa: number;
  areaReservaHa: number;
  possuiCaptacaoAgua: boolean;
  documentos: DocumentoDoImovel[];
  captacoes: CaptacaoDeAgua[];
};

export type TalhaoDetalhado = {
  id: string;
  imovelId: string;
  imovelNome: string;
  produtor?: string;
  nome: string;
  areaHa: number;
  plantasPorHa?: number;
  espacamento?: string;
  variedade?: string;
  anoPlantio?: number;
  /** Dados da safra atual (2025/26). */
  estadoLavoura?: string;
  previsaoAtualSacas?: number;
  previsaoPodaRenovacao?: string;
  /** Colheita efetiva da safra anterior (2024/25). */
  colheitaAnteriorSacas?: number;
};

export type SafraComparada = {
  safra: string;
  previsaoSacas: number | null;
  colheitaEfetivaSacas: number | null;
  observacao?: string;
};

export type PanoramaTalhoes = {
  talhoes: TalhaoDetalhado[];
  /** Histórico consolidado: soma de previsão × colheita por safra. */
  comparativo: SafraComparada[];
};

// ------------------------------------------------------------------
// Imóveis com documentos e captações
// ------------------------------------------------------------------

type LinhaImovel = {
  id: string;
  nome: string;
  proprietarios: string | null;
  cidade: string | null;
  uf: string | null;
  car: string | null;
  matriculas: string | null;
  area_total_ha: number;
  area_cafe_ha: number;
  area_app_ha: number;
  area_reserva_ha: number;
  possui_captacao_agua: boolean;
  documentos_imovel: {
    id: string;
    tipo: TipoDocumentoImovel;
    identificacao: string | null;
    vence_em: string | null;
    status: StatusDocumento;
    observacao: string | null;
  }[];
  captacoes_agua: {
    id: string;
    tipo_captacao: string;
    processo: string | null;
    classificacao: string | null;
    vence_em: string | null;
    status: StatusDocumento;
  }[];
};

function paraImovel(linha: LinhaImovel): ImovelDetalhado {
  return {
    id: linha.id,
    nome: linha.nome,
    proprietarios: linha.proprietarios ?? undefined,
    cidade: linha.cidade ?? undefined,
    uf: linha.uf ?? undefined,
    car: linha.car ?? undefined,
    matriculas: linha.matriculas ?? undefined,
    areaTotalHa: Number(linha.area_total_ha),
    areaCafeHa: Number(linha.area_cafe_ha),
    areaAppHa: Number(linha.area_app_ha),
    areaReservaHa: Number(linha.area_reserva_ha),
    possuiCaptacaoAgua: linha.possui_captacao_agua,
    documentos: linha.documentos_imovel.map((d) => ({
      id: d.id,
      tipo: d.tipo,
      identificacao: d.identificacao ?? undefined,
      venceEm: d.vence_em ?? undefined,
      status: d.status,
      observacao: d.observacao ?? undefined,
    })),
    captacoes: linha.captacoes_agua.map((c) => ({
      id: c.id,
      tipoCaptacao: c.tipo_captacao,
      processo: c.processo ?? undefined,
      classificacao: c.classificacao ?? undefined,
      venceEm: c.vence_em ?? undefined,
      status: c.status,
    })),
  };
}

async function imoveisDemo(clienteId: string): Promise<ImovelDetalhado[]> {
  const cliente = await obterCliente(clienteId);
  return (cliente?.imoveis ?? []).map((imovel, indice) => ({
    id: `demo-imovel-${indice + 1}`,
    nome: imovel.nome,
    proprietarios: imovel.proprietarios,
    car: imovel.car,
    matriculas: imovel.matriculas,
    areaTotalHa: imovel.areaTotalHa,
    areaCafeHa: imovel.areaCafeHa,
    areaAppHa: imovel.areaAppHa ?? 0,
    areaReservaHa: imovel.areaReservaHa ?? 0,
    possuiCaptacaoAgua: imovel.possuiCaptacaoAgua ?? false,
    documentos: imovel.car
      ? [
          {
            id: `demo-doc-${indice + 1}`,
            tipo: "car" as const,
            identificacao: imovel.car,
            status: "ok" as const,
          },
        ]
      : [],
    captacoes: imovel.possuiCaptacaoAgua
      ? [
          {
            id: `demo-captacao-${indice + 1}`,
            tipoCaptacao: "Captação de água (planilha ambiental)",
            classificacao: "Uso insignificante",
            status: "ok" as const,
          },
        ]
      : [],
  }));
}

export async function listarImoveisDoCliente(
  clienteId: string,
): Promise<ImovelDetalhado[]> {
  const supabase = await createClient();
  if (!supabase) return imoveisDemo(clienteId);

  const { data, error } = await supabase
    .from("imoveis_rurais")
    .select(
      `
      id, nome, proprietarios, cidade, uf, car, matriculas,
      area_total_ha, area_cafe_ha, area_app_ha, area_reserva_ha,
      possui_captacao_agua,
      documentos_imovel ( id, tipo, identificacao, vence_em, status, observacao ),
      captacoes_agua ( id, tipo_captacao, processo, classificacao, vence_em, status )
    `,
    )
    .eq("cliente_id", clienteId)
    .order("nome");
  if (error) throw new Error(`Erro ao listar imóveis: ${error.message}`);

  return (data as unknown as LinhaImovel[]).map(paraImovel);
}

// ------------------------------------------------------------------
// Talhões com safra atual + comparativo consolidado por safra
// ------------------------------------------------------------------

type LinhaTalhao = {
  id: string;
  nome: string;
  area_ha: number;
  plantas_por_ha: number | null;
  espacamento: string | null;
  variedade: string | null;
  ano_plantio: number | null;
  imovel: { id: string; nome: string; proprietarios: string | null };
  talhao_safras: {
    estado_lavoura: string | null;
    previsao_sacas: number | null;
    colheita_efetiva_sacas: number | null;
    previsao_poda_renovacao: string | null;
    safra: { rotulo: string } | null;
  }[];
};

function consolidarComparativo(linhas: LinhaTalhao[]): SafraComparada[] {
  const porSafra = new Map<
    string,
    { previsao: number | null; colheita: number | null }
  >();

  for (const linha of linhas) {
    for (const registro of linha.talhao_safras) {
      const rotulo = registro.safra?.rotulo;
      if (!rotulo) continue;
      const acumulado = porSafra.get(rotulo) ?? {
        previsao: null,
        colheita: null,
      };
      if (registro.previsao_sacas !== null) {
        acumulado.previsao =
          (acumulado.previsao ?? 0) + Number(registro.previsao_sacas);
      }
      if (registro.colheita_efetiva_sacas !== null) {
        acumulado.colheita =
          (acumulado.colheita ?? 0) + Number(registro.colheita_efetiva_sacas);
      }
      porSafra.set(rotulo, acumulado);
    }
  }

  return [...porSafra.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([safra, valores]) => ({
      safra,
      previsaoSacas: valores.previsao,
      colheitaEfetivaSacas: valores.colheita,
      observacao: safra === SAFRA_ATUAL ? "em andamento" : undefined,
    }));
}

function talhoesDemo(clienteId: string): PanoramaTalhoes {
  if (!IDS_ALTO_DA_SERRA.has(clienteId)) {
    return { talhoes: [], comparativo: [] };
  }

  const talhoes: TalhaoDetalhado[] = TALHOES_ALTO_DA_SERRA.map(
    (talhao, indice) => ({
      id: `demo-talhao-${indice + 1}`,
      imovelId: `demo-imovel-${talhao.imovel}`,
      imovelNome: talhao.imovel,
      produtor: talhao.produtor,
      nome: talhao.nome,
      areaHa: talhao.areaHa,
      plantasPorHa: talhao.plantasPorHa,
      espacamento: talhao.espacamento,
      variedade: talhao.variedade,
      anoPlantio: talhao.anoPlantio,
      estadoLavoura: talhao.estadoLavoura,
      previsaoAtualSacas: talhao.previsao2526Sacas,
      previsaoPodaRenovacao: talhao.previsaoPodaRenovacao,
      colheitaAnteriorSacas: talhao.colheita2425Sacas,
    }),
  );

  return {
    talhoes,
    comparativo: HISTORICO_SAFRAS_ALTO_DA_SERRA.map((safra) => ({ ...safra })),
  };
}

export async function listarTalhoes(
  clienteId: string,
): Promise<PanoramaTalhoes> {
  const supabase = await createClient();
  if (!supabase) return talhoesDemo(clienteId);

  const { data, error } = await supabase
    .from("talhoes")
    .select(
      `
      id, nome, area_ha, plantas_por_ha, espacamento, variedade, ano_plantio,
      imovel:imoveis_rurais!inner ( id, nome, proprietarios, cliente_id ),
      talhao_safras (
        estado_lavoura, previsao_sacas, colheita_efetiva_sacas,
        previsao_poda_renovacao, safra:safras ( rotulo )
      )
    `,
    )
    .eq("imovel.cliente_id", clienteId)
    .order("nome");
  if (error) throw new Error(`Erro ao listar talhões: ${error.message}`);

  const linhas = data as unknown as LinhaTalhao[];

  const talhoes: TalhaoDetalhado[] = linhas.map((linha) => {
    const safraAtual = linha.talhao_safras.find(
      (r) => r.safra?.rotulo === SAFRA_ATUAL,
    );
    const safraAnterior = linha.talhao_safras.find(
      (r) => r.safra?.rotulo === SAFRA_ANTERIOR,
    );
    return {
      id: linha.id,
      imovelId: linha.imovel.id,
      imovelNome: linha.imovel.nome,
      produtor: linha.imovel.proprietarios ?? undefined,
      nome: linha.nome,
      areaHa: Number(linha.area_ha),
      plantasPorHa: linha.plantas_por_ha ?? undefined,
      espacamento: linha.espacamento ?? undefined,
      variedade: linha.variedade ?? undefined,
      anoPlantio: linha.ano_plantio ?? undefined,
      estadoLavoura: safraAtual?.estado_lavoura ?? undefined,
      previsaoAtualSacas:
        safraAtual?.previsao_sacas !== null &&
        safraAtual?.previsao_sacas !== undefined
          ? Number(safraAtual.previsao_sacas)
          : undefined,
      previsaoPodaRenovacao: safraAtual?.previsao_poda_renovacao ?? undefined,
      colheitaAnteriorSacas:
        safraAnterior?.colheita_efetiva_sacas !== null &&
        safraAnterior?.colheita_efetiva_sacas !== undefined
          ? Number(safraAnterior.colheita_efetiva_sacas)
          : undefined,
    };
  });

  return { talhoes, comparativo: consolidarComparativo(linhas) };
}

// ------------------------------------------------------------------
// Safras disponíveis (para o lançamento por safra)
// ------------------------------------------------------------------

export async function listarRotulosSafras(): Promise<string[]> {
  const supabase = await createClient();
  if (!supabase) {
    return HISTORICO_SAFRAS_ALTO_DA_SERRA.map((s) => s.safra);
  }

  const { data, error } = await supabase
    .from("safras")
    .select("rotulo")
    .order("rotulo");
  if (error) throw new Error(`Erro ao listar safras: ${error.message}`);

  return data.map((s) => s.rotulo);
}
