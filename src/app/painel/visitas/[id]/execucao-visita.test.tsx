import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
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

// O toast real depende do Toaster montado no layout; aqui só interessa
// saber que a falha de gravação é avisada.
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
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

describe("ExecucaoVisita — agrupamento por capítulo e navegação", () => {
  it("mostra um cabeçalho por capítulo com o contador da seção", () => {
    render(<ExecucaoVisita visita={EM_ANDAMENTO} />);

    // Os 10 itens da demo estão em três capítulos da norma.
    const capitulos = screen.getAllByRole("heading", { level: 2 });
    expect(capitulos.map((h) => h.textContent)).toEqual([
      "Cap. 1 · Gerência",
      "Cap. 2 · Rastreabilidade",
      "Estrutural · Infraestrutura",
    ]);

    // Cap. 1 tem 4 itens e 2 já respondidos na visita em andamento.
    expect(screen.getByText("2/4 respondidos")).toBeInTheDocument();
    expect(screen.getByText("0/2 respondidos")).toBeInTheDocument();
    expect(screen.getByText("0/4 respondidos")).toBeInTheDocument();
  });

  it("o sumário lista os capítulos e permite pular para a seção", async () => {
    const usuario = userEvent.setup();
    render(<ExecucaoVisita visita={EM_ANDAMENTO} />);

    const sumario = screen.getByRole("navigation", {
      name: /Sumário por capítulo/,
    });
    const atalhos = within(sumario).getAllByRole("button");
    expect(atalhos).toHaveLength(3);
    expect(atalhos[0]).toHaveTextContent("Cap. 1 · Gerência");

    await usuario.click(atalhos[2]);
    expect(
      document.getElementById("capitulo-estrutural-infraestrutura"),
    ).toBeInTheDocument();
  });

  it("a barra do topo traz progresso, NCs e o botão de concluir sempre visível", () => {
    render(<ExecucaoVisita visita={EM_ANDAMENTO} />);

    const barra = screen.getByRole("progressbar", {
      name: "Progresso da visita",
    });
    expect(barra).toHaveAttribute("aria-valuenow", "20");
    expect(screen.getByText("0 NCs")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Concluir visita" }),
    ).toBeInTheDocument();
  });
});

describe("ExecucaoVisita — filtro da lista", () => {
  it("filtra por pendentes e por não conformes, com o total em cada opção", async () => {
    const usuario = userEvent.setup();
    render(<ExecucaoVisita visita={EM_ANDAMENTO} />);

    const grupo = screen.getByRole("group", {
      name: "Filtrar itens do checklist",
    });
    const [todos, pendentes, naoConformes] = within(grupo).getAllByRole("button");

    expect(todos).toHaveTextContent("Todos (10)");
    expect(pendentes).toHaveTextContent("Pendentes (8)");
    expect(naoConformes).toHaveTextContent("Não conformes (0)");
    expect(todos).toHaveAttribute("aria-pressed", "true");

    // Todos → 10 itens; Pendentes → só os 8 sem resposta.
    expect(screen.getAllByRole("group", { name: /^Resposta do item/ })).toHaveLength(10);

    await usuario.click(pendentes);
    expect(pendentes).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("group", { name: /^Resposta do item/ })).toHaveLength(8);
    // O capítulo 1 fica com 2 pendentes, mas o contador segue sendo do capítulo.
    expect(screen.getByText("2/4 respondidos")).toBeInTheDocument();

    await usuario.click(naoConformes);
    expect(
      screen.getByText(/Nenhuma não conformidade registrada nesta visita/),
    ).toBeInTheDocument();
  });

  it("na visita concluída o filtro de NCs mostra só o item não conforme", async () => {
    const usuario = userEvent.setup();
    render(<ExecucaoVisita visita={CONCLUIDA} />);

    const grupo = screen.getByRole("group", {
      name: "Filtrar itens do checklist",
    });
    await usuario.click(
      within(grupo).getByRole("button", { name: /Não conformes/ }),
    );

    const restantes = screen.getAllByRole("group", {
      name: /^Resposta do item/,
    });
    expect(restantes).toHaveLength(1);
    expect(restantes[0]).toHaveAccessibleName("Resposta do item EST-1");
  });
});

