import { describe, expect, it } from "vitest";
import type { FeatureCollection } from "geojson";
import {
  converterParaGeoJson,
  descreverResumo,
  resumoGeoJson,
  TAMANHO_MAXIMO_BYTES,
} from "./conversao";

/** KML mínimo (padrão Google Earth/CAR) com 1 polígono nomeado. */
const KML_MINIMO = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Talhão Garagem</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              -46.9931,-18.9331,0 -46.9905,-18.9333,0 -46.9903,-18.9354,0 -46.9931,-18.9331,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`;

const GEOJSON_VALIDO = JSON.stringify({
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Talhão Baixada" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-46.99, -18.93],
            [-46.98, -18.93],
            [-46.98, -18.94],
            [-46.99, -18.93],
          ],
        ],
      },
    },
  ],
});

describe("converterParaGeoJson", () => {
  it("aceita GeoJSON válido (.geojson) e mantém as features", () => {
    const resultado = converterParaGeoJson("talhoes.geojson", GEOJSON_VALIDO);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.geojson.type).toBe("FeatureCollection");
      expect(resultado.geojson.features).toHaveLength(1);
      expect(resultado.geojson.features[0].properties).toEqual({
        name: "Talhão Baixada",
      });
    }
  });

  it("aceita a extensão .json com o mesmo conteúdo", () => {
    const resultado = converterParaGeoJson("talhoes.json", GEOJSON_VALIDO);
    expect(resultado.ok).toBe(true);
  });

  it("converte KML simples em FeatureCollection com o polígono nomeado", () => {
    const resultado = converterParaGeoJson("fazenda.kml", KML_MINIMO);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.geojson.features).toHaveLength(1);
      const feature = resultado.geojson.features[0];
      expect(feature.geometry?.type).toBe("Polygon");
      expect(feature.properties?.name).toBe("Talhão Garagem");
    }
  });

  it("recusa extensão não suportada com mensagem clara", () => {
    const resultado = converterParaGeoJson("fazenda.txt", GEOJSON_VALIDO);
    expect(resultado).toEqual({
      ok: false,
      erro: expect.stringContaining("Formato não suportado"),
    });
  });

  it("recusa JSON quebrado", () => {
    const resultado = converterParaGeoJson("fazenda.geojson", "{isso não é json");
    expect(resultado).toEqual({
      ok: false,
      erro: expect.stringContaining("não é um JSON válido"),
    });
  });

  it("recusa JSON que não é FeatureCollection", () => {
    const resultado = converterParaGeoJson(
      "fazenda.geojson",
      JSON.stringify({ type: "Feature", geometry: null }),
    );
    expect(resultado).toEqual({
      ok: false,
      erro: expect.stringContaining("FeatureCollection"),
    });
  });

  it("recusa FeatureCollection sem nenhuma geometria", () => {
    const resultado = converterParaGeoJson(
      "fazenda.geojson",
      JSON.stringify({ type: "FeatureCollection", features: [] }),
    );
    expect(resultado).toEqual({
      ok: false,
      erro: expect.stringContaining("não contém nenhuma geometria"),
    });
  });

  it("recusa XML que não é KML", () => {
    const resultado = converterParaGeoJson(
      "fazenda.kml",
      "<gpx><trk></trk></gpx>",
    );
    expect(resultado).toEqual({
      ok: false,
      erro: expect.stringContaining("não parece um KML"),
    });
  });

  it("recusa KML ilegível (XML quebrado)", () => {
    const resultado = converterParaGeoJson("fazenda.kml", "<kml><Documen");
    expect(resultado.ok).toBe(false);
  });

  it("recusa arquivo acima de 5 MB antes de tentar converter", () => {
    const gigante = "a".repeat(TAMANHO_MAXIMO_BYTES + 1);
    const resultado = converterParaGeoJson("fazenda.geojson", gigante);
    expect(resultado).toEqual({
      ok: false,
      erro: expect.stringContaining("5 MB"),
    });
  });
});

describe("resumoGeoJson", () => {
  const colecao: FeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Talhão Garagem" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 0],
            ],
          ],
        },
      },
      {
        type: "Feature",
        properties: { nome: "Sede" },
        geometry: { type: "Point", coordinates: [0.5, 0.5] },
      },
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [
            [0, 0],
            [1, 1],
          ],
        },
      },
    ],
  };

  it("conta polígonos, pontos e linhas e coleta os nomes", () => {
    expect(resumoGeoJson(colecao)).toEqual({
      poligonos: 1,
      pontos: 1,
      linhas: 1,
      nomes: ["Talhão Garagem", "Sede"],
    });
  });

  it("descreve o resumo em frase curta para as listas da tela", () => {
    expect(descreverResumo(resumoGeoJson(colecao))).toBe(
      "1 polígono · 1 linha · 1 ponto",
    );
    expect(
      descreverResumo({ poligonos: 2, pontos: 0, linhas: 0, nomes: [] }),
    ).toBe("2 polígonos");
    expect(
      descreverResumo({ poligonos: 0, pontos: 0, linhas: 0, nomes: [] }),
    ).toBe("sem geometrias");
  });
});
