import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
  Position,
} from "geojson";
import type { ImovelDetalhado } from "@/lib/carteira/imoveis-consultas";
import type { Cliente } from "@/lib/carteira/tipos";
import type { MapaImovel } from "@/lib/mapas/consultas";

/**
 * EUDR — Regulamento (UE) 2023/1115 antidesmatamento.
 * Café exportado à União Europeia exige a geolocalização (polígono) de cada
 * área produtiva. Este módulo monta, com funções puras, o pacote de
 * geolocalização do cliente: por imóvel rural, os polígonos dos mapas já
 * enviados, o centroide calculado e o status de cobertura — pronto para o
 * GeoJSON consolidado (due diligence) e para a declaração em PDF.
 */

/** Coordenada do centro (média dos vértices dos polígonos do imóvel). */
export type Centroide = {
  latitude: number;
  longitude: number;
};

/** Declaração de geolocalização de um imóvel rural. */
export type DeclaracaoImovel = {
  imovelId: string;
  imovelNome: string;
  produtor: string;
  car: string | null;
  areaHa: number;
  /** Imóvel COM polígono (mapa enviado) ou SEM polígono (pendência EUDR). */
  temPoligono: boolean;
  poligonos: number;
  centroide: Centroide | null;
  /** Polígonos do imóvel já com as propriedades exigidas pelo pacote. */
  features: Feature[];
};

/** Pacote EUDR consolidado do cliente. */
export type PacoteEudr = {
  clienteId: string;
  clienteNome: string;
  produtor: string;
  imoveis: DeclaracaoImovel[];
  totalImoveis: number;
  imoveisComPoligono: number;
  /** Percentual (0–100, arredondado) de imóveis com polígono. */
  percentualCobertura: number;
  /** Nomes dos imóveis ainda sem mapa — o aviso da declaração. */
  imoveisSemPoligono: string[];
  /** FeatureCollection consolidada para os sistemas de due diligence. */
  colecao: FeatureCollection;
};

function ehPoligono(
  feature: Feature,
): feature is Feature<Polygon | MultiPolygon> {
  return (
    feature.geometry != null &&
    (feature.geometry.type === "Polygon" ||
      feature.geometry.type === "MultiPolygon")
  );
}

/** Anéis exteriores da geometria, sem o vértice repetido de fechamento. */
function verticesExteriores(geometria: Polygon | MultiPolygon): Position[] {
  const aneis =
    geometria.type === "Polygon"
      ? [geometria.coordinates[0] ?? []]
      : geometria.coordinates.map((poligono) => poligono[0] ?? []);

  const vertices: Position[] = [];
  for (const anel of aneis) {
    for (let i = 0; i < anel.length; i += 1) {
      const ponto = anel[i];
      const primeiro = anel[0];
      // O GeoJSON repete o primeiro vértice no fim do anel — descarta a cópia.
      if (
        i === anel.length - 1 &&
        anel.length > 1 &&
        ponto[0] === primeiro[0] &&
        ponto[1] === primeiro[1]
      ) {
        continue;
      }
      vertices.push(ponto);
    }
  }
  return vertices;
}

/**
 * Centroide dos polígonos: média aritmética dos vértices exteriores.
 * Precisão suficiente para a coordenada de referência da declaração
 * (o polígono completo segue junto no GeoJSON).
 */
export function calcularCentroide(
  features: Feature<Polygon | MultiPolygon>[],
): Centroide | null {
  const vertices = features.flatMap((f) => verticesExteriores(f.geometry));
  if (vertices.length === 0) return null;

  const soma = vertices.reduce(
    (acumulado, [longitude, latitude]) => ({
      longitude: acumulado.longitude + longitude,
      latitude: acumulado.latitude + latitude,
    }),
    { longitude: 0, latitude: 0 },
  );
  return {
    latitude: soma.latitude / vertices.length,
    longitude: soma.longitude / vertices.length,
  };
}

/** Formata o centroide para exibição (lat, long com 5 casas decimais). */
export function formatarCentroide(centroide: Centroide | null): string {
  if (!centroide) return "—";
  return `${centroide.latitude.toFixed(5)}, ${centroide.longitude.toFixed(5)}`;
}

/**
 * Monta o pacote EUDR do cliente: para cada imóvel rural, junta os polígonos
 * dos mapas enviados (GeoJSON), calcula o centroide e marca a cobertura.
 * Função pura — recebe os dados das camadas de consulta.
 */
export function montarPacoteEudr(
  cliente: Cliente,
  imoveis: ImovelDetalhado[],
  mapas: MapaImovel[],
): PacoteEudr {
  const mapasPorImovel = new Map<string, MapaImovel[]>();
  for (const mapa of mapas) {
    const lista = mapasPorImovel.get(mapa.imovelId) ?? [];
    lista.push(mapa);
    mapasPorImovel.set(mapa.imovelId, lista);
  }

  const declaracoes: DeclaracaoImovel[] = imoveis.map((imovel) => {
    const produtor =
      imovel.proprietarios ?? cliente.produtor ?? cliente.nome;
    const poligonos = (mapasPorImovel.get(imovel.id) ?? [])
      .flatMap((mapa) => mapa.geojson.features)
      .filter(ehPoligono);

    const features: Feature[] = poligonos.map((feature) => ({
      ...feature,
      properties: {
        ...(feature.properties ?? {}),
        produtor,
        imovel: imovel.nome,
        car: imovel.car ?? null,
        area_ha: imovel.areaTotalHa,
      },
    }));

    return {
      imovelId: imovel.id,
      imovelNome: imovel.nome,
      produtor,
      car: imovel.car ?? null,
      areaHa: imovel.areaTotalHa,
      temPoligono: poligonos.length > 0,
      poligonos: poligonos.length,
      centroide: calcularCentroide(poligonos),
      features,
    };
  });

  const comPoligono = declaracoes.filter((d) => d.temPoligono);

  return {
    clienteId: cliente.id,
    clienteNome: cliente.nome,
    produtor: cliente.produtor ?? cliente.nome,
    imoveis: declaracoes,
    totalImoveis: declaracoes.length,
    imoveisComPoligono: comPoligono.length,
    percentualCobertura:
      declaracoes.length === 0
        ? 0
        : Math.round((comPoligono.length / declaracoes.length) * 100),
    imoveisSemPoligono: declaracoes
      .filter((d) => !d.temPoligono)
      .map((d) => d.imovelNome),
    colecao: {
      type: "FeatureCollection",
      features: declaracoes.flatMap((d) => d.features),
    },
  };
}
