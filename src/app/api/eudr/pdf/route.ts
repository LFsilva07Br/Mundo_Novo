import type { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { obterCliente } from "@/lib/carteira/consultas";
import { listarImoveisDoCliente } from "@/lib/carteira/imoveis-consultas";
import { montarPacoteEudr } from "@/lib/eudr/dados";
import { documentoEudr } from "@/lib/eudr/pdf";
import { listarMapasCliente } from "@/lib/mapas/consultas";
import { nomeArquivo } from "@/lib/relatorios/dados";
import {
  respostaArquivo,
  respostaErro,
  TIPO_PDF,
} from "@/lib/relatorios/resposta";
import { formatarData } from "@/lib/vencimentos";

/**
 * Declaração de geolocalização EUDR em PDF — capa da consultoria, tabela de
 * imóveis com CAR e centroide, cobertura de polígonos e aviso dos imóveis
 * sem mapa. Entregável que acompanha o GeoJSON na venda para exportação.
 * GET /api/eudr/pdf?cliente=<id>
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

  const conteudo = await renderToBuffer(
    documentoEudr(pacote, formatarData(new Date())),
  );
  return respostaArquivo(
    conteudo,
    nomeArquivo("declaracao-eudr", "pdf", cliente.nome),
    TIPO_PDF,
  );
}
