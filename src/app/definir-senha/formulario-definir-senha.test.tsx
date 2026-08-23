import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormularioDefinirSenha } from "./formulario-definir-senha";

/**
 * Sem env do Supabase o cliente vem null: o formulário cai direto no estado
 * "link não vale mais", que é exatamente o caso do convite expirado.
 */

const parametros = vi.hoisted(() => ({ valor: new URLSearchParams() }));
const sessao = vi.hoisted(() => ({ existe: false }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => parametros.valor,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () =>
    sessao.existe
      ? {
          auth: {
            getSession: async () => ({ data: { session: { user: {} } } }),
            onAuthStateChange: () => ({
              data: { subscription: { unsubscribe: vi.fn() } },
            }),
            updateUser: vi.fn(),
          },
        }
      : null,
}));

vi.mock("./acoes", () => ({ confirmarTrocaSenha: vi.fn() }));

beforeEach(() => {
  parametros.valor = new URLSearchParams();
  sessao.existe = false;
});

afterEach(cleanup);

describe("Convite expirado", () => {
  it("transforma as saídas em botões de verdade", async () => {
    render(<FormularioDefinirSenha />);

    expect(
      await screen.findByText("Este link não vale mais."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Receber um link novo por e-mail/ }),
    ).toHaveAttribute("href", "/recuperar-senha");
    expect(
      screen.getByRole("link", { name: /Já tenho senha — ir para a entrada/ }),
    ).toHaveAttribute("href", "/login");
  });

  it("explica que a culpa não é de quem clicou", async () => {
    render(<FormularioDefinirSenha />);
    expect(
      await screen.findByText(/Não é problema seu/),
    ).toBeInTheDocument();
  });
});

describe("Troca obrigatória de senha (?obrigatoria=1)", () => {
  beforeEach(() => {
    sessao.existe = true;
  });

  it("lê o parâmetro e explica por que a pessoa está ali", async () => {
    parametros.valor = new URLSearchParams("obrigatoria=1");
    render(<FormularioDefinirSenha />);

    expect(
      await screen.findByText(
        "Você precisa criar uma senha nova para continuar.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/senha temporária enviada pela equipe/),
    ).toBeInTheDocument();
  });

  it("sem o parâmetro, não inventa aviso de troca obrigatória", async () => {
    render(<FormularioDefinirSenha />);

    await waitFor(() =>
      expect(screen.getByLabelText("Nova senha")).toBeInTheDocument(),
    );
    expect(
      screen.queryByText("Você precisa criar uma senha nova para continuar."),
    ).not.toBeInTheDocument();
  });

  it("explica a regra dos 8 caracteres ANTES de virar erro", async () => {
    render(<FormularioDefinirSenha />);

    await waitFor(() =>
      expect(screen.getByLabelText("Nova senha")).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/Precisa ter no mínimo 8 caracteres/),
    ).toBeInTheDocument();
    // Só a orientação — nenhum alerta vermelho antes de a pessoa tentar.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Nova senha")).toHaveAttribute(
      "minlength",
      "8",
    );
  });
});
