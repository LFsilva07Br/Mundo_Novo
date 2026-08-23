import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/** Ajustes do aparelho: biometria, espaço usado e limpeza manual. */

const { estado } = vi.hoisted(() => ({
  estado: { disponivel: true, ativada: false },
}));

vi.mock("@/lib/campo/biometria", () => ({
  biometriaDisponivel: vi.fn(async () => estado.disponivel),
  biometriaAtivada: vi.fn(async () => estado.ativada),
  registrarBiometria: vi.fn(async () => {
    estado.ativada = true;
    return { id: "cred", publicKey: null, criadaEm: "2026-08-23T10:00:00Z" };
  }),
  desativarBiometria: vi.fn(async () => {
    estado.ativada = false;
  }),
  marcarDesbloqueado: vi.fn(),
}));

vi.mock("@/lib/campo/banco-local", () => ({
  limparVisitasSincronizadas: vi.fn(async () => 2),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "sonner";
import { limparVisitasSincronizadas } from "@/lib/campo/banco-local";
import { registrarBiometria } from "@/lib/campo/biometria";
import PaginaAjustesCampo from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  estado.disponivel = true;
  estado.ativada = false;
  Object.defineProperty(navigator, "storage", {
    configurable: true,
    value: {
      estimate: vi.fn(async () => ({
        usage: 12.3 * 1024 * 1024,
        quota: 3 * 1024 * 1024 * 1024,
      })),
    },
  });
});

describe("Ajustes do campo", () => {
  it("mostra o espaço usado e oferece ativar a biometria", async () => {
    render(<PaginaAjustesCampo />);

    expect(
      await screen.findByRole("button", { name: /Ativar biometria/ }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByText(/usa 12,3 MB de 3 GB/, { exact: false }),
      ).toBeInTheDocument(),
    );
  });

  it("ativa a biometria com feedback claro", async () => {
    render(<PaginaAjustesCampo />);

    await userEvent.click(
      await screen.findByRole("button", { name: /Ativar biometria/ }),
    );

    expect(registrarBiometria).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining("Biometria ativada"),
    );
    expect(
      await screen.findByRole("button", { name: /Desativar biometria/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Biometria ativada neste aparelho."),
    ).toBeInTheDocument();
  });

  it("explica quando o aparelho não tem biometria", async () => {
    estado.disponivel = false;
    render(<PaginaAjustesCampo />);

    expect(
      await screen.findByText(/não oferece biometria/, { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Ativar biometria/ }),
    ).not.toBeInTheDocument();
  });

  it("limpa as visitas já sincronizadas na hora (retenção zero)", async () => {
    render(<PaginaAjustesCampo />);

    await userEvent.click(
      await screen.findByRole("button", {
        name: /Limpar visitas já sincronizadas/,
      }),
    );

    expect(limparVisitasSincronizadas).toHaveBeenCalledWith(0);
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("2 visitas sincronizadas removidas"),
      ),
    );
  });
});
