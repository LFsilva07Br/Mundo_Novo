import type { NextRequest } from "next/server";
import { obterCliente } from "@/lib/carteira/consultas";
import { listarImoveisDoCliente } from "@/lib/carteira/imoveis-consultas";
import { montarPacoteEudr } from "@/lib/eudr/dados";
import { listarMapasCliente } from "@/lib/mapas/consultas";
import { slugArquivo } from "@/lib/relatorios/dados";
import { respostaArquivo, respostaErro } from "@/lib/relatorios/resposta";

/** GeoJSON é servido como JSON com o media type registrado. */
const TIPO_GEOJSON = "application/geo+json";

/**
 * Pacote EUDR — FeatureCollection consolidada dos polígonos do cliente,
 * com as propriedades produtor, imovel, car e area_ha em cada feature
 * (formato aceito pelos sistemas de due diligence dos importadores).
 * GET /api/eudr/geojson?cliente=<id>
 */
export async function GET(request: NextRequest) {
  const clienteId =
    request.nextUrl.searchParams.get("cliente") ?? "alto-da-serra";
  const cliente = await obterCliente(clienteId);
  if (!cliente) return respostaErro("Cliente não encontrado.", 404);

  const [imoveis, mapas] = await Promise.all([
    listarImoveisDoCliente(cliente.id),
    listarMapasCliente(cliente.id),
  ]);
  const pacote = montarPacoteEudr(cliente, imoveis, mapas);

  if (pacote.imoveisComPoligono === 0) {
    return respostaErro(
      "Nenhum imóvel deste cliente tem polígono de mapa ainda — envie os mapas (KML do CAR ou GeoJSON) na tela de Imóveis & Talhões.",
      422,
    );
  }

  const conteudo = new TextEncoder().encode(
    JSON.stringify(pacote.colecao, null, 2),
  );
  return respostaArquivo(
    conteudo,
    `eudr-geolocalizacao-${slugArquivo(cliente.nome)}.geojson`,
    TIPO_GEOJSON,
  );
}
