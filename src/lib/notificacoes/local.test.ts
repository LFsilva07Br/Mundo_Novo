// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./acoes", () => ({
  salvarAssinaturaPush: vi.fn(async () => ({ ok: true, mensagem: "ok" })),
}));

import {
  contarTarefasNovas,
  estadoPermissao,
  notificar,
  pedirPermissao,
} from "./local";
import { esquemaAssinaturaPush } from "./validacao";

/** Instala um mock global de Notification com a permissão desejada. */
function mockNotification(permission: NotificationPermission) {
  const requestPermission = vi.fn(async () => "granted" as NotificationPermission);
  const construtor = vi.fn();
  const NotificationMock = Object.assign(construtor, {
    permission,
    requestPermission,
  });
  vi.stubGlobal("Notification", NotificationMock);
  return { requestPermission, construtor };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pedirPermissao", () => {
  it("devolve 'unsupported' quando o navegador não tem Notification", () => {
    // jsdom não define Notification por padrão
    expect(estadoPermissao()).toBe("unsupported");
  });

  it("pede a permissão quando ainda não foi decidida", async () => {
    const { requestPermission } = mockNotification("default");
    await expect(pedirPermissao()).resolves.toBe("granted");
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });

  it("não pede de novo quando já foi negada", async () => {
    const { requestPermission } = mockNotification("denied");
    await expect(pedirPermissao()).resolves.toBe("denied");
    expect(requestPermission).not.toHaveBeenCalled();
  });
});

describe("notificar", () => {
  it("não notifica sem permissão concedida", async () => {
    const { construtor } = mockNotification("denied");
    await expect(notificar("Título", "Corpo")).resolves.toBe(false);
    expect(construtor).not.toHaveBeenCalled();
  });

  it("usa new Notification como fallback quando não há service worker", async () => {
    const { construtor } = mockNotification("granted");
    await expect(notificar("3 novos alertas", "Abra o app")).resolves.toBe(true);
    expect(construtor).toHaveBeenCalledWith(
      "3 novos alertas",
      expect.objectContaining({ body: "Abra o app" }),
    );
  });
});

describe("contarTarefasNovas", () => {
  const t = (id: string) => ({ id });

  it("conta apenas tarefas que não existiam antes", () => {
    expect(contarTarefasNovas([t("a"), t("b")], [t("a"), t("b"), t("c"), t("d")])).toBe(2);
  });

  it("devolve 0 sem pacote anterior (primeiro download não alarma)", () => {
    expect(contarTarefasNovas(null, [t("a")])).toBe(0);
    expect(contarTarefasNovas([], [t("a")])).toBe(0);
  });

  it("devolve 0 quando nada mudou ou tarefas saíram", () => {
    expect(contarTarefasNovas([t("a"), t("b")], [t("a")])).toBe(0);
  });
});

describe("esquemaAssinaturaPush", () => {
  it("aceita assinatura completa", () => {
    expect(
      esquemaAssinaturaPush.safeParse({
        endpoint: "https://fcm.googleapis.com/fcm/send/abc",
        p256dh: "chave",
        auth: "segredo",
      }).success,
    ).toBe(true);
  });

  it("rejeita endpoint que não é URL", () => {
    expect(
      esquemaAssinaturaPush.safeParse({
        endpoint: "nao-e-url",
        p256dh: "chave",
        auth: "segredo",
      }).success,
    ).toBe(false);
  });
});
