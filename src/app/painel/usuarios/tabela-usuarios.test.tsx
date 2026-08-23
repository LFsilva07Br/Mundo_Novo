import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Perfil } from "@/lib/equipe/validacao";
import { TabelaUsuarios } from "./tabela-usuarios";

vi.mock("@/lib/equipe/acoes", () => ({
  convidarUsuario: vi.fn(),
  atualizarPerfil: vi.fn(),
  reenviarConvite: vi.fn(),
}));

// O Toaster do sonner depende de window.matchMedia, que o jsdom não tem.
vi.mock("@/components/ui/sonner", () => ({ Toaster: () => null }));

const PERFIS: Perfil[] = [
  {
    id: "6f9619ff-8b86-4d01-b42d-00cf4fc964ff",
    nome: "Tâmara Isa da Silva",
    email: "tamara@mundonovo.agr.br",
    papel: "gestor",
    alcadaAprovacao: true,
    ativo: true,
  },
  {
    id: "7a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d",
    nome: "Winicius Baquião Dutra",
    email: "winicius@mundonovo.agr.br",
    papel: "consultor",
    alcadaAprovacao: false,
    ativo: false,
  },
];

describe("TabelaUsuarios", () => {
  afterEach(cleanup);

  it("lista nome, e-mail, papel e status de cada perfil", () => {
    render(
      <TabelaUsuarios
        perfis={PERFIS}
        bancoConectado={true}
        conviteDisponivel={true}
      />,
    );

    expect(screen.getByText("Tâmara Isa da Silva")).toBeInTheDocument();
    expect(screen.getByText("tamara@mundonovo.agr.br")).toBeInTheDocument();
    expect(screen.getByText("Winicius Baquião Dutra")).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
    expect(screen.getByText("Inativo")).toBeInTheDocument();
  });

  it("reflete a alçada de aprovação nos interruptores", () => {
    render(
      <TabelaUsuarios
        perfis={PERFIS}
        bancoConectado={true}
        conviteDisponivel={true}
      />,
    );

    expect(
      screen.getByRole("switch", {
        name: "Alçada de aprovação de Tâmara Isa da Silva",
      }),
    ).toBeChecked();
    expect(
      screen.getByRole("switch", {
        name: "Alçada de aprovação de Winicius Baquião Dutra",
      }),
    ).not.toBeChecked();
  });

  it("sem banco conectado, vira somente leitura com aviso de demonstração", () => {
    render(
      <TabelaUsuarios
        perfis={PERFIS}
        bancoConectado={false}
        conviteDisponivel={false}
      />,
    );

    expect(screen.getByText(/somente leitura/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Convidar usuário" }),
    ).toBeDisabled();
    for (const interruptor of screen.getAllByRole("switch")) {
      expect(interruptor).toBeDisabled();
    }
    expect(
      screen.getByRole("button", { name: /Desativar/ }),
    ).toBeDisabled();
  });

  it("com banco mas sem service key, edita perfis porém convite fica indisponível", () => {
    render(
      <TabelaUsuarios
        perfis={PERFIS}
        bancoConectado={true}
        conviteDisponivel={false}
      />,
    );

    expect(
      screen.getByText(/disponível no ambiente publicado/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Convidar usuário" }),
    ).toBeDisabled();
    for (const interruptor of screen.getAllByRole("switch")) {
      expect(interruptor).toBeEnabled();
    }
    expect(
      screen.getByRole("button", {
        name: "Reenviar convite para Tâmara Isa da Silva",
      }),
    ).toBeDisabled();
  });

  it("com tudo disponível, o botão de convidar fica habilitado", () => {
    render(
      <TabelaUsuarios
        perfis={PERFIS}
        bancoConectado={true}
        conviteDisponivel={true}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Convidar usuário" }),
    ).toBeEnabled();
  });
});
