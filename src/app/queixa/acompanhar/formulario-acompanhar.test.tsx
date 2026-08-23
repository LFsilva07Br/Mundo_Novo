import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import PaginaAcompanharQueixa from "./page";
import { FormularioAcompanhar } from "./formulario-acompanhar";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function respostaJson(corpo: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => corpo,
  } as Response;
}

describe("Consulta anônima por protocolo", () => {
  it("usa título de aba neutro e não pede nome nem telefone", () => {
    render(<PaginaAcompanharQueixa />);

    expect(screen.getByLabelText("Código do seu relato")).toBeInTheDocument();
    expect(screen.queryByLabelText(/nome/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/telefone/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/e-mail/i)).not.toBeInTheDocument();
  });

  it("explica o formato antes de chamar o servidor", async () => {
    const usuario = userEvent.setup();
    const fetchFalso = vi.fn();
    vi.stubGlobal("fetch", fetchFalso);

    render(<FormularioAcompanhar />);
    await usuario.type(screen.getByLabelText("Código do seu relato"), "ABC");
    await usuario.click(
      screen.getByRole("button", { name: /Ver a situação do meu relato/ }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(/8 letras/);
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it("consulta e mostra a situação sem revelar o texto do relato", async () => {
    const usuario = userEvent.setup();
    const fetchFalso = vi.fn().mockResolvedValue(
      respostaJson({
        ok: true,
        consulta: {
          protocolo: "K7QM3XZ2",
          situacao: "em_analise",
          rotulo: "Em apuração",
          explicacao: "A equipe de certificação está apurando o que você contou.",
          recebidoEm: "2026-08-10T10:00:00Z",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchFalso);

    render(<FormularioAcompanhar />);
    await usuario.type(
      screen.getByLabelText("Código do seu relato"),
      "k7qm-3xz2",
    );
    await usuario.click(
      screen.getByRole("button", { name: /Ver a situação do meu relato/ }),
    );

    await waitFor(() =>
      expect(screen.getByText("Em apuração")).toBeInTheDocument(),
    );
    expect(screen.getByText("Relato K7QM-3XZ2")).toBeInTheDocument();
    expect(fetchFalso.mock.calls[0][0]).toContain("protocolo=K7QM-3XZ2");
  });

  it("oferece 'Sair e limpar' depois da consulta (celular emprestado)", async () => {
    const usuario = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        respostaJson({
          ok: true,
          consulta: {
            protocolo: "K7QM3XZ2",
            situacao: "recebida",
            rotulo: "Recebido",
            explicacao: "Chegou à equipe.",
            recebidoEm: null,
          },
        }),
      ),
    );
    const replace = vi.fn();
    vi.stubGlobal("location", { ...window.location, replace });

    render(<FormularioAcompanhar />);
    await usuario.type(
      screen.getByLabelText("Código do seu relato"),
      "K7QM3XZ2",
    );
    await usuario.click(
      screen.getByRole("button", { name: /Ver a situação do meu relato/ }),
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Sair e limpar" })).toBeInTheDocument(),
    );
    await usuario.click(screen.getByRole("button", { name: "Sair e limpar" }));
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("avisa com calma quando o código não é encontrado", async () => {
    const usuario = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        respostaJson(
          { ok: false, erro: "Não encontramos nenhum relato com esse código." },
          404,
        ),
      ),
    );

    render(<FormularioAcompanhar />);
    await usuario.type(
      screen.getByLabelText("Código do seu relato"),
      "K7QM3XZ2",
    );
    await usuario.click(
      screen.getByRole("button", { name: /Ver a situação do meu relato/ }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Não encontramos nenhum relato/,
    );
  });
});
