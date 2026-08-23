import { afterEach, describe, expect, it, vi } from "vitest";
import { garantirArmazenamentoPersistente } from "./armazenamento";

/**
 * Armazenamento persistente: sem ele o navegador pode apagar o IndexedDB
 * (e as visitas ainda não enviadas) quando o aparelho ficar sem espaço.
 */

const original = Object.getOwnPropertyDescriptor(navigator, "storage");

function comStorage(valor: unknown) {
  Object.defineProperty(navigator, "storage", {
    configurable: true,
    value: valor,
  });
}

afterEach(() => {
  if (original) Object.defineProperty(navigator, "storage", original);
  else comStorage(undefined);
});

describe("garantirArmazenamentoPersistente", () => {
  it("não pede de novo quando já está persistente", async () => {
    const persist = vi.fn(async () => true);
    comStorage({ persisted: vi.fn(async () => true), persist });

    expect(await garantirArmazenamentoPersistente()).toBe("persistente");
    expect(persist).not.toHaveBeenCalled();
  });

  it("pede persistência quando ainda não há e comemora o sim", async () => {
    const persist = vi.fn(async () => true);
    comStorage({ persisted: vi.fn(async () => false), persist });

    expect(await garantirArmazenamentoPersistente()).toBe("persistente");
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("reporta armazenamento temporário quando o navegador recusa", async () => {
    comStorage({
      persisted: vi.fn(async () => false),
      persist: vi.fn(async () => false),
    });

    expect(await garantirArmazenamentoPersistente()).toBe("temporario");
  });

  it("trata a ausência da API sem lançar", async () => {
    comStorage(undefined);
    expect(await garantirArmazenamentoPersistente()).toBe("indisponivel");

    comStorage({ estimate: vi.fn() });
    expect(await garantirArmazenamentoPersistente()).toBe("indisponivel");
  });

  it("nunca lança quando a API do navegador falha", async () => {
    comStorage({
      persisted: vi.fn(async () => {
        throw new Error("falhou");
      }),
      persist: vi.fn(async () => true),
    });
    expect(await garantirArmazenamentoPersistente()).toBe("indisponivel");

    comStorage({
      persisted: vi.fn(async () => false),
      persist: vi.fn(async () => {
        throw new Error("falhou");
      }),
    });
    expect(await garantirArmazenamentoPersistente()).toBe("indisponivel");
  });
});
