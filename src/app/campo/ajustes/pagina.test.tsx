import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/** Ajustes do aparelho: biometria, espaço usado e limpeza manual. */

const { estado, notificacoes, armazenamento } = vi.hoisted(() => ({
  estado: { disponivel: true, ativada: false },
  notificacoes: { permissao: "default" as string },
  armazenamento: { persistido: true, concede: true },
}));

vi.mock("@/lib/notificacoes/local", () => ({
  estadoPermissao: vi.fn(() => notificacoes.permissao),
  pedirPermissao: vi.fn(async () => {
    notificacoes.permissao = "granted";
    return "granted";
  }),
  guardarAssinaturaPush: vi.fn(async () => ({
    ok: false,
    aviso: "Push de servidor ainda não configurado (sem chave VAPID).",
  })),
  notificar: vi.fn(async () => true),
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
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { toast } from "sonner";
import { limparVisitasSincronizadas } from "@/lib/campo/banco-local";
import { registrarBiometria } from "@/lib/campo/biometria";
import { notificar, pedirPermissao } from "@/lib/notificacoes/local";
import PaginaAjustesCampo from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  estado.disponivel = true;
  estado.ativada = false;
  notificacoes.permissao = "default";
  armazenamento.persistido = true;
  armazenamento.concede = true;
  Object.defineProperty(navigator, "storage", {
    configurable: true,
    value: {
      estimate: vi.fn(async () => ({
        usage: 12.3 * 1024 * 1024,
        quota: 3 * 1024 * 1024 * 1024,
      })),
      persisted: vi.fn(async () => armazenamento.persistido),
      persist: vi.fn(async () => armazenamento.concede),
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

  it("ativa as notificações e envia a notificação de teste", async () => {
    render(<PaginaAjustesCampo />);

    await userEvent.click(
      await screen.findByRole("button", {
        name: /Ativar notificações no aparelho/,
      }),
    );

    expect(pedirPermissao).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Notificações ativadas neste aparelho!",
      ),
    );
    // Sem chave VAPID configurada, avisa que só as locais estão ativas.
    expect(toast.info).toHaveBeenCalled();

    await userEvent.click(
      await screen.findByRole("button", {
        name: /Enviar notificação de teste/,
      }),
    );
    expect(notificar).toHaveBeenCalledWith(
      expect.stringContaining("teste"),
      expect.any(String),
    );
  });

  it("mostra que o armazenamento das visitas está protegido", async () => {
    render(<PaginaAjustesCampo />);

    expect(
      await screen.findByText("Armazenamento protegido"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/não vai apagar as visitas deste aparelho/),
    ).toBeInTheDocument();
  });

  it("alerta quando o navegador não protege o armazenamento", async () => {
    armazenamento.persistido = false;
    armazenamento.concede = false;
    render(<PaginaAjustesCampo />);

    expect(
      await screen.findByText("Armazenamento sem proteção"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/pode apagar visitas ainda não enviadas/),
    ).toBeInTheDocument();
  });

  it("explica quando o navegador não informa a proteção", async () => {
    Object.defineProperty(navigator, "storage", {
      configurable: true,
      value: { estimate: vi.fn(async () => ({ usage: 0, quota: 0 })) },
    });
    render(<PaginaAjustesCampo />);

    expect(
      await screen.findByText("Proteção desconhecida"),
    ).toBeInTheDocument();
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
