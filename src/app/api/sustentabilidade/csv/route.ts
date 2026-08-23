import { listarPagamentos } from "@/lib/sustentabilidade/consultas";
import { gerarCsvPagamentos } from "@/lib/sustentabilidade/regras";

/**
 * Relatório CSV dos pagamentos de sustentabilidade (DS/DI) — sem biblioteca,
 * apenas a string CSV com BOM (para o Excel abrir com acentos corretos).
 * GET /api/sustentabilidade/csv
 */
export async function GET() {
  const pagamentos = await listarPagamentos();
  const csv = "\ufeff" + gerarCsvPagamentos(pagamentos);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="pagamentos-sustentabilidade.csv"',
    },
  });
}
