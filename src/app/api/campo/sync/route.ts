import { NextResponse } from "next/server";
import type { PayloadSync } from "@/lib/campo/tipos";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/campo/sync — recebe UMA visita concluída no aparelho e a grava
 * no banco: visita (origem "campo", com GPS), respostas uma a uma (o gatilho
 * do banco abre CAPA para cada não conformidade), fotos no bucket
 * `evidencias` e a assinatura do produtor como evidência final.
 *
 * Erros pontuais (uma foto que falhou, um item órfão) viram AVISOS —
 * a visita é gravada e a fila do aparelho não trava.
 */

function ehPayloadValido(corpo: unknown): corpo is PayloadSync {
  if (!corpo || typeof corpo !== "object") return false;
  const p = corpo as Record<string, unknown>;
  return (
    typeof p.idLocal === "string" &&
    typeof p.clienteId === "string" &&
    typeof p.titulo === "string" &&
    p.titulo.trim().length > 0 &&
    typeof p.iniciadaEm === "string" &&
    typeof p.concluidaEm === "string" &&
    Array.isArray(p.respostas) &&
    Array.isArray(p.fotos)
  );
}

/** data URL → bytes + tipo. Null quando o formato não é o esperado. */
function decodificarDataUrl(
  dataUrl: string,
): { bytes: Uint8Array; contentType: string } | null {
  const combinacao = /^data:([\w/+.-]+);base64,(.+)$/.exec(dataUrl);
  if (!combinacao) return null;
  try {
    return {
      bytes: new Uint8Array(Buffer.from(combinacao[2], "base64")),
      contentType: combinacao[1],
    };
  } catch {
    return null;
  }
}

const EH_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, mensagem: "Corpo da requisição inválido." },
      { status: 400 },
    );
  }

  if (!ehPayloadValido(corpo)) {
    return NextResponse.json(
      { ok: false, mensagem: "Dados da visita incompletos." },
      { status: 400 },
    );
  }
  const payload = corpo;

  const supabase = await createClient();
  if (!supabase) {
    // Modo demonstração: sem banco, a visita é aceita e permanece no aparelho.
    return NextResponse.json({
      ok: true,
      mensagem: "Modo demonstração — visita validada (banco não conectado).",
      avisos: [],
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, mensagem: "Sessão expirada — entre novamente." },
      { status: 401 },
    );
  }

  const avisos: string[] = [];

  // 1. Visita ------------------------------------------------------
  const assinatura = payload.assinatura;
  const observacao = assinatura
    ? `Assinado por ${assinatura.nome} às ${new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(new Date(payload.concluidaEm))}`
    : null;

  const { data: visita, error: erroVisita } = await supabase
    .from("visitas")
    .insert({
      cliente_id: payload.clienteId,
      versao_checklist_id:
        payload.versaoChecklistId && EH_UUID.test(payload.versaoChecklistId)
          ? payload.versaoChecklistId
          : null,
      titulo: payload.titulo,
      origem: "campo",
      status: "sincronizada",
      responsavel_id: user.id,
      iniciada_em: payload.iniciadaEm,
      concluida_em: payload.concluidaEm,
      gps_inicio: payload.gpsInicio,
      gps_fim: payload.gpsFim,
      observacao,
    })
    .select("id")
    .single();

  if (erroVisita || !visita) {
    return NextResponse.json(
      {
        ok: false,
        mensagem: `Não foi possível gravar a visita: ${erroVisita?.message ?? "erro desconhecido"}`,
      },
      { status: 500 },
    );
  }
  const visitaId = (visita as { id: string }).id;

  // 2. Respostas — uma a uma: o gatilho do banco abre CAPA para cada NC
  for (const resposta of payload.respostas) {
    const { error } = await supabase.from("visita_respostas").insert({
      visita_id: visitaId,
      item_id: resposta.itemId,
      resposta: resposta.resposta,
      descricao: resposta.descricao,
    });
    if (error) {
      avisos.push(`Resposta do item ${resposta.itemId} não gravada: ${error.message}`);
    }
  }

  // 3. Fotos de evidência no bucket + registro em visita_fotos ------
  let numero = 0;
  for (const foto of payload.fotos) {
    numero += 1;
    const decodificada = decodificarDataUrl(foto.dataUrl);
    if (!decodificada) {
      avisos.push(`Foto ${numero} em formato inesperado — não enviada.`);
      continue;
    }
    const caminho = `visitas/${visitaId}/${numero}.jpg`;
    const { error: erroUpload } = await supabase.storage
      .from("evidencias")
      .upload(caminho, decodificada.bytes, {
        contentType: decodificada.contentType,
        upsert: true,
      });
    if (erroUpload) {
      avisos.push(`Foto ${numero} não enviada: ${erroUpload.message}`);
      continue;
    }
    const { error: erroRegistro } = await supabase.from("visita_fotos").insert({
      visita_id: visitaId,
      item_id: EH_UUID.test(foto.itemId) ? foto.itemId : null,
      caminho,
      gps: foto.gps,
      tirada_em: foto.tiradaEm,
    });
    if (erroRegistro) {
      avisos.push(`Foto ${numero} sem registro no banco: ${erroRegistro.message}`);
    }
  }

  // 4. Assinatura do produtor como evidência final ------------------
  if (assinatura) {
    const decodificada = decodificarDataUrl(assinatura.dataUrl);
    if (!decodificada) {
      avisos.push("Assinatura em formato inesperado — não enviada.");
    } else {
      const caminho = `visitas/${visitaId}/assinatura.png`;
      const { error: erroUpload } = await supabase.storage
        .from("evidencias")
        .upload(caminho, decodificada.bytes, {
          contentType: decodificada.contentType,
          upsert: true,
        });
      if (erroUpload) {
        avisos.push(`Assinatura não enviada: ${erroUpload.message}`);
      } else {
        const { error: erroRegistro } = await supabase
          .from("visita_fotos")
          .insert({
            visita_id: visitaId,
            item_id: null,
            caminho,
            gps: payload.gpsFim,
            tirada_em: payload.concluidaEm,
          });
        if (erroRegistro) {
          avisos.push(`Assinatura sem registro no banco: ${erroRegistro.message}`);
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    visitaId,
    mensagem: "Visita gravada no escritório.",
    avisos,
  });
}
