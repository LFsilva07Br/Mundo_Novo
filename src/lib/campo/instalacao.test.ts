import { beforeEach, describe, expect, it, vi } from "vitest";

/** Convite de instalação do PWA: dispensa guardada no IndexedDB. */

const { config } = vi.hoisted(() => ({ config: new Map<string, unknown>() }));

vi.mock("./banco-local", () => ({
  gravarConfigLocal: vi.fn(async (chave: string, valor: unknown) => {
    config.set(chave, valor);
  }),
  obterConfigLocal: vi.fn(async (chave: string) => config.get(chave) ?? null),
}));

import {
  CHAVE_CONVITE_INSTALACAO,
  conviteDispensado,
  detectarPlataforma,
  dispensarConvite,
  instrucaoInstalacao,
} from "./instalacao";

beforeEach(() => {
  config.clear();
});

describe("detectarPlataforma", () => {
  it("reconhece iPhone e iPad", () => {
    expect(detectarPlataforma("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)")).toBe(
      "ios",
    );
    expect(detectarPlataforma("Mozilla/5.0 (iPad; CPU OS 18_0)")).toBe("ios");
  });

  it("reconhece Android", () => {
    expect(detectarPlataforma("Mozilla/5.0 (Linux; Android 14; SM-A546E)")).toBe(
      "android",
    );
  });

  it("cai no genérico no desktop", () => {
    expect(detectarPlataforma("Mozilla/5.0 (X11; Linux x86_64)")).toBe("outro");
  });
});

describe("instrucaoInstalacao", () => {
  it("ensina o caminho de cada plataforma em linguagem de campo", () => {
    expect(instrucaoInstalacao("ios")).toContain("Tela de Início");
    expect(instrucaoInstalacao("android")).toContain("Instalar app");
    expect(instrucaoInstalacao("outro")).toContain("tela inicial");
  });
});

describe("dispensa do convite", () => {
  it("começa não dispensado e fica dispensado para sempre", async () => {
    expect(await conviteDispensado()).toBe(false);

    await dispensarConvite();

    expect(config.get(CHAVE_CONVITE_INSTALACAO)).toBe(true);
    expect(await conviteDispensado()).toBe(true);
  });
});
