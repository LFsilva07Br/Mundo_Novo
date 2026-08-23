import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import {
  montarDetalheResumo,
  montarResumoHtml,
  segundaFeiraDaSemana,
  type DadosResumoSemanal,
} from "@/lib/alertas/resumo";

/**
 * Resumo semanal do gestor.
 * Executado toda segunda-feira pelo cron da Vercel (vercel.json); conta
 * as tarefas pendentes por origem, CAPAs abertas e com prazo próximo,
 * certificados nos próximos 90 dias e contratos aguardando alçada.
 * Grava uma tarefa "Resumo semanal da carteira" (regra resumo-semanal,
 * única por segunda-feira) e devolve os números em JSON.
 */

const REGRA_RESUMO = "resumo-semanal";

function dataIso(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET;
  const autorizacao = request.headers.get("authorization");
  if (!segredo || autorizacao !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) {
    return NextResponse.json({ erro: "banco não configurado" }, { status: 500 });
  }

  const supabase = createServiceClient(url, service, {
    auth: { persistSession: false },
  });

  const hoje = new Date();
  const em7dias = new Date(hoje);
  em7dias.setDate(em7dias.getDate() + 7);
  const em90dias = new Date(hoje);
  em90dias.setDate(em90dias.getDate() + 90);

  // 1. Tarefas pendentes por origem
  const { data: pendentes } = await supabase
    .from("tarefas")
    .select("origem")
    .eq("status", "pendente");
  const contagemOrigem = new Map<string, number>();
  for (const t of pendentes ?? []) {
    contagemOrigem.set(t.origem, (contagemOrigem.get(t.origem) ?? 0) + 1);
  }

  // 2. CAPAs abertas e com prazo nos próximos 7 dias (ou estourado)
  const { data: capas } = await supabase
    .from("capas")
    .select("prazo, status")
    .neq("status", "fechada");
  const capasAbertas = capas?.length ?? 0;
  const capasPrazoProximo = (capas ?? []).filter(
    (c) => c.prazo !== null && (c.prazo as string) <= dataIso(em7dias),
  ).length;

  // 3. Certificados que vencem nos próximos 90 dias
  const { count: certificados } = await supabase
    .from("certificacoes")
    .select("id", { count: "exact", head: true })
    .gte("vence_em", dataIso(hoje))
    .lte("vence_em", dataIso(em90dias));

  // 4. Contratos aguardando alçada
  const { count: contratos } = await supabase
    .from("contratos")
    .select("id", { count: "exact", head: true })
    .eq("status", "aguardando_alcada");

  const dados: DadosResumoSemanal = {
    semana: segundaFeiraDaSemana(hoje),
    tarefasPendentesPorOrigem: [...contagemOrigem.entries()].map(
      ([origem, total]) => ({ origem, total }),
    ),
    capasAbertas,
    capasPrazoProximo,
    certificadosProximos90Dias: certificados ?? 0,
    contratosAguardandoAlcada: contratos ?? 0,
  };

  // Materializa a tarefa do gestor — uma por semana (vence_em = segunda).
  // A verificação prévia é necessária porque o unique do banco
  // (regra, cliente_id, vence_em) não pega conflito com cliente_id nulo.
  let tarefaCriada = false;
  const { data: existente } = await supabase
    .from("tarefas")
    .select("id")
    .eq("regra", REGRA_RESUMO)
    .eq("vence_em", dados.semana)
    .is("cliente_id", null)
    .maybeSingle();
  if (!existente) {
    const { error } = await supabase.from("tarefas").insert({
      titulo: "Resumo semanal da carteira",
      detalhe: montarDetalheResumo(dados),
      cliente_id: null,
      origem: "data",
      regra: REGRA_RESUMO,
      vence_em: dados.semana,
    });
    tarefaCriada = !error;
  }

  // O HTML do e-mail já é gerado aqui; o envio será plugado quando o
  // serviço de e-mail estiver configurado (ver src/lib/alertas/resumo.ts).
  const html = montarResumoHtml(dados);

  return NextResponse.json({
    resumo: dados,
    tarefa_criada: tarefaCriada,
    html_gerado: html.length > 0,
    executado_em: new Date().toISOString(),
  });
}
