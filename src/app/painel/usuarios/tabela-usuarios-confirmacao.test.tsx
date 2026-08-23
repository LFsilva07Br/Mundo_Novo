import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Perfil } from "@/lib/equipe/validacao";
import { atualizarPerfil } from "@/lib/equipe/acoes";
import { TabelaUsuarios } from "./tabela-usuarios";

vi.mock("@/lib/equipe/acoes", () => ({
  convidarUsuario: vi.fn(),
  atualizarPerfil: vi.fn(async () => ({
    ok: true,
    mensagem: "Acesso desativado.",
  })),
  reenviarConvite: vi.fn(),
}));

// O Toaster do sonner depende de window.matchMedia, que o jsdom não tem.
vi.mock("@/components/ui/sonner", () => ({ Toaster: () => null }));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { toast } from "sonner";

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

const ATIVA: Perfil = {
  id: "6f9619ff-8b86-4d01-b42d-00cf4fc964ff",
  nome: "Tâmara Isa da Silva",
  email: "tamara@mundonovo.agr.br",
  papel: "gestor",
  alcadaAprovacao: true,
  ativo: true,
};

const INATIVA: Perfil = {
  id: "7a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d",
  nome: "Winicius Baquião Dutra",
  email: "winicius@mundonovo.agr.br",
  papel: "consultor",
  alcadaAprovacao: false,
  ativo: false,
};

function renderizar(perfis: Perfil[] = [ATIVA, INATIVA]) {
  return render(
    <TabelaUsuarios
      perfis={perfis}
      bancoConectado={true}
      conviteDisponivel={true}
    />,
  );
}

describe("TabelaUsuarios — desativação com confirmação", () => {
  it("desativar pergunta antes, dizendo que o histórico fica", async () => {
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(screen.getByRole("button", { name: "Desativar" }));

    expect(
      screen.getByText("Desativar o acesso de Tâmara Isa da Silva?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/perde o acesso ao painel e ao app de campo/),
    ).toBeInTheDocument();
    expect(screen.getByText("O que não muda:")).toBeInTheDocument();
    expect(
      screen.getByText(/visitas, laudos assinados, CAPAs e a trilha/),
    ).toBeInTheDocument();
    expect(atualizarPerfil).not.toHaveBeenCalled();
  });

  it("cancelar mantém a pessoa ativa", async () => {
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(screen.getByRole("button", { name: "Desativar" }));
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(atualizarPerfil).not.toHaveBeenCalled();
  });

  it("confirmar desativa e avisa", async () => {
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(screen.getByRole("button", { name: "Desativar" }));
    await usuario.click(
      screen.getByRole("button", { name: "Desativar acesso" }),
    );

    await waitFor(() => {
      expect(atualizarPerfil).toHaveBeenCalledWith(ATIVA.id, { ativo: false });
    });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Acesso desativado.");
    });
  });

  it("reativar é reversível e não pede confirmação", async () => {
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(screen.getByRole("button", { name: "Reativar" }));

    await waitFor(() => {
      expect(atualizarPerfil).toHaveBeenCalledWith(INATIVA.id, { ativo: true });
    });
  });

  it("sem ninguém na equipe, a tabela explica o vazio", () => {
    renderizar([]);

    expect(
      screen.getByText("Nenhuma pessoa na equipe ainda."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Convide o primeiro integrante/),
    ).toBeInTheDocument();
  });
});
