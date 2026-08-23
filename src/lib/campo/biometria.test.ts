import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Biometria como trava local: decisões de disponibilidade e estado com o
 * WebAuthn mockado (jsdom não implementa `navigator.credentials`).
 */

const { configLocal } = vi.hoisted(() => ({
  configLocal: new Map<string, unknown>(),
}));

vi.mock("@/lib/campo/banco-local", () => ({
  gravarConfigLocal: vi.fn(async (chave: string, valor: unknown) => {
    configLocal.set(chave, valor);
  }),
  obterConfigLocal: vi.fn(async (chave: string) => configLocal.get(chave) ?? null),
  removerConfigLocal: vi.fn(async (chave: string) => {
    configLocal.delete(chave);
  }),
}));

import {
  appDesbloqueadoNaSessao,
  biometriaAtivada,
  biometriaDisponivel,
  desativarBiometria,
  desbloquearComBiometria,
  MENSAGEM_FALHA_DESBLOQUEIO,
  MENSAGEM_FALHA_REGISTRO,
  MENSAGEM_SEM_SUPORTE,
  obterCredencial,
  registrarBiometria,
  reiniciarSessaoDeBloqueio,
} from "./biometria";

type WebAuthnFalso = {
  disponivel?: boolean | "erro";
  create?: (opcoes?: CredentialCreationOptions) => Promise<unknown>;
  get?: (opcoes?: CredentialRequestOptions) => Promise<unknown>;
};

/** Injeta um WebAuthn falso no jsdom (que não traz a API). */
function injetarWebAuthn({
  disponivel = true,
  create = async () => null,
  get = async () => null,
}: WebAuthnFalso = {}) {
  Object.defineProperty(window, "PublicKeyCredential", {
    configurable: true,
    value: {
      isUserVerifyingPlatformAuthenticatorAvailable: vi.fn(async () => {
        if (disponivel === "erro") throw new Error("boom");
        return disponivel;
      }),
    },
  });
  Object.defineProperty(navigator, "credentials", {
    configurable: true,
    value: { create, get },
  });
}

function removerWebAuthn() {
  Object.defineProperty(window, "PublicKeyCredential", {
    configurable: true,
    value: undefined,
  });
  Object.defineProperty(navigator, "credentials", {
    configurable: true,
    value: undefined,
  });
}

/** Credencial como o navegador devolveria no registro. */
function credencialFalsa(bytes: number[]) {
  return {
    rawId: new Uint8Array(bytes).buffer,
    response: {
      getPublicKey: () => new Uint8Array([9, 9, 9]).buffer,
    },
  };
}

beforeEach(() => {
  configLocal.clear();
  reiniciarSessaoDeBloqueio();
  removerWebAuthn();
});

describe("biometriaDisponivel", () => {
  it("é falsa quando o navegador não tem WebAuthn", async () => {
    expect(await biometriaDisponivel()).toBe(false);
  });

  it("é verdadeira quando há autenticador de plataforma", async () => {
    injetarWebAuthn({ disponivel: true });
    expect(await biometriaDisponivel()).toBe(true);
  });

  it("é falsa quando o aparelho não tem digital/rosto configurado", async () => {
    injetarWebAuthn({ disponivel: false });
    expect(await biometriaDisponivel()).toBe(false);
  });

  it("é falsa quando a consulta ao autenticador falha", async () => {
    injetarWebAuthn({ disponivel: "erro" });
    expect(await biometriaDisponivel()).toBe(false);
  });
});

describe("registrarBiometria", () => {
  it("sem suporte, explica com clareza em vez de quebrar", async () => {
    await expect(registrarBiometria()).rejects.toThrow(MENSAGEM_SEM_SUPORTE);
    expect(await biometriaAtivada()).toBe(false);
  });

  it("cria a credencial de plataforma e guarda a referência local", async () => {
    let opcoes: CredentialCreationOptions | undefined;
    injetarWebAuthn({
      create: async (recebidas) => {
        opcoes = recebidas;
        return credencialFalsa([1, 2, 3, 255]);
      },
    });

    const registro = await registrarBiometria();

    // Pedimos autenticador do próprio aparelho com verificação do usuário.
    expect(opcoes?.publicKey?.authenticatorSelection).toMatchObject({
      authenticatorAttachment: "platform",
      userVerification: "required",
    });

    expect(registro.id).toBeTruthy();
    expect(registro.publicKey).toBeTruthy();
    expect(await biometriaAtivada()).toBe(true);
    expect(await obterCredencial()).toMatchObject({ id: registro.id });
  });

  it("quando a pessoa cancela ou o aparelho falha, orienta a tentar de novo", async () => {
    injetarWebAuthn({
      create: vi.fn(async () => {
        throw new Error("NotAllowedError");
      }),
    });
    await expect(registrarBiometria()).rejects.toThrow(MENSAGEM_FALHA_REGISTRO);
    expect(await biometriaAtivada()).toBe(false);
  });
});

describe("desbloquearComBiometria", () => {
  it("sem biometria ativada, avisa que é preciso ativar em Ajustes", async () => {
    injetarWebAuthn();
    await expect(desbloquearComBiometria()).rejects.toThrow(/Ative em Ajustes/);
    expect(appDesbloqueadoNaSessao()).toBe(false);
  });

  it("com a digital reconhecida, destrava o app na sessão de página", async () => {
    let opcoes: CredentialRequestOptions | undefined;
    injetarWebAuthn({
      create: async () => credencialFalsa([1, 2, 3, 255]),
      get: async (recebidas) => {
        opcoes = recebidas;
        return { id: "ok" };
      },
    });
    const registro = await registrarBiometria();
    reiniciarSessaoDeBloqueio(); // simula nova abertura do app

    await desbloquearComBiometria();

    expect(appDesbloqueadoNaSessao()).toBe(true);
    // A assertion restringe às credenciais deste aparelho (allowCredentials).
    expect(opcoes?.publicKey?.userVerification).toBe("required");
    const permitida = opcoes?.publicKey?.allowCredentials?.[0];
    expect(permitida?.type).toBe("public-key");
    expect(new Uint8Array(permitida!.id as ArrayBuffer)).toEqual(
      new Uint8Array([1, 2, 3, 255]),
    );
    expect(registro.id).toBeTruthy();
  });

  it("com biometria não reconhecida, mantém o app travado", async () => {
    injetarWebAuthn({
      create: vi.fn(async () => credencialFalsa([7])),
      get: vi.fn(async () => {
        throw new Error("NotAllowedError");
      }),
    });
    await registrarBiometria();
    reiniciarSessaoDeBloqueio();

    await expect(desbloquearComBiometria()).rejects.toThrow(
      MENSAGEM_FALHA_DESBLOQUEIO,
    );
    expect(appDesbloqueadoNaSessao()).toBe(false);
  });
});

describe("desativarBiometria", () => {
  it("remove a credencial local e o app volta a abrir sem trava", async () => {
    injetarWebAuthn({ create: vi.fn(async () => credencialFalsa([4, 5])) });
    await registrarBiometria();
    expect(await biometriaAtivada()).toBe(true);

    await desativarBiometria();

    expect(await biometriaAtivada()).toBe(false);
    expect(await obterCredencial()).toBeNull();
  });
});
