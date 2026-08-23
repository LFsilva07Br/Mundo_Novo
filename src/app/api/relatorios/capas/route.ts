import type { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { listarCapas } from "@/lib/certificacao/consultas";
import { montarRelatorioCapas, nomeArquivo } from "@/lib/relatorios/dados";
import { excelCapas } from "@/lib/relatorios/excel";
import { documentoCapas } from "@/lib/relatorios/pdf";
import {
  respostaArquivo,
  respostaErro,
  TIPO_PDF,
  TIPO_XLSX,
} from "@/lib/relatorios/resposta";
import { formatarData } from "@/lib/vencimentos";

/**
 * Relatório de CAPAs com origem, severidade, prazo e status.
 * Com ocultar_fechadas=1 sai o pacote de auditoria externa — o auditor
 * recebe apenas o que ainda está aberto (requisito da cliente).
 * GET /api/relatorios/capas?formato=xlsx|pdf&ocultar_fechadas=1
 */
export async function GET(request: NextRequest) {
  const parametros = request.nextUrl.searchParams;
  const formato = parametros.get("formato") ?? "xlsx";
  if (formato !== "xlsx" && formato !== "pdf") {
    return respostaErro("Formato inválido — use xlsx ou pdf.", 400);
  }

  const ocultarFechadas = ["1", "true"].includes(
    parametros.get("ocultar_fechadas") ?? "",
  );

  const capas = await listarCapas();
  const relatorio = montarRelatorioCapas(capas, ocultarFechadas);
  const nome = nomeArquivo(
    ocultarFechadas ? "capas-abertas-auditoria" : "capas-planos-de-acao",
    formato,
  );

  if (formato === "pdf") {
    const conteudo = await renderToBuffer(
      documentoCapas(relatorio, formatarData(new Date())),
    );
    return respostaArquivo(conteudo, nome, TIPO_PDF);
  }

  return respostaArquivo(await excelCapas(relatorio), nome, TIPO_XLSX);
}
