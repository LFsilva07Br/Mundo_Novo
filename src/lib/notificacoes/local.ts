import type { TarefaPacote } from "@/lib/campo/tipos";
import { salvarAssinaturaPush } from "./acoes";

/**
 * Notificações no aparelho (App de Campo).
 *
 * MVP sem dependências novas: notificações LOCAIS via Notification API +
 * Service Worker — funcionam com o app aberto (ex.: pacote atualizado com
 * alertas novos). A estrutura de push REAL de servidor já está pronta:
 * tabela `push_assinaturas` + assinatura do aparelho (abaixo). Para enviar
 * do servidor, basta instalar a lib `web-push`, configurar as envs
 * NEXT_PUBLIC_VAPID_PUBLIC / VAPID_PRIVATE e disparar para os endpoints
 * gravados em `push_assinaturas` (ver comentário em salvarAssinaturaPush).
 */

export type EstadoPermissao = "granted" | "denied" | "default" | "unsupported";

/** O navegador deste aparelho oferece notificações? */
export function notificacoesSuportadas(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** Estado atual da permissão, sem pedir nada ao usuário. */
export function estadoPermissao(): EstadoPermissao {
  if (!notificacoesSuportadas()) return "unsupported";
  return Notification.permission;
}

/** Pede a permissão de notificação ao usuário (quando ainda não decidida). */
export async function pedirPermissao(): Promise<EstadoPermissao> {
  if (!notificacoesSuportadas()) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

/**
 * Mostra uma notificação local no aparelho. Prefere o Service Worker
 * (aparece mesmo com a aba em segundo plano); sem SW, usa `new Notification`.
 * Silenciosa quando não há permissão — nunca quebra o fluxo de quem chama.
 */
export async function notificar(titulo: string, corpo: string): Promise<boolean> {
  if (estadoPermissao() !== "granted") return false;
  const opcoes: NotificationOptions = {
    body: corpo,
    icon: "/icone.svg",
    badge: "/icone.svg",
  };
  try {
    if ("serviceWorker" in navigator) {
      const registro = await navigator.serviceWorker.ready;
      await registro.showNotification(titulo, opcoes);
      return true;
    }
  } catch {
    // cai para o fallback abaixo
  }
  try {
    new Notification(titulo, opcoes);
    return true;
  } catch {
    return false;
  }
}

/**
 * Conta as tarefas do pacote novo que não existiam no pacote anterior —
 * decisão pura, usada para avisar "N novos alertas" ao atualizar o pacote.
 */
export function contarTarefasNovas(
  anteriores: Pick<TarefaPacote, "id">[] | null | undefined,
  atuais: Pick<TarefaPacote, "id">[],
): number {
  if (!anteriores || anteriores.length === 0) return 0;
  const conhecidas = new Set(anteriores.map((t) => t.id));
  return atuais.filter((t) => !conhecidas.has(t.id)).length;
}

/** Converte a chave pública VAPID (base64url) no formato do PushManager. */
function chaveVapidParaBytes(chave: string): Uint8Array {
  const preenchimento = "=".repeat((4 - (chave.length % 4)) % 4);
  const base64 = (chave + preenchimento).replace(/-/g, "+").replace(/_/g, "/");
  const bruto = atob(base64);
  return Uint8Array.from(bruto, (c) => c.charCodeAt(0));
}

export type ResultadoAssinatura =
  | { ok: true; mensagem: string }
  | { ok: false; aviso: string };

/**
 * Assina este aparelho para push de servidor (quando a env
 * NEXT_PUBLIC_VAPID_PUBLIC existir) e grava a assinatura em
 * `push_assinaturas`. Sem a env, pula com aviso — as notificações locais
 * continuam funcionando normalmente.
 */
export async function guardarAssinaturaPush(): Promise<ResultadoAssinatura> {
  const chavePublica = process.env.NEXT_PUBLIC_VAPID_PUBLIC;
  if (!chavePublica) {
    return {
      ok: false,
      aviso:
        "Push de servidor ainda não configurado (sem chave VAPID) — as notificações locais deste aparelho já estão ativas.",
    };
  }
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return {
      ok: false,
      aviso: "Este navegador não oferece push — notificações locais seguem ativas.",
    };
  }
  try {
    const registro = await navigator.serviceWorker.ready;
    const assinatura = await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: chaveVapidParaBytes(chavePublica) as BufferSource,
    });
    const json = assinatura.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false, aviso: "O navegador devolveu uma assinatura incompleta." };
    }
    const resultado = await salvarAssinaturaPush({
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    });
    if (!resultado.ok) return { ok: false, aviso: resultado.erro };
    return { ok: true, mensagem: "Aparelho registrado para push de servidor." };
  } catch {
    return {
      ok: false,
      aviso:
        "Não foi possível registrar o push neste aparelho — notificações locais seguem ativas.",
    };
  }
}
