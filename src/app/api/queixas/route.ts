import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import {
  criarLimitadorTaxa,
  esquemaQueixaPublica,
  primeiraMensagem,
} from "@/lib/compliance/validacao";

/**
 * Recebimento público de queixas (RA 1.5.1 — canal acessível e anônimo).
 * A página /queixa/[clienteId] envia para cá sem login; como a RLS não
 * permite escrita anônima, a gravação usa a SERVICE KEY no servidor,
 * depois de validar o cliente, o rate limit por IP e o honeypot.
 */

/** Máximo de envios por IP por hora — freia abuso sem punir uso real. */
const limitador = criarLimitadorTaxa(5, 60 * 60 * 1000);

const MENSAGEM_RECEBIDA =
  "Recebemos o seu relato. Obrigado pela confiança — ele será analisado com cuidado e sigilo.";

function ipDaRequisicao(request: Request): string {
  const encaminhado = request.headers.get("x-forwarded-for");
  return encaminhado?.split(",")[0]?.trim() || "desconhecido";
}

export async function POST(request: Request) {
  let corpo: Record<string, unknown>;
  try {
    corpo = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, erro: "Envio inválido — recarregue a página e tente de novo." },
      { status: 400 },
    );
  }

  // Honeypot anti-robô: campo invisível para pessoas; se veio preenchido,
  // respondemos sucesso sem gravar nada (não dar pistas ao robô).
  if (typeof corpo.site === "string" && corpo.site.trim() !== "") {
    return NextResponse.json({ ok: true, mensagem: MENSAGEM_RECEBIDA });
  }

  if (!limitador.permitir(ipDaRequisicao(request))) {
    return NextResponse.json(
      {
        ok: false,
        erro: "Muitos envios em pouco tempo. Aguarde um pouco e tente novamente.",
      },
      { status: 429 },
    );
  }

  const resultado = esquemaQueixaPublica.safeParse({
    clienteId: corpo.clienteId,
    mensagem: corpo.mensagem,
    anonima: corpo.anonima !== false,
    contato: typeof corpo.contato === "string" ? corpo.contato : undefined,
  });
  if (!resultado.success) {
    return NextResponse.json(
      { ok: false, erro: primeiraMensagem(resultado.error) },
      { status: 400 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) {
    // Modo demonstração: o canal responde com acolhimento, sem gravar.
    return NextResponse.json({ ok: true, mensagem: MENSAGEM_RECEBIDA });
  }

  const supabase = createServiceClient(url, service, {
    auth: { persistSession: false },
  });

  const { data: cliente, error: erroCliente } = await supabase
    .from("clientes")
    .select("id")
    .eq("id", resultado.data.clienteId)
    .maybeSingle();
  if (erroCliente) {
    return NextResponse.json(
      { ok: false, erro: "Não foi possível registrar agora. Tente novamente em instantes." },
      { status: 500 },
    );
  }
  if (!cliente) {
    return NextResponse.json(
      { ok: false, erro: "Endereço do canal inválido — confira o link recebido." },
      { status: 404 },
    );
  }

  const { error } = await supabase.from("queixas").insert({
    cliente_id: resultado.data.clienteId,
    mensagem: resultado.data.mensagem,
    anonima: resultado.data.anonima,
    contato: resultado.data.anonima ? null : (resultado.data.contato ?? null),
  });
  if (error) {
    return NextResponse.json(
      { ok: false, erro: "Não foi possível registrar agora. Tente novamente em instantes." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, mensagem: MENSAGEM_RECEBIDA });
}
