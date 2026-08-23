import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/** Convite de instalação do PWA: discreto, útil e dispensável para sempre. */

const { config } = vi.hoisted(() => ({ config: new Map<string, unknown>() }));

vi.mock("@/lib/campo/banco-local", () => ({
  gravarConfigLocal: vi.fn(async (chave: string, valor: unknown) => {
    config.set(chave, valor);
  }),
  obterConfigLocal: vi.fn(async (chave: string) => config.get(chave) ?? null),
}));

import { CHAVE_CONVITE_INSTALACAO } from "@/lib/campo/instalacao";
import { ConviteInstalacao } from "./convite-instalacao";

function definirUserAgent(valor: string) {
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    value: valor,
  });
}

/** Simula o navegador oferecendo a instalação (Chrome/Edge). */
function dispararBeforeInstallPrompt(
  escolha: "accepted" | "dismissed" = "accepted",
) {
  const evento = new Event("beforeinstallprompt") as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  };
  evento.prompt = vi.fn(async () => undefined);
  evento.userChoice = Promise.resolve({ outcome: escolha });
  window.dispatchEvent(evento);
  return evento;
}

beforeEach(() => {
  config.clear();
  definirUserAgent("Mozilla/5.0 (Linux; Android 14; SM-A546E)");
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({ matches: false })),
  });
});

describe("ConviteInstalacao", () => {
  it("mostra o passo a passo do Android quando o navegador não oferece o convite", async () => {
    render(<ConviteInstalacao />);

    expect(
      await screen.findByText("Instale o app na tela de início"),
    ).toBeInTheDocument();
    expect(screen.getByText(/menu do navegador/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Instalar agora" }),
    ).not.toBeInTheDocument();
  });

  it("mostra a instrução do iPhone quando é iOS", async () => {
    definirUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)");
    render(<ConviteInstalacao />);

    expect(await screen.findByText(/Compartilhar/)).toBeInTheDocument();
  });

  it("instala com um toque quando o navegador oferece o beforeinstallprompt", async () => {
    render(<ConviteInstalacao />);
    await screen.findByText("Instale o app na tela de início");

    const evento = dispararBeforeInstallPrompt("accepted");
    const botao = await screen.findByRole("button", { name: "Instalar agora" });
    await userEvent.click(botao);

    expect(evento.prompt).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(
        screen.queryByText("Instale o app na tela de início"),
      ).not.toBeInTheDocument(),
    );
  });

  it("some e não volta quando dispensado — a escolha fica no aparelho", async () => {
    const { unmount } = render(<ConviteInstalacao />);
    await screen.findByText("Instale o app na tela de início");

    await userEvent.click(
      screen.getByRole("button", { name: "Dispensar convite de instalação" }),
    );

    await waitFor(() =>
      expect(config.get(CHAVE_CONVITE_INSTALACAO)).toBe(true),
    );
    expect(
      screen.queryByText("Instale o app na tela de início"),
    ).not.toBeInTheDocument();

    // Próxima abertura do app: continua fora do caminho.
    unmount();
    render(<ConviteInstalacao />);
    await waitFor(() =>
      expect(
        screen.queryByText("Instale o app na tela de início"),
      ).not.toBeInTheDocument(),
    );
  });

  it("não aparece quando o app já está instalado", async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: true })),
    });
    render(<ConviteInstalacao />);

    await waitFor(() =>
      expect(
        screen.queryByText("Instale o app na tela de início"),
      ).not.toBeInTheDocument(),
    );
  });
});
