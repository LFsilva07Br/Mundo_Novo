import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PaginaCanalQueixas from "./page";
import { FormularioQueixa } from "./formulario-queixa";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function respostaJson(corpo: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => corpo,
  } as Response;
}

function props(clienteId: string) {
  return {
    params: Promise.resolve({ clienteId }),
    searchParams: Promise.resolve({}),
  } as unknown as Parameters<typeof PaginaCanalQueixas>[0];
}

describe("Página pública do canal de queixas", () => {
  it("usa título de aba neutro — celular emprestado não entrega ninguém", async () => {
    const { metadata } = await import("./page");
    // `absolute`: a aba não herda "· Mundo Novo Café" do layout raiz.
    expect(metadata.title).toEqual({ absolute: "Fale com a gente" });
  });

  it("mostra o acolhimento com o nome do cliente (modo demonstração)", async () => {
    render(await PaginaCanalQueixas(props("alto-da-serra")));

    expect(
      screen.getByRole("heading", { name: "Fale com a gente", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Fazenda Alto da Serra")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Enviar relato" }),
    ).toBeInTheDocument();
  });

  it("oferece o contato da certificadora, nunca o consultor da fazenda", async () => {
    render(await PaginaCanalQueixas(props("alto-da-serra")));

    const ajuda = screen.getByRole("region", {
      name: /Prefere falar com uma pessoa/,
    });
    expect(within(ajuda).getByText(/Equipe de Certificação/)).toBeInTheDocument();
    expect(
      within(ajuda).getByText(/não é o consultor que atende a sua fazenda/i),
    ).toBeInTheDocument();
    // Telefone do consultor do portal não pode aparecer no canal de queixas.
    expect(ajuda.textContent).not.toContain("(35) 3531-1000");
  });

  it("aponta o caminho para consultar um relato já enviado", async () => {
    render(await PaginaCanalQueixas(props("alto-da-serra")));
    expect(
      screen.getByRole("link", { name: /Consultar pelo código/ }),
    ).toHaveAttribute("href", "/queixa/acompanhar");
  });
});

