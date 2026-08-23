import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/** Tela de bloqueio: só aparece com biometria ativada e some ao destravar. */

const { estado } = vi.hoisted(() => ({
  estado: {
    ativada: false,
    desbloqueadaNaSessao: false,
    falhaDesbloqueio: null as string | null,
  },
}));

vi.mock("@/lib/campo/biometria", () => ({
  biometriaAtivada: vi.fn(async () => estado.ativada),
  appDesbloqueadoNaSessao: vi.fn(() => estado.desbloqueadaNaSessao),
  desbloquearComBiometria: vi.fn(async () => {
    if (estado.falhaDesbloqueio) throw new Error(estado.falhaDesbloqueio);
  }),
}));

import { biometriaAtivada, desbloquearComBiometria } from "@/lib/campo/biometria";
import { TelaBloqueio } from "./tela-bloqueio";

beforeEach(() => {
  vi.clearAllMocks();
  estado.ativada = false;
  estado.desbloqueadaNaSessao = false;
  estado.falhaDesbloqueio = null;
});

describe("TelaBloqueio", () => {
  it("não muda nada quando a biometria não está ativada", async () => {
    render(<TelaBloqueio />);
    await waitFor(() => expect(biometriaAtivada).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("não trava de novo quando o app já foi destravado nesta sessão", async () => {
    estado.ativada = true;
    estado.desbloqueadaNaSessao = true;
    render(<TelaBloqueio />);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("com biometria ativada, cobre o app e oferece biometria ou senha", async () => {
    estado.ativada = true;
    render(<TelaBloqueio />);

    expect(
      await screen.findByRole("dialog", { name: "App de Campo bloqueado" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Desbloquear com biometria/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Usar senha" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("destrava e some quando a biometria é reconhecida", async () => {
    estado.ativada = true;
    render(<TelaBloqueio />);

    await userEvent.click(
      await screen.findByRole("button", { name: /Desbloquear com biometria/ }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(desbloquearComBiometria).toHaveBeenCalledTimes(1);
  });

  it("mostra o erro e continua travada quando a biometria falha", async () => {
    estado.ativada = true;
    estado.falhaDesbloqueio =
      "Biometria não reconhecida. Tente de novo ou entre com a sua senha.";
    render(<TelaBloqueio />);

    await userEvent.click(
      await screen.findByRole("button", { name: /Desbloquear com biometria/ }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Biometria não reconhecida",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
