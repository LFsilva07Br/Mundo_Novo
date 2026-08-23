import { gravarConfigLocal, obterConfigLocal } from "./banco-local";

/**
 * Convite para instalar o App de Campo na tela de início.
 *
 * Instalado, o app abre sem barra do navegador, ganha ícone próprio e — o
 * que mais importa em lavoura — o navegador trata os dados locais com muito
 * mais cuidado. O convite é discreto e some para sempre quando dispensado.
 */

export const CHAVE_CONVITE_INSTALACAO = "convite-instalacao-dispensado";

export type Plataforma = "ios" | "android" | "outro";

/** Plataforma provável a partir do user agent (só para o texto da dica). */
export function detectarPlataforma(userAgent: string): Plataforma {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  // iPadOS moderno se anuncia como Macintosh com toque.
  if (ua.includes("android")) return "android";
  return "outro";
}

/** Passo a passo manual, para quando o navegador não oferece o convite. */
export function instrucaoInstalacao(plataforma: Plataforma): string {
  if (plataforma === "ios") {
    return 'No iPhone: toque em Compartilhar (o quadrado com a seta) e depois em "Adicionar à Tela de Início".';
  }
  if (plataforma === "android") {
    return 'No Android: abra o menu do navegador (⋮) e toque em "Instalar app" ou "Adicionar à tela inicial".';
  }
  return 'No navegador: procure "Instalar app" ou "Adicionar à tela inicial" no menu.';
}

/** O app já está aberto como aplicativo instalado? */
export function appJaInstalado(): boolean {
  if (typeof window === "undefined") return false;
  const comoApp =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  const noIos =
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return comoApp || noIos;
}

export async function conviteDispensado(): Promise<boolean> {
  return (await obterConfigLocal<boolean>(CHAVE_CONVITE_INSTALACAO)) === true;
}

export async function dispensarConvite(): Promise<void> {
  await gravarConfigLocal(CHAVE_CONVITE_INSTALACAO, true);
}