describe("Endereço de canal inexistente", () => {
  it("NÃO renderiza o formulário — o relato iria para o vazio", async () => {
    render(await PaginaCanalQueixas(props("fazenda-que-nao-existe")));

    expect(
      screen.queryByRole("button", { name: "Enviar relato" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("O que você quer contar?"),
    ).not.toBeInTheDocument();
  });

  it("orienta a conferir o cartaz/QR e dá o contato direto", async () => {
    render(await PaginaCanalQueixas(props("fazenda-que-nao-existe")));

    const aviso = screen.getByRole("alert");
    expect(aviso).toHaveTextContent(/Este endereço não é de nenhuma fazenda/);
    expect(aviso).toHaveTextContent(/QR code/);
    expect(aviso).toHaveTextContent(/cartaz do canal de escuta/);
    expect(
      screen.getByRole("region", { name: /Prefere falar com uma pessoa/ }),
    ).toBeInTheDocument();
  });
});

describe("Formulário público de queixa", () => {
  beforeEach(() => {
    vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
  });

  it("mostra o bloco de confiança ANTES do campo de texto", () => {
    const { container } = render(<FormularioQueixa clienteId="alto-da-serra" />);

    const promessa = screen.getByText(
      "Ninguém da fazenda vai saber que foi você.",
    );
    expect(promessa).toBeInTheDocument();
    expect(
      screen.getByText(/não passa pelo seu patrão, gerente ou encarregado/),
    ).toBeInTheDocument();
    expect(screen.getByText("É proibido punir quem fala.")).toBeInTheDocument();
    expect(
      screen.getByText(/Se alguém te ameaçar por causa disso, conte aqui/),
    ).toBeInTheDocument();

    // Ordem no DOM: a promessa vem antes do campo de texto.
    const campo = screen.getByLabelText("O que você quer contar?");
    const posicao = promessa.compareDocumentPosition(campo);
    expect(posicao & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container).toBeTruthy();
  });

  it("nasce anônimo, com a confirmação escrita do que vale agora", () => {
    render(<FormularioQueixa clienteId="alto-da-serra" />);

    const caixa = screen.getByRole("checkbox", {
      name: /Quero enviar sem dizer quem eu sou/,
    });
    expect(caixa).toBeChecked();
    expect(caixa).toHaveClass("size-6"); // 24px, item da auditoria
    expect(
      screen.getByText(/Agora está anônimo: você não vai deixar nome nem telefone/),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Como podemos falar com você?"),
    ).not.toBeInTheDocument();
  });

  it("desmarcar troca a confirmação textual e abre o contato", async () => {
    const usuario = userEvent.setup();
    render(<FormularioQueixa clienteId="alto-da-serra" />);

    await usuario.click(
      screen.getByRole("checkbox", { name: /Quero enviar sem dizer quem eu sou/ }),
    );

    expect(
      screen.getByText(/Agora NÃO está anônimo: você vai deixar um contato/),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Como podemos falar com você?"),
    ).toBeInTheDocument();
  });

  it("envia anônimo por padrão e mostra o protocolo com o prazo", async () => {
    const usuario = userEvent.setup();
    const fetchFalso = vi.fn().mockResolvedValue(
      respostaJson({
        ok: true,
        mensagem: "Recebemos o seu relato.",
        protocolo: "K7QM-3XZ2",
        prazoDias: 10,
      }),
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

    expect(screen.getByText("Anote este código em um papel:")).toBeInTheDocument();
    expect(screen.getByTestId("protocolo")).toHaveTextContent("K7QM-3XZ2");
    expect(screen.getByText(/em até 10 dias/)).toBeInTheDocument();

    const corpo = JSON.parse(
      (fetchFalso.mock.calls[0][1] as RequestInit).body as string,
    ) as { clienteId: string; anonima: boolean; contato?: string };
    expect(corpo.clienteId).toBe("alto-da-serra");
    expect(corpo.anonima).toBe(true);
    expect(corpo.contato).toBeUndefined();
  });

  it("limpa o histórico ao confirmar e oferece 'Sair e limpar'", async () => {
    const usuario = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        respostaJson({ ok: true, mensagem: "Recebido.", protocolo: "K7QM-3XZ2" }),
      ),
    );
    const replace = vi.fn();
    vi.stubGlobal("location", { ...window.location, replace });

    render(<FormularioQueixa clienteId="alto-da-serra" />);
    await usuario.type(
      screen.getByLabelText("O que você quer contar?"),
      "Relato de teste com detalhes suficientes.",
    );
    await usuario.click(screen.getByRole("button", { name: "Enviar relato" }));

    await waitFor(() =>
      expect(
        screen.getByText("Está usando um celular emprestado?"),
      ).toBeInTheDocument(),
    );
    // O endereço do canal sai da barra e do histórico.
    expect(window.history.replaceState).toHaveBeenCalledWith(null, "", "/");

    await usuario.click(screen.getByRole("button", { name: "Sair e limpar" }));
    expect(replace).toHaveBeenCalledWith("/");
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
      screen.getByRole("checkbox", { name: /Quero enviar sem dizer quem eu sou/ }),
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
        respostaJson({ ok: false, erro: "Este endereço do canal não existe." }, 404),
      ),
    );

    render(<FormularioQueixa clienteId="alto-da-serra" />);
    await usuario.type(
      screen.getByLabelText("O que você quer contar?"),
      "Relato de teste com detalhes suficientes.",
    );
    await usuario.click(screen.getByRole("button", { name: "Enviar relato" }));

    expect(
      await screen.findByText("Este endereço do canal não existe."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("O que você quer contar?")).toHaveDisplayValue(
      "Relato de teste com detalhes suficientes.",
    );
  });
});
