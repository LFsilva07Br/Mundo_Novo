import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  criarLimitadorTaxa,
  esquemaQueixaPublica,
  primeiraMensagem,
} from "@/lib/compliance/validacao";
import {
  clienteDoCanal,
  consultarPorProtocolo,
  servicoSupabase,
} from "@/lib/portal/canal-queixas";
import {
  PRAZO_RESPOSTA_DIAS,
  normalizarProtocolo,
  protocoloVisivel,
} from "@/lib/portal/protocolo";

/**
 * Recebimento público de queixas (RA 1.5.1 — canal acessível e anônimo).
 * A página /queixa/[clienteId] envia para cá sem login; como a RLS não
 * permite escrita anônima, a gravação usa a SERVICE KEY no servidor,
 * depois de validar o cliente e o honeypot.
 */

/**
 * Teto de envios por IP por hora.
 *
 * Era 5/h e isso barrava o caso mais importante do canal: vários
 * trabalhadores relatando o mesmo problema no mesmo dia, do mesmo Wi-Fi do
 * alojamento — exatamente quando a coisa é grave. Passar de 30/h não
 * rejeita ninguém: o relato é gravado do mesmo jeito, marcado para triagem
 * prioritária (ver MARCA_TRIAGEM_PRIORITARIA).
 */
const limitador = criarLimitadorTaxa(30, 60 * 60 * 1000);

const MENSAGEM_RECEBIDA =
  "Recebemos o seu relato. Obrigado pela confiança — ele será analisado com cuidado e sigilo.";

/**
 * Marca gravada junto do relato quando o IP passou do teto. Nunca
 * rejeitamos um relato de trabalho: um pico de envios do mesmo local é
 * sinal de problema coletivo, não de abuso. A equipe vê a marca na triagem.
 */
export const MARCA_TRIAGEM_PRIORITARIA =
  "[TRIAGEM PRIORITÁRIA — vários relatos do mesmo local em pouco tempo; verificar problema coletivo]";

function ipDaRequisicao(request: Request): string {
  const encaminhado = request.headers.get("x-forwarded-for");
  return encaminhado?.split(",")[0]?.trim() || "desconhecido";
}

function erroDeCanalInvalido() {
  return NextResponse.json(
    {
      ok: false,
      erro: "Este endereço do canal não existe. Confira o cartaz ou o QR code da fazenda, ou fale direto com a equipe de certificação.",
    },
    { status: 404 },
  );
}

/**
 * Consulta anônima da situação do relato pelo código de protocolo:
 * GET /api/queixas?protocolo=K7QM-3XZ2
 */
export async function GET(request: Request) {
  const codigo = new URL(request.url).searchParams.get("protocolo") ?? "";
  if (!normalizarProtocolo(codigo)) {
    return NextResponse.json(
      {
        ok: false,
        erro: "O código tem 8 letras e números, como K7QM-3XZ2. Confira o que você anotou.",
      },
      { status: 400 },
    );
  }

  const consulta = await consultarPorProtocolo(codigo);
  if (!consulta) {
    return NextResponse.json(
      {
        ok: false,
        erro: "Não encontramos nenhum relato com esse código. Confira as letras e os números anotados.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, consulta });
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
    return NextResponse.json({
      ok: true,
      mensagem: MENSAGEM_RECEBIDA,
      protocolo: protocoloVisivel(randomUUID()),
      prazoDias: PRAZO_RESPOSTA_DIAS,
    });
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

  // Endereço do canal precisa existir — no banco E no modo demonstração.
  // Antes, sem env do Supabase, a API respondia "recebido" para qualquer
  // endereço e o relato simplesmente sumia.
  const cliente = await clienteDoCanal(resultado.data.clienteId);
  if (!cliente) return erroDeCanalInvalido();

  // Passou do teto? Grava assim mesmo, com marca de triagem prioritária.
  const prioritaria = !limitador.permitir(ipDaRequisicao(request));
  const mensagem = prioritaria
    ? `${MARCA_TRIAGEM_PRIORITARIA}\n\n${resultado.data.mensagem}`
    : resultado.data.mensagem;

  const supabase = servicoSupabase();
  if (!supabase) {
    // Modo demonstração: o canal responde como em produção (inclusive o
    // protocolo), mas não há banco para gravar.
    return NextResponse.json({
      ok: true,
      mensagem: MENSAGEM_RECEBIDA,
      protocolo: protocoloVisivel(randomUUID()),
      prazoDias: PRAZO_RESPOSTA_DIAS,
      prioritaria,
    });
  }

  const { data, error } = await supabase
    .from("queixas")
    .insert({
      cliente_id: cliente.id,
      mensagem,
      anonima: resultado.data.anonima,
      contato: resultado.data.anonima ? null : (resultado.data.contato ?? null),
    })
    .select("id")
    .single();
  if (error || !data) {
    return NextResponse.json(
      { ok: false, erro: "Não foi possível registrar agora. Tente novamente em instantes." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    mensagem: MENSAGEM_RECEBIDA,
    protocolo: protocoloVisivel(String(data.id)),
    prazoDias: PRAZO_RESPOSTA_DIAS,
    prioritaria,
  });
}
