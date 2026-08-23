import type { NextRequest } from "next/server";
import {
  montarExportacao,
  nomeArquivoExportacao,
} from "@/lib/exportacao/dados";
import { respostaErro } from "@/lib/relatorios/resposta";
import { createClient } from "@/lib/supabase/server";

/**
 * Exportação completa / backup (portabilidade LGPD).
 * GET /api/exportacao            → carteira inteira
 * GET /api/exportacao?cliente=id → um cliente
 *
 * Apenas gestão (gestor/diretoria) pode baixar — o pacote contém dados
 * pessoais de trabalhadores e negócios dos clientes. Em modo demonstração
 * (sem Supabase) o download sai com os dados de exemplo.
 */

const PAPEIS_GESTAO = new Set(["gestor", "diretoria"]);

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return respostaErro("Entre no sistema para exportar os dados.", 401);
    }

    const { data: perfil } = (await supabase
      .from("perfis")
      .select("papel")
      .eq("id", user.id)
      .maybeSingle()) as { data: { papel: string } | null };
    if (!perfil || !PAPEIS_GESTAO.has(perfil.papel)) {
      return respostaErro(
        "Somente a gestão (gestor ou diretoria) pode baixar a exportação completa.",
        403,
      );
    }
  }

  const clienteId = request.nextUrl.searchParams.get("cliente") ?? undefined;
  const exportacao = await montarExportacao(clienteId);
  if (!exportacao) {
    return respostaErro("Cliente não encontrado para exportação.", 404);
  }

  const nome = nomeArquivoExportacao(new Date(), clienteId);
  return new Response(JSON.stringify(exportacao, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nome}"`,
      "Cache-Control": "no-store",
    },
  });
}
