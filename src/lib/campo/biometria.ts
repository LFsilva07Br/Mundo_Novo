"use client";

import {
  gravarConfigLocal,
  obterConfigLocal,
  removerConfigLocal,
} from "./banco-local";

/**
 * Biometria do App de Campo — TRAVA LOCAL do aparelho, não autenticação.
 *
 * Usa o WebAuthn do próprio aparelho (digital / rosto, autenticador de
 * plataforma) apenas para destravar o app na abertura. A sessão do
 * Supabase (cookies) continua sendo a autenticação real: se ela expirar,
 * o consultor volta ao /login normalmente.
 *
 * A credencial criada fica só no aparelho (id/publicKey gravados no
 * IndexedDB, gaveta `config`) — nada é enviado ao servidor.
 */

export const CHAVE_CONFIG_BIOMETRIA = "biometria";

export type CredencialBiometria = {
  /** rawId da credencial em base64url — usado no allowCredentials. */
  id: string;
  /** Chave pública em base64url (referência local; não é validada). */
  publicKey: string | null;
  /** ISO — quando a biometria foi ativada no aparelho. */
  criadaEm: string;
};

export const MENSAGEM_SEM_SUPORTE =
  "Este aparelho ou navegador não oferece desbloqueio por biometria. " +
  "Você pode continuar usando o app normalmente com a sua senha.";

export const MENSAGEM_FALHA_REGISTRO =
  "Não foi possível ativar a biometria. Verifique se a digital ou o " +
  "reconhecimento facial estão configurados no aparelho e tente de novo.";

export const MENSAGEM_FALHA_DESBLOQUEIO =
  "Biometria não reconhecida. Tente de novo ou entre com a sua senha.";

// ------------------------------------------------------------------
// Suporte do aparelho
// ------------------------------------------------------------------

/** O navegador tem as APIs de WebAuthn com autenticador de plataforma? */
export async function biometriaDisponivel(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const PKC = window.PublicKeyCredential;
  if (!PKC || typeof navigator === "undefined" || !navigator.credentials) {
    return false;
  }
  if (typeof PKC.isUserVerifyingPlatformAuthenticatorAvailable !== "function") {
    return false;
  }
  try {
    return await PKC.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------
// Estado (IndexedDB + memória da sessão de página)
// ------------------------------------------------------------------

/** A biometria foi ativada neste aparelho? */
export async function biometriaAtivada(): Promise<boolean> {
  return (await obterCredencial()) !== null;
}

export async function obterCredencial(): Promise<CredencialBiometria | null> {
  const valor = await obterConfigLocal<CredencialBiometria>(
    CHAVE_CONFIG_BIOMETRIA,
  );
  return valor && typeof valor.id === "string" ? valor : null;
}

/**
 * Destrave em memória: vale enquanto a página estiver aberta e zera a
 * cada recarga do app (quando a tela de bloqueio volta a aparecer).
 */
let desbloqueadaNaSessao = false;

export function appDesbloqueadoNaSessao(): boolean {
  return desbloqueadaNaSessao;
}

export function marcarDesbloqueado(): void {
  desbloqueadaNaSessao = true;
}

/** Usado nos testes para simular uma nova abertura do app. */
export function reiniciarSessaoDeBloqueio(): void {
  desbloqueadaNaSessao = false;
}

// ------------------------------------------------------------------
// Registro e desbloqueio (WebAuthn)
// ------------------------------------------------------------------

function bytesAleatorios(tamanho: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(tamanho));
  crypto.getRandomValues(bytes);
  return bytes;
}

function paraBase64Url(buffer: ArrayBuffer): string {
  let binario = "";
  for (const byte of new Uint8Array(buffer)) {
    binario += String.fromCharCode(byte);
  }
  return btoa(binario).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function deBase64Url(texto: string): Uint8Array<ArrayBuffer> {
  const base64 = texto.replaceAll("-", "+").replaceAll("_", "/");
  const binario = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binario.length));
  for (let i = 0; i < binario.length; i += 1) {
    bytes[i] = binario.charCodeAt(i);
  }
  return bytes;
}

/**
 * Cria a credencial de plataforma (digital/rosto) e grava a referência no
 * IndexedDB. Lança `Error` com mensagem clara quando não há suporte ou o
 * registro é cancelado/falha.
 */
export async function registrarBiometria(): Promise<CredencialBiometria> {
  if (!(await biometriaDisponivel())) {
    throw new Error(MENSAGEM_SEM_SUPORTE);
  }

  let credencial: Credential | null = null;
  try {
    credencial = await navigator.credentials.create({
      publicKey: {
        challenge: bytesAleatorios(32),
        rp: { name: "Mundo Novo — App de Campo" },
        user: {
          id: bytesAleatorios(16),
          name: "consultor-campo",
          displayName: "Consultor(a) de campo",
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60_000,
        attestation: "none",
      },
    });
  } catch {
    throw new Error(MENSAGEM_FALHA_REGISTRO);
  }

  if (!credencial || !("rawId" in credencial)) {
    throw new Error(MENSAGEM_FALHA_REGISTRO);
  }

  const publica = credencial as PublicKeyCredential;
  const resposta = publica.response as AuthenticatorAttestationResponse;
  const publicKey =
    typeof resposta.getPublicKey === "function"
      ? (resposta.getPublicKey() ?? null)
      : null;

  const registro: CredencialBiometria = {
    id: paraBase64Url(publica.rawId),
    publicKey: publicKey ? paraBase64Url(publicKey) : null,
    criadaEm: new Date().toISOString(),
  };
  await gravarConfigLocal(CHAVE_CONFIG_BIOMETRIA, registro);
  return registro;
}

/**
 * Pede a biometria ao aparelho (assertion com a credencial gravada) e, em
 * caso de sucesso, marca o app como desbloqueado nesta sessão de página.
 * Lança `Error` com mensagem clara quando falha ou não há credencial.
 */
export async function desbloquearComBiometria(): Promise<void> {
  const registro = await obterCredencial();
  if (!registro) {
    throw new Error(
      "A biometria não está ativada neste aparelho. Ative em Ajustes.",
    );
  }
  if (
    typeof navigator === "undefined" ||
    !navigator.credentials ||
    typeof navigator.credentials.get !== "function"
  ) {
    throw new Error(MENSAGEM_SEM_SUPORTE);
  }

  let assertiva: Credential | null = null;
  try {
    assertiva = await navigator.credentials.get({
      publicKey: {
        challenge: bytesAleatorios(32),
        allowCredentials: [
          {
            type: "public-key",
            id: deBase64Url(registro.id),
          },
        ],
        userVerification: "required",
        timeout: 60_000,
      },
    });
  } catch {
    throw new Error(MENSAGEM_FALHA_DESBLOQUEIO);
  }

  if (!assertiva) {
    throw new Error(MENSAGEM_FALHA_DESBLOQUEIO);
  }
  marcarDesbloqueado();
}

/** Remove a credencial local — o app volta a abrir direto, sem trava. */
export async function desativarBiometria(): Promise<void> {
  await removerConfigLocal(CHAVE_CONFIG_BIOMETRIA);
  desbloqueadaNaSessao = false;
}
