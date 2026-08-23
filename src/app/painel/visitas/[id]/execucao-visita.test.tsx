import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VISITAS_DEMO } from "@/lib/checklists/dados-demo";
import type { FotoVisita } from "@/lib/evidencias/acoes";
import { ExecucaoVisita } from "./execucao-visita";

vi.mock("@/lib/checklists/acoes", () => ({
  responderItem: vi.fn(async () => ({ ok: true })),
  concluirVisita: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/lib/evidencias/acoes", () => ({
  enviarFotoVisita: vi.fn(async () => ({ ok: true })),
}));

const EM_ANDAMENTO = VISITAS_DEMO.find((v) => v.status === "em_andamento")!;
const CONCLUIDA = VISITAS_DEMO.find((v) => v.status === "concluida")!;

afterEach(cleanup);

describe("ExecucaoVisita — visita em andamento", () => {
  it("mostra o progresso e o aviso de CAPA automática", () => {
    render(<ExecucaoVisita visita={EM_ANDAMENTO} />);

    expect(
      screen.getByText(`Progresso: 2/${EM_ANDAMENTO.itens.length} itens respondidos`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/abre uma CAPA automaticamente/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Concluir visita" }),
    ).toBeEnabled();
  });

  it("clicar em Não conforme abre o formulário com contador do mínimo do item", () => {
    render(<ExecucaoVisita visita={EM_ANDAMENTO} />);

    const botoesNc = screen.getAllByRole("button", { name: "Não conforme" });
    fireEvent.click(botoesNc[0]);

    const campo = screen.getByLabelText("Descreva a não conformidade");
    const minimo = EM_ANDAMENTO.itens[0].descricaoMinima;

    // Contador em tempo real: começa zerado e mostra quanto falta.
    expect(
      screen.getByText(`0/${minimo} caracteres — faltam ${minimo}`),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Registrar não conformidade" }),
    ).toBeDisabled();

    fireEvent.change(campo, { target: { value: "Descrição curta" } });
    expect(
      screen.getByText((texto) => texto.includes("faltam")),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Registrar não conformidade" }),
    ).toBeDisabled();

    fireEvent.change(campo, { target: { value: "a".repeat(minimo) } });
    expect(
      screen.getByText(`${minimo}/${minimo} caracteres — mínimo atingido`),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Registrar não conformidade" }),
    ).toBeEnabled();
  });

  it("recusa concluir com itens obrigatórios pendentes, sem chamar o servidor", async () => {
    const acoes = await import("@/lib/checklists/acoes");
    render(<ExecucaoVisita visita={EM_ANDAMENTO} />);

    fireEvent.click(screen.getByRole("button", { name: "Concluir visita" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      /não pode ser concluída/,
    );
    expect(acoes.concluirVisita).not.toHaveBeenCalled();
  });
});

describe("ExecucaoVisita — fotos de evidência na NC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const ITEM_NC = CONCLUIDA.itens.find((i) => i.codigo === "EST-1")!;

  const FOTO: FotoVisita = {
    id: "foto-1",
    itemId: ITEM_NC.id,
    caminho: "visitas/demo/1-a.jpg",
    gps: "-21.1234,-45.0021",
    tiradaEm: "2026-08-22T11:00:00Z",
    url: "https://assinada.exemplo/visitas/demo/1-a.jpg",
  };

  it("abrir a NC mostra o contador de fotos do item e o campo de anexo", () => {
    render(<ExecucaoVisita visita={EM_ANDAMENTO} />);

    fireEvent.click(
      screen.getAllByRole("button", { name: "Não conforme" })[0],
    );

    const minimo = EM_ANDAMENTO.itens[0].fotosMinimas;
    expect(screen.getByText(`0/${minimo} fotos`)).toBeInTheDocument();
    expect(screen.getByLabelText("Fotos da evidência")).toBeInTheDocument();
    expect(
      screen.getByText(/o bloqueio pelo mínimo é do app de campo/),
    ).toBeInTheDocument();
  });

  it("no modo demonstração o anexo fica desabilitado com aviso amigável", () => {
    render(<ExecucaoVisita visita={EM_ANDAMENTO} modoDemo />);

    fireEvent.click(
      screen.getAllByRole("button", { name: "Não conforme" })[0],
    );

    expect(
      screen.getByText(/conecte o Supabase para anexar fotos/),
    ).toBeInTheDocument();
  });

  it("mostra as miniaturas já enviadas do item não conforme", () => {
    render(<ExecucaoVisita visita={CONCLUIDA} fotos={[FOTO]} />);

    expect(screen.getByText(`1/${ITEM_NC.fotosMinimas} fotos`)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Ver evidência 1/ }),
    ).toBeInTheDocument();
  });

  it("selecionar arquivos chama o envio para a visita e o item", async () => {
    const acoes = await import("@/lib/evidencias/acoes");
    const usuario = userEvent.setup();
    render(<ExecucaoVisita visita={EM_ANDAMENTO} />);

    fireEvent.click(
      screen.getAllByRole("button", { name: "Não conforme" })[0],
    );

    const arquivo = new File(["foto"], "deposito.jpg", { type: "image/jpeg" });
    await usuario.upload(screen.getByLabelText("Fotos da evidência"), arquivo);

    await waitFor(() =>
      expect(acoes.enviarFotoVisita).toHaveBeenCalledWith(
        EM_ANDAMENTO.id,
        EM_ANDAMENTO.itens[0].id,
        expect.any(FormData),
      ),
    );
  });

  it("recusa arquivo que não é foto sem chamar o servidor", async () => {
    const acoes = await import("@/lib/evidencias/acoes");
    const usuario = userEvent.setup({ applyAccept: false });
    render(<ExecucaoVisita visita={EM_ANDAMENTO} />);

    fireEvent.click(
      screen.getAllByRole("button", { name: "Não conforme" })[0],
    );

    const arquivo = new File(["laudo"], "laudo.pdf", { type: "application/pdf" });
    await usuario.upload(screen.getByLabelText("Fotos da evidência"), arquivo);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /JPEG, PNG ou WebP/,
    );
    expect(acoes.enviarFotoVisita).not.toHaveBeenCalled();
  });

  it("avisa perto da conclusão quando uma NC está abaixo do mínimo, sem bloquear", () => {
    const item = EM_ANDAMENTO.itens[0];
    const visitaComNc = {
      ...EM_ANDAMENTO,
      respostas: [
        {
          itemId: item.id,
          resposta: "nao_conforme" as const,
          descricao: "a".repeat(item.descricaoMinima),
        },
      ],
    };
    render(<ExecucaoVisita visita={visitaComNc} />);

    expect(
      screen.getByText(
        new RegExp(`O item ${item.codigo} está abaixo do mínimo de fotos`),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Concluir visita" }),
    ).toBeEnabled();
  });
});

describe("ExecucaoVisita — visita concluída", () => {
  it("mostra a conformidade final e trava as respostas", () => {
    render(<ExecucaoVisita visita={CONCLUIDA} />);

    // 8 conformes / (10 − 1 N.A.) = 89%
    expect(screen.getByText("89%")).toBeInTheDocument();
    expect(screen.getByText("Visita concluída")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Concluir visita" }),
    ).not.toBeInTheDocument();
    for (const botao of screen.getAllByRole("button", { name: "Conforme" })) {
      expect(botao).toBeDisabled();
    }
  });
});
