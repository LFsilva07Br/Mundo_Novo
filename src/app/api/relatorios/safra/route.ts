import type { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { obterCliente } from "@/lib/carteira/consultas";
import {
  listarTalhoes,
  SAFRA_ANTERIOR,
  SAFRA_ATUAL,
} from "@/lib/carteira/imoveis-consultas";
import { montarRelatorioSafra, nomeArquivo } from "@/lib/relatorios/dados";
import { excelSafra } from "@/lib/relatorios/excel";
import { documentoSafra } from "@/lib/relatorios/pdf";
import {
  respostaArquivo,
  respostaErro,
  TIPO_PDF,
  TIPO_XLSX,
} from "@/lib/relatorios/resposta";
import { formatarData } from "@/lib/vencimentos";

/**
 * Relatório de estimativa de safra do cliente (Excel ou PDF):
 * talhões com área, variedade, ano, estado e previsão × colheita anterior,
 * totais por produtor e comparativo entre safras.
 * GET /api/relatorios/safra?formato=xlsx|pdf&cliente=<id>
 */
export async function GET(request: NextRequest) {
  const parametros = request.nextUrl.searchParams;
  const formato = parametros.get("formato") ?? "xlsx";
  if (formato !== "xlsx" && formato !== "pdf") {
    return respostaErro("Formato inválido — use xlsx ou pdf.", 400);
  }

  const clienteId = parametros.get("cliente") ?? "alto-da-serra";
  const cliente = await obterCliente(clienteId);
  if (!cliente) return respostaErro("Cliente não encontrado.", 404);

  const panorama = await listarTalhoes(clienteId);
  const relatorio = montarRelatorioSafra(
    cliente.nome,
    panorama,
    SAFRA_ATUAL,
    SAFRA_ANTERIOR,
  );
  const nome = nomeArquivo("estimativa-safra", formato, cliente.nome);

  if (formato === "pdf") {
    const conteudo = await renderToBuffer(
      documentoSafra(relatorio, formatarData(new Date())),
    );
    return respostaArquivo(conteudo, nome, TIPO_PDF);
  }

  return respostaArquivo(await excelSafra(relatorio), nome, TIPO_XLSX);
}
