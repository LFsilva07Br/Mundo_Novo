import { describe, expect, it } from "vitest";
import type { ImovelDetalhado } from "@/lib/carteira/imoveis-consultas";
import type { Cliente } from "@/lib/carteira/tipos";
import type { MapaImovel } from "@/lib/mapas/consultas";
import {
  calcularCentroide,
  formatarCentroide,
  montarPacoteEudr,
} from "./dados";

const CLIENTE: Cliente = {
  id: "cliente-teste",
  grupoId: null,
  nome: "Fazenda Teste",
  tipo: "fazenda",
  fase: "ativo",
  produtor: "Maria Souza",
  cidade: "Patrocínio",
  uf: "MG",
  regiao: "Cerrado Mineiro",
  certificacoes: [],
};

function imovel(dados: Partial<ImovelDetalhado>): ImovelDetalhado {
  return {
    id: "im-1",
    nome: "Sede",
    areaTotalHa: 50,
    areaCafeHa: 30,
    areaAppHa: 5,
    areaReservaHa: 10,
    possuiCaptacaoAgua: false,
    documentos: [],
    captacoes: [],
    ...dados,
  };
}

/** Quadrado de 1 grau com o vértice de fechamento repetido (padrão GeoJSON). */
const QUADRADO = {
  type: "Feature" as const,
  properties: { name: "Talhão 1" },
  geometry: {
    type: "Polygon" as const,
    coordinates: [
      [
        [-47, -19],
        [-46, -19],
        [-46, -18],
        [-47, -18],
        [-47, -19],
      ],
    ],
  },
};

const PONTO = {
  type: "Feature" as const,
  properties: { name: "Sede" },
  geometry: { type: "Point" as const, coordinates: [-47, -19] },
};

function mapa(imovelId: string, features: MapaImovel["geojson"]["features"]): MapaImovel {
  return {
    id: `mapa-${imovelId}`,
    imovelId,
    imovelNome: "Sede",
    nome: "Mapa de talhões",
    caminhoArquivo: null,
    geojson: { type: "FeatureCollection", features },
    criadoEm: "2026-01-01T00:00:00.000Z",
  };
}

describe("calcularCentroide", () => {
  it("calcula a média dos vértices descartando o ponto de fechamento", () => {
    const centroide = calcularCentroide([QUADRADO]);
    expect(centroide).toEqual({ latitude: -18.5, longitude: -46.5 });
  });

  it("sem polígonos, devolve null e o formato mostra travessão", () => {
    expect(calcularCentroide([])).toBeNull();
    expect(formatarCentroide(null)).toBe("—");
  });

  it("formata o centroide com 5 casas decimais (lat, long)", () => {
    expect(formatarCentroide({ latitude: -18.5, longitude: -46.5 })).toBe(
      "-18.50000, -46.50000",
    );
  });
});

describe("montarPacoteEudr", () => {
  const imoveis = [
    imovel({
      id: "im-1",
      nome: "Sede",
      proprietarios: "José Silva",
      car: "MG-3164704-TESTE",
    }),
    imovel({ id: "im-2", nome: "Anexo", areaTotalHa: 20, car: undefined }),
  ];
  const mapas = [mapa("im-1", [QUADRADO, PONTO])];

  it("marca a cobertura: imóvel COM polígono e imóvel SEM polígono", () => {
    const pacote = montarPacoteEudr(CLIENTE, imoveis, mapas);

    expect(pacote.totalImoveis).toBe(2);
    expect(pacote.imoveisComPoligono).toBe(1);
    expect(pacote.percentualCobertura).toBe(50);
    expect(pacote.imoveisSemPoligono).toEqual(["Anexo"]);

    const [sede, anexo] = pacote.imoveis;
    expect(sede.temPoligono).toBe(true);
    expect(sede.poligonos).toBe(1);
    expect(anexo.temPoligono).toBe(false);
    expect(anexo.centroide).toBeNull();
  });

  it("calcula o centroide do imóvel com mapa", () => {
    const pacote = montarPacoteEudr(CLIENTE, imoveis, mapas);
    expect(pacote.imoveis[0].centroide).toEqual({
      latitude: -18.5,
      longitude: -46.5,
    });
  });

  it("monta a FeatureCollection consolidada só com polígonos e com as propriedades EUDR", () => {
    const pacote = montarPacoteEudr(CLIENTE, imoveis, mapas);

    expect(pacote.colecao.type).toBe("FeatureCollection");
    // O ponto (sede) fica de fora — só polígonos entram no pacote.
    expect(pacote.colecao.features).toHaveLength(1);

    const feature = pacote.colecao.features[0];
    expect(feature.geometry?.type).toBe("Polygon");
    expect(feature.properties).toMatchObject({
      produtor: "José Silva",
      imovel: "Sede",
      car: "MG-3164704-TESTE",
      area_ha: 50,
    });
    // Propriedade original do mapa preservada.
    expect(feature.properties?.name).toBe("Talhão 1");
  });

  it("sem proprietários no imóvel, o produtor vem do cliente; sem CAR, fica null", () => {
    const pacote = montarPacoteEudr(
      CLIENTE,
      [imovel({ id: "im-2", nome: "Anexo", car: undefined })],
      [mapa("im-2", [QUADRADO])],
    );

    expect(pacote.imoveis[0].produtor).toBe("Maria Souza");
    expect(pacote.imoveis[0].car).toBeNull();
    expect(pacote.colecao.features[0].properties?.car).toBeNull();
  });

  it("cliente sem imóveis tem cobertura zero e coleção vazia", () => {
    const pacote = montarPacoteEudr(CLIENTE, [], []);
    expect(pacote.totalImoveis).toBe(0);
    expect(pacote.percentualCobertura).toBe(0);
    expect(pacote.colecao.features).toEqual([]);
  });

  it("aceita MultiPolygon e junta os vértices no centroide", () => {
    const multi = {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "MultiPolygon" as const,
        coordinates: [
          [
            [
              [-47, -19],
              [-46, -19],
              [-46, -18],
              [-47, -18],
              [-47, -19],
            ],
          ],
          [
            [
              [-45, -17],
              [-44, -17],
              [-44, -16],
              [-45, -16],
              [-45, -17],
            ],
          ],
        ],
      },
    };
    const pacote = montarPacoteEudr(
      CLIENTE,
      [imovel({ id: "im-1", nome: "Sede" })],
      [mapa("im-1", [multi])],
    );

    expect(pacote.imoveis[0].temPoligono).toBe(true);
    expect(pacote.imoveis[0].centroide).toEqual({
      latitude: -17.5,
      longitude: -45.5,
    });
  });
});
