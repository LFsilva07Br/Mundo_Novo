import type { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { listarClientes } from "@/lib/carteira/consultas";
import {
  montarRelatorioConformidade,
  nomeArquivo,
} from "@/lib/relatorios/dados";
import { excelConformidade } from "@/lib/relatorios/excel";
import { documentoConformidade } from "@/lib/relatorios/pdf";
import {
  respostaArquivo,
  respostaErro,
  TIPO_PDF,
  TIPO_XLSX,
} from "@/lib/relatorios/resposta";
import { formatarData } from "@/lib/vencimentos";

/**
 * Relatório da carteira com conformidade, certificações e vencimentos.
 * No Excel, a situação de vencimento sai com cor verde/âmbar/vermelho.
 * GET /api/relatorios/conformidade?formato=xlsx|pdf
 */
export async function GET(request: NextRequest) {
  const formato = request.nextUrl.searchParams.get("formato") ?? "xlsx";
  if (formato !== "xlsx" && formato !== "pdf") {
    return respostaErro("Formato inválido — use xlsx ou pdf.", 400);
  }

  const clientes = await listarClientes();
  const linhas = montarRelatorioConformidade(clientes);
  const nome = nomeArquivo("conformidade-carteira", formato);

  if (formato === "pdf") {
    const conteudo = await renderToBuffer(
      documentoConformidade(linhas, formatarData(new Date())),
    );
    return respostaArquivo(conteudo, nome, TIPO_PDF);
  }

  return respostaArquivo(await excelConformidade(linhas), nome, TIPO_XLSX);
}
