"use server";

import { createClient } from "@/lib/supabase/server";
import { esquemaAssinaturaPush } from "./validacao";

/**
 * Ações de escrita das notificações (Server Actions).
 *
 * PUSH DE SERVIDOR — onde plugar: com a lib `web-push` instalada e as envs
 * NEXT_PUBLIC_VAPID_PUBLIC / VAPID_PRIVATE definidas, basta ler as linhas
 * de `push_assinaturas` e chamar `webpush.sendNotification(assinatura,
 * JSON.stringify({ titulo, corpo }))` — o listener de "push" no
 * public/sw.js já sabe exibir esse payload.
 */

export type EstadoAcao =
  | { ok: true; mensagem: string }
  | { ok: false; erro: string };

/** Grava (ou atualiza) a assinatura de push deste aparelho para o perfil logado. */
export async function salvarAssinaturaPush(dados: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<EstadoAcao> {
  const analise = esquemaAssinaturaPush.safeParse(dados);
  if (!analise.success) {
    return { ok: false, erro: analise.error.issues[0]?.message ?? "Assinatura inválida." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return {
      ok: false,
      erro: "O banco de dados ainda não foi conectado — a assinatura não foi gravada.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, erro: "Sessão expirada — entre novamente para ativar o push." };
  }

  const { error } = await supabase.from("push_assinaturas").upsert(
    {
      perfil_id: user.id,
      endpoint: analise.data.endpoint,
      p256dh: analise.data.p256dh,
      auth: analise.data.auth,
    },
    { onConflict: "endpoint" },
  );
  if (error) {
    return {
      ok: false,
      erro: "Não foi possível gravar a assinatura de push. Tente novamente.",
    };
  }
  return { ok: true, mensagem: "Assinatura de push gravada." };
}
