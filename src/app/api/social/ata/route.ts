import type { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { montarDadosAta, nomeArquivoAta } from "@/lib/social/ata";
import { documentoAta } from "@/lib/social/ata-pdf";
import { TRABALHADORES_DEMO, TREINAMENTOS_DEMO } from "@/lib/social/dados-demo";
import { slugSocial } from "@/lib/social/regras";
import {
  respostaArquivo,
  respostaErro,
  TIPO_PDF,
} from "@/lib/relatorios/resposta";
import { createClient } from "@/lib/supabase/server";
import { formatarData } from "@/lib/vencimentos";

/**
 * Ata de treinamento (lista de presença) em PDF.
 * GET /api/social/ata?treinamento=<id>&data=YYYY-MM-DD
 * Participantes da turma daquela data, com a miniatura da assinatura colhida
 * na tela (URL assinada do bucket, 1h) ou linha para assinar no papel.
 */

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const EH_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALIDADE_URL_SEGUNDOS = 3600; // 1 hora

type ParticipanteBruto = { nome: string; assinaturaUrl?: string | null };

export async function GET(request: NextRequest) {
  const parametros = request.nextUrl.searchParams;
  const treinamentoId = parametros.get("treinamento");
  const data = parametros.get("data");
  if (!treinamentoId) {
    return respostaErro("Informe o treinamento da ata.", 400);
  }
  if (!data || !DATA_ISO.test(data)) {
    return respostaErro("Informe a data da turma (AAAA-MM-DD).", 400);
  }

  const supabase = await createClient();

  let treinamento: { nome: string; norma?: string } | null = null;
  let participantes: ParticipanteBruto[] = [];

  if (!supabase) {
    // Modo demonstração: ata em branco com toda a equipe da planilha.
    const demo = TREINAMENTOS_DEMO.find(
      (t) => slugSocial(t.nome) === treinamentoId,
    );
    if (!demo) return respostaErro("Treinamento não encontrado.", 404);
    treinamento = { nome: demo.nome };
    participantes = TRABALHADORES_DEMO.map((t) => ({ nome: t.nome }));
  } else {
    if (!EH_UUID.test(treinamentoId)) {
      return respostaErro("Treinamento inválido.", 400);
    }

    const { data: linha, error: erroTreinamento } = await supabase
      .from("treinamentos")
      .select("id, nome, norma")
      .eq("id", treinamentoId)
      .maybeSingle();
    if (erroTreinamento) {
      return respostaErro(
        `Não foi possível buscar o treinamento: ${erroTreinamento.message}`,
        500,
      );
    }
    if (!linha) return respostaErro("Treinamento não encontrado.", 404);
    treinamento = { nome: linha.nome, norma: linha.norma ?? undefined };

    const { data: participacoes, error: erroParticipacoes } = await supabase
      .from("treinamento_participacoes")
      .select("assinatura_caminho, trabalhador:trabalhadores ( nome )")
      .eq("treinamento_id", treinamentoId)
      .eq("realizado_em", data);
    if (erroParticipacoes) {
      return respostaErro(
        `Não foi possível buscar as participações: ${erroParticipacoes.message}`,
        500,
      );
    }

    type Participacao = {
      assinatura_caminho: string | null;
      trabalhador: { nome: string } | null;
    };
    const linhas = (participacoes ?? []) as unknown as Participacao[];
    if (linhas.length === 0) {
      return respostaErro(
        "Nenhuma participação registrada nesta data — registre a turma antes de gerar a ata.",
        404,
      );
    }

    const caminhos = linhas
      .map((p) => p.assinatura_caminho)
      .filter((c): c is string => c !== null);
    const urls = new Map<string, string>();
    if (caminhos.length > 0) {
      const { data: assinadas } = await supabase.storage
        .from("evidencias")
        .createSignedUrls(caminhos, VALIDADE_URL_SEGUNDOS);
      for (const assinada of assinadas ?? []) {
        if (assinada.path && assinada.signedUrl) {
          urls.set(assinada.path, assinada.signedUrl);
        }
      }
    }

    participantes = linhas.map((p) => ({
      nome: p.trabalhador?.nome ?? "—",
      assinaturaUrl: p.assinatura_caminho
        ? (urls.get(p.assinatura_caminho) ?? null)
        : null,
    }));
  }

  const ata = montarDadosAta(treinamento, data, participantes);
  const conteudo = await renderToBuffer(
    documentoAta(ata, formatarData(new Date())),
  );
  return respostaArquivo(
    conteudo,
    nomeArquivoAta(treinamento.nome, data),
    TIPO_PDF,
  );
}
