import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ContatoCliente } from "@/lib/carteira/tipos";
import { removerContato } from "@/lib/carteira/acoes";
import { ContatosCliente } from "./contatos-cliente";

vi.mock("@/lib/carteira/acoes", () => ({
  adicionarContato: vi.fn(),
  removerContato: vi.fn(async () => ({
    ok: true,
    mensagem: "Contato removido.",
  })),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { toast } from "sonner";

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

const CONTATOS: ContatoCliente[] = [
  { nome: "Silvio Dutra", area: "proprietario", telefone: "(35) 99999-0001" },
];

function renderizar() {
  return render(
    <ContatosCliente
      clienteId="alto-da-serra"
      clienteNome="Fazenda Alto da Serra"
      contatos={CONTATOS}
    />,
  );
}

describe("ContatosCliente — remoção com confirmação", () => {
  it("clicar na lixeira apenas pergunta; nada é removido ainda", async () => {
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(
      screen.getByRole("button", { name: "Remover contato Silvio Dutra" }),
    );

    expect(
      screen.getByText("Remover Silvio Dutra dos contatos?"),
    ).toBeInTheDocument();
    expect(screen.getByText(/deixa de ser o contato de proprietário/)).toBeInTheDocument();
    expect(screen.getByText("O que não muda:")).toBeInTheDocument();
    expect(removerContato).not.toHaveBeenCalled();
  });

  it("cancelar mantém o contato", async () => {
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(
      screen.getByRole("button", { name: "Remover contato Silvio Dutra" }),
    );
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(removerContato).not.toHaveBeenCalled();
    expect(screen.getByText("Silvio Dutra")).toBeInTheDocument();
  });

  it("confirmar remove o contato e avisa", async () => {
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(
      screen.getByRole("button", { name: "Remover contato Silvio Dutra" }),
    );
    await usuario.click(
      screen.getByRole("button", { name: "Remover contato" }),
    );

    await waitFor(() => {
      expect(removerContato).toHaveBeenCalledWith(
        "alto-da-serra",
        "Silvio Dutra",
        "proprietario",
      );
    });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Contato removido.");
    });
  });

  it("erro da remoção vira aviso de erro", async () => {
    vi.mocked(removerContato).mockResolvedValueOnce({
      ok: false,
      erro: "Contato não encontrado.",
    } as never);
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(
      screen.getByRole("button", { name: "Remover contato Silvio Dutra" }),
    );
    await usuario.click(
      screen.getByRole("button", { name: "Remover contato" }),
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Contato não encontrado.");
    });
  });
});
