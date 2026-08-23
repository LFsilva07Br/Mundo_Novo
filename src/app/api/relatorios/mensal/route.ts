import type { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { obterCliente } from "@/lib/carteira/consultas";
import {
  listarTalhoes,
  SAFRA_ANTERIOR,
  SAFRA_ATUAL,
} from "@/lib/carteira/imoveis-consultas";
import { listarCapas } from "@/lib/certificacao/consultas";
import { listarTreinamentos } from "@/lib/social/consultas";
import { montarRelatorioMensal, nomeArquivo } from "@/lib/relatorios/dados";
import { documentoMensal } from "@/lib/relatorios/pdf";
import {
  respostaArquivo,
  respostaErro,
  TIPO_PDF,
} from "@/lib/relatorios/resposta";
import { formatarData } from "@/lib/vencimentos";

/**
 * Relatório mensal do cliente — o entregável que a consultoria envia ao
 * produtor: capa com a marca, resumo (áreas, certificações e vencimentos),
 * safra, CAPAs abertas/fechadas no período e treinamentos vencendo.
 * GET /api/relatorios/mensal?formato=pdf&cliente=<id>
 */
export async function GET(request: NextRequest) {
  const parametros = request.nextUrl.searchParams;
  const formato = parametros.get("formato") ?? "pdf";
  if (formato !== "pdf") {
    return respostaErro("O relatório mensal está disponível apenas em PDF.", 400);
  }

  const clienteId = parametros.get("cliente") ?? "alto-da-serra";
  const cliente = await obterCliente(clienteId);
  if (!cliente) return respostaErro("Cliente não encontrado.", 404);

  const [panorama, capas, treinamentos] = await Promise.all([
    listarTalhoes(clienteId),
    listarCapas(),
    listarTreinamentos(clienteId),
  ]);

  const relatorio = montarRelatorioMensal({
    cliente,
    panorama,
    capas,
    treinamentos,
    safraAtual: SAFRA_ATUAL,
    safraAnterior: SAFRA_ANTERIOR,
  });

  const agora = new Date();
  const mesReferencia = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(agora);

  const conteudo = await renderToBuffer(
    documentoMensal(relatorio, formatarData(agora), mesReferencia),
  );
  return respostaArquivo(
    conteudo,
    nomeArquivo("relatorio-mensal", "pdf", cliente.nome),
    TIPO_PDF,
  );
}
