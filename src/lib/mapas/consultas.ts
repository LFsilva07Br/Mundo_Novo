import type { FeatureCollection } from "geojson";
import { createClient } from "@/lib/supabase/server";

/**
 * Consultas dos mapas das fazendas (tabela `mapas_imovel`).
 * Com o Supabase conectado, lê do banco; em modo demonstração serve um
 * mapa de exemplo com dois talhões em Patrocínio-MG para a ficha demo.
 */

export type MapaImovel = {
  id: string;
  imovelId: string;
  imovelNome: string;
  nome: string;
  caminhoArquivo: string | null;
  geojson: FeatureCollection;
  criadoEm: string;
};

/** Ids do cliente Alto da Serra: slug do modo demonstração e uuid do banco. */
const IDS_ALTO_DA_SERRA = new Set([
  "alto-da-serra",
  "22222222-0000-4000-8000-000000000001",
]);

/** Imóvel demo dono do mapa de exemplo (5º da ficha: Garagem). */
const IMOVEL_DEMO_ID = "demo-imovel-5";
const IMOVEL_DEMO_NOME = "Sítio Alto da Serra (Garagem)";

/** Dois talhões fictícios plausíveis na zona rural de Patrocínio-MG. */
const GEOJSON_DEMO: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Talhão Garagem" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-47.063, -18.882],
            [-47.0605, -18.8822],
            [-47.0603, -18.8842],
            [-47.0628, -18.8845],
            [-47.063, -18.882],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Talhão Baixada" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-47.06, -18.8825],
            [-47.0578, -18.8828],
            [-47.058, -18.8846],
            [-47.0602, -18.8844],
            [-47.06, -18.8825],
          ],
        ],
      },
    },
  ],
};

const MAPA_DEMO: MapaImovel = {
  id: "demo-mapa-1",
  imovelId: IMOVEL_DEMO_ID,
  imovelNome: IMOVEL_DEMO_NOME,
  nome: "Talhões da Garagem (exemplo)",
  caminhoArquivo: null,
  geojson: GEOJSON_DEMO,
  criadoEm: "2026-01-15T09:00:00.000Z",
};

type LinhaMapa = {
  id: string;
  nome: string;
  caminho_arquivo: string | null;
  geojson: FeatureCollection;
  criado_em: string;
  imovel: { id: string; nome: string };
};

function paraMapa(linha: LinhaMapa): MapaImovel {
  return {
    id: linha.id,
    imovelId: linha.imovel.id,
    imovelNome: linha.imovel.nome,
    nome: linha.nome,
    caminhoArquivo: linha.caminho_arquivo,
    geojson: linha.geojson,
    criadoEm: linha.criado_em,
  };
}

const CAMPOS_MAPA = `
  id, nome, caminho_arquivo, geojson, criado_em,
  imovel:imoveis_rurais!inner ( id, nome, cliente_id )
`;

/** Mapas de um imóvel rural específico. */
export async function listarMapasImovel(
  imovelId: string,
): Promise<MapaImovel[]> {
  const supabase = await createClient();
  if (!supabase) {
    return imovelId === IMOVEL_DEMO_ID ? [MAPA_DEMO] : [];
  }

  const { data, error } = await supabase
    .from("mapas_imovel")
    .select(CAMPOS_MAPA)
    .eq("imovel_id", imovelId)
    .order("criado_em");
  if (error) throw new Error(`Erro ao listar mapas do imóvel: ${error.message}`);

  return (data as unknown as LinhaMapa[]).map(paraMapa);
}

/** Todos os mapas dos imóveis de um cliente (para o visor da fazenda). */
export async function listarMapasCliente(
  clienteId: string,
): Promise<MapaImovel[]> {
  const supabase = await createClient();
  if (!supabase) {
    return IDS_ALTO_DA_SERRA.has(clienteId) ? [MAPA_DEMO] : [];
  }

  const { data, error } = await supabase
    .from("mapas_imovel")
    .select(CAMPOS_MAPA)
    .eq("imovel.cliente_id", clienteId)
    .order("criado_em");
  if (error) throw new Error(`Erro ao listar mapas do cliente: ${error.message}`);

  return (data as unknown as LinhaMapa[]).map(paraMapa);
}
