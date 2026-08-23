import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import PaginaCanalQueixas from "./page";
import { FormularioQueixa } from "./formulario-queixa";

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

describe("Página pública do canal de queixas", () => {
  it("mostra o acolhimento com o nome do cliente (modo demonstração)", async () => {
    const props = {
      params: Promise.resolve({ clienteId: "alto-da-serra" }),
      searchParams: Promise.resolve({}),
    } as unknown as Parameters<typeof PaginaCanalQueixas>[0];
    render(await PaginaCanalQueixas(props));

    expect(
      screen.getByRole("heading", { name: "Canal de escuta" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Fazenda Alto da Serra")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Enviar relato" }),
    ).toBeInTheDocument();
  });
});

describe("Formulário público de queixa", () => {
  it("nasce anônimo por padrão, com contato escondido", () => {
    render(<FormularioQueixa clienteId="alto-da-serra" />);

    expect(
      screen.getByRole("checkbox", { name: /Quero deixar um contato/ }),
    ).not.toBeChecked();
    expect(
      screen.queryByLabelText("Como podemos falar com você?"),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("O que você quer contar?")).toBeRequired();
  });

  it("envia anônimo por padrão e mostra a confirmação empática", async () => {
    const usuario = userEvent.setup();
    const fetchFalso = vi
      .fn()
      .mockResolvedValue(
        respostaJson({ ok: true, mensagem: "Recebemos o seu relato." }),
      );
    vi.stubGlobal("fetch", fetchFalso);

    render(<FormularioQueixa clienteId="alto-da-serra" />);
    await usuario.type(
      screen.getByLabelText("O que você quer contar?"),
      "O chuveiro do alojamento está sem água quente.",
    );
    await usuario.click(screen.getByRole("button", { name: "Enviar relato" }));

    await waitFor(() =>
      expect(
        screen.getByText("Relato recebido com segurança"),
      ).toBeInTheDocument(),
    );

    expect(fetchFalso).toHaveBeenCalledWith(
      "/api/queixas",
      expect.objectContaining({ method: "POST" }),
    );
    const corpo = JSON.parse(
      (fetchFalso.mock.calls[0][1] as RequestInit).body as string,
    ) as { clienteId: string; anonima: boolean; contato?: string };
    expect(corpo.clienteId).toBe("alto-da-serra");
    expect(corpo.anonima).toBe(true);
    expect(corpo.contato).toBeUndefined();
  });

  it("permite se identificar e envia o contato informado", async () => {
    const usuario = userEvent.setup();
    const fetchFalso = vi
      .fn()
      .mockResolvedValue(respostaJson({ ok: true, mensagem: "Recebido." }));
    vi.stubGlobal("fetch", fetchFalso);

    render(<FormularioQueixa clienteId="alto-da-serra" />);
    await usuario.type(
      screen.getByLabelText("O que você quer contar?"),
      "Gostaria de conversar sobre o pagamento das horas extras.",
    );
    await usuario.click(
      screen.getByRole("checkbox", { name: /Quero deixar um contato/ }),
    );
    await usuario.type(
      screen.getByLabelText("Como podemos falar com você?"),
      "Maria — (35) 99999-0000",
    );
    await usuario.click(screen.getByRole("button", { name: "Enviar relato" }));

    await waitFor(() => expect(fetchFalso).toHaveBeenCalled());
    const corpo = JSON.parse(
      (fetchFalso.mock.calls[0][1] as RequestInit).body as string,
    ) as { anonima: boolean; contato?: string };
    expect(corpo.anonima).toBe(false);
    expect(corpo.contato).toBe("Maria — (35) 99999-0000");
  });

  it("mostra o erro devolvido pelo servidor sem perder o texto", async () => {
    const usuario = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        respostaJson(
          { ok: false, erro: "Muitos envios em pouco tempo." },
          429,
        ),
      ),
    );

    render(<FormularioQueixa clienteId="alto-da-serra" />);
    await usuario.type(
      screen.getByLabelText("O que você quer contar?"),
      "Relato de teste com detalhes suficientes.",
    );
    await usuario.click(screen.getByRole("button", { name: "Enviar relato" }));

    expect(
      await screen.findByText("Muitos envios em pouco tempo."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("O que você quer contar?")).toHaveDisplayValue(
      "Relato de teste com detalhes suficientes.",
    );
  });
});
