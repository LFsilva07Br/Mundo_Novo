/** Helpers HTTP dos relatórios exportáveis. */

export const TIPO_XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const TIPO_PDF = "application/pdf";

/** Resposta de download com Content-Disposition attachment. */
export function respostaArquivo(
  conteudo: Uint8Array,
  nome: string,
  tipo: string,
): Response {
  // Copia para um Uint8Array com ArrayBuffer próprio (BodyInit estrito).
  const corpo = new Uint8Array(conteudo);
  return new Response(corpo, {
    headers: {
      "Content-Type": tipo,
      "Content-Disposition": `attachment; filename="${nome}"`,
      "Cache-Control": "no-store",
    },
  });
}

export function respostaErro(mensagem: string, status: number): Response {
  return Response.json({ erro: mensagem }, { status });
}
