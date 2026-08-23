import { kml } from "@tmcw/togeojson";
import { DOMParser } from "@xmldom/xmldom";
import type { Feature, FeatureCollection, Geometry } from "geojson";

/**
 * Conversão de arquivos de mapa (KML do CAR/Google Earth ou GeoJSON)
 * para GeoJSON pronto para o visualizador. Funções puras — sem banco,
 * sem rede — para poderem rodar no servidor e nos testes.
 */

/** Limite de 5 MB para o conteúdo do arquivo de mapa. */
export const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;

export type ResultadoConversao =
  | { ok: true; geojson: FeatureCollection }
  | { ok: false; erro: string };

export type ResumoGeoJson = {
  poligonos: number;
  pontos: number;
  linhas: number;
  /** Nomes das features (propriedade name/nome), sem vazios. */
  nomes: string[];
};

const EXTENSOES_ACEITAS = ["kml", "geojson", "json"];

function extensaoDe(nomeArquivo: string): string {
  const partes = nomeArquivo.toLowerCase().split(".");
  return partes.length > 1 ? (partes.pop() ?? "") : "";
}

function featuresComGeometria(colecao: FeatureCollection): Feature[] {
  return colecao.features.filter((f) => f && f.geometry != null);
}

function validarFeatureCollection(valor: unknown): ResultadoConversao {
  if (
    typeof valor !== "object" ||
    valor === null ||
    (valor as { type?: unknown }).type !== "FeatureCollection" ||
    !Array.isArray((valor as { features?: unknown }).features)
  ) {
    return {
      ok: false,
      erro:
        "O arquivo não é um GeoJSON de mapas válido — esperamos uma FeatureCollection com a lista de talhões/limites.",
    };
  }

  const colecao = valor as FeatureCollection;
  const uteis = featuresComGeometria(colecao);
  if (uteis.length === 0) {
    return {
      ok: false,
      erro:
        "O arquivo foi lido, mas não contém nenhuma geometria (polígono, linha ou ponto) para desenhar no mapa.",
    };
  }

  return { ok: true, geojson: { ...colecao, features: uteis } };
}

function converterGeoJson(conteudo: string): ResultadoConversao {
  let dados: unknown;
  try {
    dados = JSON.parse(conteudo);
  } catch {
    return {
      ok: false,
      erro: "Não foi possível ler o arquivo — o conteúdo não é um JSON válido.",
    };
  }
  return validarFeatureCollection(dados);
}

function converterKml(conteudo: string): ResultadoConversao {
  const erroPadrao =
    "Não foi possível ler o KML — confira se o arquivo foi exportado do CAR ou do Google Earth sem alterações.";

  let erroXml = false;
  let documento: ReturnType<DOMParser["parseFromString"]>;
  try {
    const parser = new DOMParser({
      onError: (nivel) => {
        if (nivel !== "warning") erroXml = true;
      },
    });
    documento = parser.parseFromString(conteudo, "text/xml");
  } catch {
    return { ok: false, erro: erroPadrao };
  }

  if (erroXml || !documento.documentElement) {
    return { ok: false, erro: erroPadrao };
  }
  if (documento.documentElement.localName !== "kml") {
    return {
      ok: false,
      erro: "O arquivo não parece um KML — o conteúdo não começa com <kml>.",
    };
  }

  const geojson = kml(documento as unknown as Document);
  return validarFeatureCollection(geojson);
}

/**
 * Converte o conteúdo de um arquivo .kml/.geojson/.json em GeoJSON.
 * Retorna `{ ok: false, erro }` com mensagem clara de negócio quando o
 * arquivo é grande demais, tem formato não suportado ou é inválido.
 */
export function converterParaGeoJson(
  nomeArquivo: string,
  conteudo: string,
): ResultadoConversao {
  const extensao = extensaoDe(nomeArquivo);
  if (!EXTENSOES_ACEITAS.includes(extensao)) {
    return {
      ok: false,
      erro:
        "Formato não suportado — envie um arquivo .kml (CAR/Google Earth) ou .geojson.",
    };
  }

  if (new TextEncoder().encode(conteudo).length > TAMANHO_MAXIMO_BYTES) {
    return {
      ok: false,
      erro: "O arquivo passa de 5 MB — exporte apenas os talhões/limites da fazenda.",
    };
  }

  return extensao === "kml"
    ? converterKml(conteudo)
    : converterGeoJson(conteudo);
}

function contarGeometria(geometria: Geometry, resumo: ResumoGeoJson): void {
  switch (geometria.type) {
    case "Polygon":
    case "MultiPolygon":
      resumo.poligonos += 1;
      break;
    case "Point":
    case "MultiPoint":
      resumo.pontos += 1;
      break;
    case "LineString":
    case "MultiLineString":
      resumo.linhas += 1;
      break;
    case "GeometryCollection":
      for (const interna of geometria.geometries) {
        contarGeometria(interna, resumo);
      }
      break;
  }
}

/** Resumo amigável do GeoJSON: contagem de geometrias e nomes das features. */
export function resumoGeoJson(geojson: FeatureCollection): ResumoGeoJson {
  const resumo: ResumoGeoJson = { poligonos: 0, pontos: 0, linhas: 0, nomes: [] };

  for (const feature of geojson.features) {
    if (feature.geometry) contarGeometria(feature.geometry, resumo);
    const propriedades = feature.properties as Record<string, unknown> | null;
    const nome = propriedades?.name ?? propriedades?.nome;
    if (typeof nome === "string" && nome.trim() !== "") {
      resumo.nomes.push(nome.trim());
    }
  }

  return resumo;
}

/** Frase curta do resumo (ex.: "2 polígonos · 1 ponto") para listas na tela. */
export function descreverResumo(resumo: ResumoGeoJson): string {
  const partes: string[] = [];
  if (resumo.poligonos > 0) {
    partes.push(`${resumo.poligonos} polígono${resumo.poligonos > 1 ? "s" : ""}`);
  }
  if (resumo.linhas > 0) {
    partes.push(`${resumo.linhas} linha${resumo.linhas > 1 ? "s" : ""}`);
  }
  if (resumo.pontos > 0) {
    partes.push(`${resumo.pontos} ponto${resumo.pontos > 1 ? "s" : ""}`);
  }
  return partes.length > 0 ? partes.join(" · ") : "sem geometrias";
}
