import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { marcoAtingido } from "@/lib/gatilhos";
import { diasAte } from "@/lib/vencimentos";
import { emailsDosContatos, emailsDosGestores } from "@/lib/email/destinatarios";
import { montarAlertaHtml } from "@/lib/email/modelos";
import { enviarEmail, type ClienteEnvios } from "@/lib/email/remetente";

/** Limite defensivo de e-mails por execução do cron. */
const MAX_EMAILS_POR_EXECUCAO = 20;

/**
 * Motor de gatilhos por proximidade de data.
 * Executado diariamente pelo cron da Vercel (vercel.json); cruza os
 * vencimentos de certificações, documentos de imóvel, captações de água,
 * treinamentos e CAPAs e materializa tarefas na agenda — o alerta persiste
 * até a tarefa ser concluída (unique regra+cliente+vencimento no banco).
 */

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

  const tarefas: {
    titulo: string;
    detalhe: string;
    cliente_id: string | null;
    origem: "data";
    regra: string;
    vence_em: string;
  }[] = [];

  // 1. Certificações
  const { data: certs } = await supabase
    .from("certificacoes")
    .select("cliente_id, norma, vence_em, clientes ( nome )")
    .not("vence_em", "is", null);
  for (const cert of certs ?? []) {
    const dias = diasAte(new Date(`${cert.vence_em}T12:00:00`));
    const marco = marcoAtingido(dias);
    if (marco === null) continue;
    const nome =
      (cert.clientes as unknown as { nome: string } | null)?.nome ?? "";
    tarefas.push({
      titulo:
        dias < 0
          ? `Certificado VENCIDO — ${nome}`
          : `Certificado vence em ${dias} dias — ${nome}`,
      detalhe: `Norma ${cert.norma} · vencimento ${cert.vence_em} · disparo ${marco} dias · alerta persiste até a renovação`,
      cliente_id: cert.cliente_id,
      origem: "data",
      regra: `cert-${cert.norma}`,
      vence_em: cert.vence_em as string,
    });
  }

  // 2. Documentos de imóvel + captações de água
  const { data: docs } = await supabase
    .from("documentos_imovel")
    .select("tipo, vence_em, imoveis_rurais ( nome, cliente_id )")
    .not("vence_em", "is", null);
  for (const doc of docs ?? []) {
    const dias = diasAte(new Date(`${doc.vence_em}T12:00:00`));
    if (marcoAtingido(dias) === null) continue;
    const imovel = doc.imoveis_rurais as unknown as {
      nome: string;
      cliente_id: string;
    } | null;
    tarefas.push({
      titulo: `Documento ${doc.tipo} a vencer — ${imovel?.nome ?? "imóvel"}`,
      detalhe: `Regularização necessária · vencimento ${doc.vence_em}`,
      cliente_id: imovel?.cliente_id ?? null,
      origem: "data",
      regra: `doc-${doc.tipo}-${imovel?.nome ?? ""}`,
      vence_em: doc.vence_em as string,
    });
  }

  const { data: captacoes } = await supabase
    .from("captacoes_agua")
    .select("tipo_captacao, processo, vence_em, imoveis_rurais ( nome, cliente_id )")
    .not("vence_em", "is", null);
  for (const cap of captacoes ?? []) {
    const dias = diasAte(new Date(`${cap.vence_em}T12:00:00`));
    if (marcoAtingido(dias) === null) continue;
    const imovel = cap.imoveis_rurais as unknown as {
      nome: string;
      cliente_id: string;
    } | null;
    tarefas.push({
      titulo: `Outorga/captação a vencer — ${imovel?.nome ?? "imóvel"}`,
      detalhe: `${cap.tipo_captacao} · processo ${cap.processo ?? "—"} · vencimento ${cap.vence_em}`,
      cliente_id: imovel?.cliente_id ?? null,
      origem: "data",
      regra: `captacao-${cap.processo ?? imovel?.nome ?? ""}`,
      vence_em: cap.vence_em as string,
    });
  }

  // 3. Treinamentos
  const { data: parts } = await supabase
    .from("treinamento_participacoes")
    .select(
      "vence_em, treinamentos ( nome ), trabalhadores ( nome, cliente_id )",
    )
    .not("vence_em", "is", null);
  for (const p of parts ?? []) {
    const dias = diasAte(new Date(`${p.vence_em}T12:00:00`));
    if (marcoAtingido(dias) === null) continue;
    const trein = p.treinamentos as unknown as { nome: string } | null;
    const trab = p.trabalhadores as unknown as {
      nome: string;
      cliente_id: string;
    } | null;
    tarefas.push({
      titulo: `Treinamento a vencer: ${trein?.nome ?? ""} — ${trab?.nome ?? ""}`,
      detalhe: `Reciclagem necessária · vence ${p.vence_em}`,
      cliente_id: trab?.cliente_id ?? null,
      origem: "data",
      regra: `trein-${trein?.nome ?? ""}-${trab?.nome ?? ""}`,
      vence_em: p.vence_em as string,
    });
  }

  // 4. CAPAs a 7 dias do prazo (lembrete ao responsável)
  const { data: capas } = await supabase
    .from("capas")
    .select("numero, prazo, responsavel, cliente_id, status")
    .neq("status", "fechada")
    .not("prazo", "is", null);
  for (const capa of capas ?? []) {
    const dias = diasAte(new Date(`${capa.prazo}T12:00:00`));
    if (dias > 7) continue;
    tarefas.push({
      titulo:
        dias < 0
          ? `CAPA #${capa.numero} com prazo ESTOURADO — escalonar ao gestor`
          : `CAPA #${capa.numero} a ${dias} dias do prazo — lembrar ${capa.responsavel}`,
      detalhe: `Prazo ${capa.prazo} · alerta persiste até o fechamento comprovado`,
      cliente_id: capa.cliente_id,
      origem: "data",
      regra: `capa-${capa.numero}`,
      vence_em: capa.prazo as string,
    });
  }

  // Materializa (upsert ignorando repetidos — alerta único por regra+vencimento).
  // O .select() devolve apenas as linhas de fato inseridas: com
  // ignoreDuplicates, um alerta já existente volta vazio — assim sabemos
  // quais tarefas são NOVAS e merecem e-mail.
  const novas: (typeof tarefas)[number][] = [];
  for (const tarefa of tarefas) {
    const { data, error } = await supabase
      .from("tarefas")
      .upsert(tarefa, { onConflict: "regra,cliente_id,vence_em", ignoreDuplicates: true })
      .select("id");
    if (!error && (data?.length ?? 0) > 0) novas.push(tarefa);
  }

  // E-mail de alerta para cada tarefa NOVA de cliente: vai aos contatos por
  // área do cliente; sem contato com e-mail, fica registrado para os
  // gestores. Limite defensivo por execução; falha de e-mail nunca
  // interrompe o motor.
  let emailsProcessados = 0;
  let emailsEnviados = 0;
  let limiteAtingido = false;
  const cacheContatos = new Map<string, string[]>();
  let gestores: string[] | null = null;

  for (const tarefa of novas) {
    if (!tarefa.cliente_id) continue;
    if (emailsProcessados >= MAX_EMAILS_POR_EXECUCAO) {
      limiteAtingido = true;
      break;
    }

    let destinatarios = cacheContatos.get(tarefa.cliente_id);
    if (!destinatarios) {
      const { data: contatos } = await supabase
        .from("contatos_cliente")
        .select("email")
        .eq("cliente_id", tarefa.cliente_id)
        .not("email", "is", null);
      destinatarios = emailsDosContatos(contatos ?? []);
      cacheContatos.set(tarefa.cliente_id, destinatarios);
    }

    if (destinatarios.length === 0) {
      // Fallback: registra o alerta para os gestores internos.
      if (gestores === null) {
        const { data: perfis } = await supabase.from("perfis").select("*");
        gestores = emailsDosGestores(perfis ?? []);
      }
      destinatarios = gestores;
    }

    const html = montarAlertaHtml(tarefa);
    for (const para of destinatarios) {
      if (emailsProcessados >= MAX_EMAILS_POR_EXECUCAO) {
        limiteAtingido = true;
        break;
      }
      emailsProcessados += 1;
      const resultado = await enviarEmail(
        { para, assunto: tarefa.titulo, html, origem: "gatilho" },
        supabase as unknown as ClienteEnvios,
      );
      if (resultado.enviado) emailsEnviados += 1;
    }
  }

  return NextResponse.json({
    avaliadas: tarefas.length,
    processadas: novas.length,
    emails_processados: emailsProcessados,
    emails_enviados: emailsEnviados,
    limite_emails_atingido: limiteAtingido,
    executado_em: new Date().toISOString(),
  });
}