describe("ExecucaoVisita — ir ao próximo pendente", () => {
  it("rola até o primeiro item sem resposta", async () => {
    const rolagens: string[] = [];
    // jsdom não implementa scrollIntoView — registra qual elemento foi alvo.
    Element.prototype.scrollIntoView = function scrollIntoView(this: Element) {
      rolagens.push(this.id);
    };

    const usuario = userEvent.setup();
    render(<ExecucaoVisita visita={EM_ANDAMENTO} />);

    await usuario.click(
      screen.getByRole("button", { name: /Ir ao próximo pendente/ }),
    );

    // Os dois primeiros itens já estão respondidos → alvo é o terceiro.
    await waitFor(() =>
      expect(rolagens).toContain(`item-${EM_ANDAMENTO.itens[2].id}`),
    );
  });

  it("some da visita concluída e fica desabilitado sem pendências", () => {
    render(<ExecucaoVisita visita={CONCLUIDA} />);
    expect(
      screen.queryByRole("button", { name: /Ir ao próximo pendente/ }),
    ).not.toBeInTheDocument();
  });
});

describe("ExecucaoVisita — acessibilidade das respostas", () => {
  it("cada item tem um grupo rotulado com o código e botões com aria-pressed", () => {
    render(<ExecucaoVisita visita={CONCLUIDA} />);

    const grupo = screen.getByRole("group", {
      name: `Resposta do item ${CONCLUIDA.itens[0].codigo}`,
    });
    const botoes = within(grupo).getAllByRole("button");
    expect(botoes).toHaveLength(3);

    // O primeiro item da demo está "conforme": o estado não é só cor.
    expect(within(grupo).getByRole("button", { name: "Conforme" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      within(grupo).getByRole("button", { name: "Não conforme" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(within(grupo).getByRole("button", { name: "N.A." })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});

describe("ExecucaoVisita — confirmação e feedback de salvamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /** Visita com todos os itens respondidos — pronta para concluir. */
  const PRONTA = {
    ...EM_ANDAMENTO,
    respostas: EM_ANDAMENTO.itens.map((item) => ({
      itemId: item.id,
      resposta: "conforme" as const,
      descricao: null,
    })),
  };

  it("pede confirmação explicando o que acontece e o que NÃO acontece", async () => {
    const acoes = await import("@/lib/checklists/acoes");
    const usuario = userEvent.setup();
    render(<ExecucaoVisita visita={PRONTA} />);

    await usuario.click(screen.getByRole("button", { name: "Concluir visita" }));

    const dialogo = await screen.findByRole("dialog");
    expect(within(dialogo).getByText("O que acontece")).toBeInTheDocument();
    expect(within(dialogo).getByText("O que NÃO acontece")).toBeInTheDocument();
    expect(
      within(dialogo).getByText(/abre uma CAPA automaticamente/),
    ).toBeInTheDocument();
    expect(
      within(dialogo).getByText(/Nada é enviado à certificadora/),
    ).toBeInTheDocument();
    // Ainda não gravou nada — só perguntou.
    expect(acoes.concluirVisita).not.toHaveBeenCalled();

    await usuario.click(
      within(dialogo).getByRole("button", { name: "Sim, concluir visita" }),
    );
    await waitFor(() =>
      expect(acoes.concluirVisita).toHaveBeenCalledWith(PRONTA.id),
    );
  });

  it("cancelar a confirmação não conclui a visita", async () => {
    const acoes = await import("@/lib/checklists/acoes");
    const usuario = userEvent.setup();
    render(<ExecucaoVisita visita={PRONTA} />);

    await usuario.click(screen.getByRole("button", { name: "Concluir visita" }));
    const dialogo = await screen.findByRole("dialog");
    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar" }));

    expect(acoes.concluirVisita).not.toHaveBeenCalled();
  });

  it("mostra 'Salvo' quando a resposta é gravada", async () => {
    const usuario = userEvent.setup();
    render(<ExecucaoVisita visita={EM_ANDAMENTO} />);

    const grupo = screen.getAllByRole("group", { name: /^Resposta do item/ })[2];
    await usuario.click(within(grupo).getByRole("button", { name: "Conforme" }));

    await waitFor(() =>
      expect(screen.getAllByText("Salvo").length).toBeGreaterThan(0),
    );
  });

  it("falha de gravação avisa por toast e não marca a resposta", async () => {
    const acoes = await import("@/lib/checklists/acoes");
    vi.mocked(acoes.responderItem).mockResolvedValueOnce({
      ok: false,
      erro: "Sem conexão com o banco.",
    });
    const { toast } = await import("sonner");
    const usuario = userEvent.setup();
    render(<ExecucaoVisita visita={EM_ANDAMENTO} />);

    const grupo = screen.getAllByRole("group", { name: /^Resposta do item/ })[2];
    await usuario.click(within(grupo).getByRole("button", { name: "Conforme" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("não foi salvo"),
        expect.objectContaining({ description: "Sem conexão com o banco." }),
      ),
    );
    expect(
      within(grupo).getByRole("button", { name: "Conforme" }),
    ).toHaveAttribute("aria-pressed", "false");
  });
});
