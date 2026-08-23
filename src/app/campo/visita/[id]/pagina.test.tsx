import { Suspense } from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChecklistAtual, ItemVersao } from "@/lib/checklists/tipos";
import type { PacoteCampo, VisitaLocal } from "@/lib/campo/tipos";

/**
 * Execução da visita em campo — o que NÃO pode acontecer aqui é perder o
 * que o consultor já registrou: descrição da NC, fotos e a própria gravação.
 */

function itemDemo(codigo: string, extra: Partial<ItemVersao> = {}): ItemVersao {
  return {
    id: `item-${codigo}`,
    versaoId: "versao-1",
    ordem: 1,
    codigo,
    capitulo: null,
    pergunta: `Pergunta ${codigo}`,
    obrigatorio: true,
    fotosMinimas: 1,
    descricaoMinima: 10,
    referenciaNorma: "RA 1.1",
    permiteNa: true,
    ...extra,
  };
}

const ITENS = [itemDemo("EST-1"), itemDemo("EST-2")];

function checklist(versaoId = "versao-1", itens = ITENS): ChecklistAtual {
  return {
    id: "checklist-1",
    nome: "Auditoria interna",
    norma: "ra",
    versaoNorma: "1.4",
    publicada: {
      id: versaoId,
      numero: 1,
      status: "publicada",
      publicadaEm: "2026-08-01T12:00:00Z",
      itens,
    },
    rascunho: null,
  };
}

function visitaBase(sobrescrever: Partial<VisitaLocal> = {}): VisitaLocal {
  return {
    idLocal: "local-1",
    clienteId: "cliente-1",
    clienteNome: "Fazenda Alto da Serra",
    titulo: "Auditoria interna RA",
    versaoChecklistId: "versao-1",
    iniciadaEm: "2026-08-23T09:00:00Z",
    gpsInicio: null,
    respostas: [],
    fotos: [],
    assinatura: null,
    concluidaEm: null,
    gpsFim: null,
    sincronizadaEm: null,
    erroSincronizacao: null,
    ...sobrescrever,
  };
}

const { estado } = vi.hoisted(() => ({
  estado: {
    visita: null as VisitaLocal | null,
    pacote: null as PacoteCampo | null,
    gravacaoFalha: false,
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/campo/banco-local", () => ({
  obterVisitaLocal: vi.fn(async () => estado.visita),
  salvarVisitaLocal: vi.fn(async () => undefined),
}));

vi.mock("@/lib/campo/gravacao", async () => {
  const real =
    await vi.importActual<typeof import("@/lib/campo/gravacao")>(
      "@/lib/campo/gravacao",
    );
  return {
    ...real,
    gravarVisita: vi.fn(async () =>
      estado.gravacaoFalha
        ? {
            ok: false as const,
            mensagem: real.MENSAGEM_FALHA_GRAVACAO,
            detalhe: "QuotaExceededError",
          }
        : { ok: true as const },
    ),
  };
});

vi.mock("@/lib/campo/pacote", () => ({
  obterOuBaixarPacote: vi.fn(async () => estado.pacote),
}));

vi.mock("@/lib/campo/midia", () => ({
  capturarGps: vi.fn(async () => "-21.0,-45.0"),
  redimensionarFoto: vi.fn(async () => "data:image/jpeg;base64,ZZZ"),
}));

vi.mock("@/lib/campo/sincronizacao", () => ({
  sincronizar: vi.fn(async () => []),
}));

import { gravarVisita } from "@/lib/campo/gravacao";
import PaginaVisita from "./page";

/** Abre a tela já com os dados do aparelho carregados (params + IndexedDB). */
async function abrir() {
  await act(async () => {
    render(
      <Suspense fallback={<p>carregando</p>}>
        <PaginaVisita params={Promise.resolve({ id: "local-1" })} />
      </Suspense>,
    );
  });
}

/** Última visita que a tela mandou gravar — é o que ficaria no aparelho. */
function ultimaGravada(): VisitaLocal {
  const chamadas = vi.mocked(gravarVisita).mock.calls;
  return chamadas[chamadas.length - 1][0];
}

beforeEach(() => {
  vi.clearAllMocks();
  estado.visita = visitaBase();
  estado.gravacaoFalha = false;
  estado.pacote = {
    usuarioNome: "Maria Consultora",
    clientes: [],
    checklist: checklist(),
    tarefas: [],
    baixadoEm: "2026-08-23T08:00:00Z",
  };
});

describe("Trocar a resposta de um item", () => {
  it("não apaga a descrição da NC — guarda e devolve ao voltar para NC", async () => {
    const descricao = "Depósito de defensivos sem contenção no piso de terra.";
    estado.visita = visitaBase({
      respostas: [{ itemId: "item-EST-1", resposta: "nao_conforme", descricao }],
    });
    await abrir();

    const campo = await screen.findByLabelText("Descreva a não conformidade");
    expect(campo).toHaveValue(descricao);

    // Toque errado com luva: marca "Conforme".
    await userEvent.click(
      screen.getAllByRole("button", { name: "Conforme" })[0],
    );
    expect(
      screen.queryByLabelText("Descreva a não conformidade"),
    ).not.toBeInTheDocument();
    // A descrição não foi descartada — foi guardada no aparelho.
    expect(ultimaGravada().respostas[0]).toMatchObject({
      resposta: "conforme",
      descricao: null,
      descricaoGuardada: descricao,
    });

    // Volta para NC: o texto está inteiro de novo.
    await userEvent.click(
      screen.getAllByRole("button", { name: "Não conforme" })[0],
    );
    expect(
      await screen.findByLabelText("Descreva a não conformidade"),
    ).toHaveValue(descricao);
  });

  it("avisa que a descrição continua guardada no aparelho", async () => {
    estado.visita = visitaBase({
      respostas: [
        {
          itemId: "item-EST-1",
          resposta: "conforme",
          descricao: null,
          descricaoGuardada: "Texto guardado.",
        },
      ],
    });
    await abrir();

    expect(
      await screen.findByText(/A descrição escrita continua guardada/),
    ).toBeInTheDocument();
  });
});

describe("Fotos de um item que deixou de ser NC", () => {
  it("avisa que as fotos ficam guardadas e não vão ao escritório", async () => {
    estado.visita = visitaBase({
      respostas: [
        { itemId: "item-EST-1", resposta: "conforme", descricao: null },
      ],
      fotos: [
        {
          itemId: "item-EST-1",
          dataUrl: "data:image/jpeg;base64,AAA",
          gps: null,
          tiradaEm: "2026-08-23T10:00:00Z",
        },
        {
          itemId: "item-EST-1",
          dataUrl: "data:image/jpeg;base64,BBB",
          gps: null,
          tiradaEm: "2026-08-23T10:01:00Z",
        },
      ],
    });
    await abrir();

    const aviso = await screen.findByText(/2 fotos deste item continuam/);
    expect(aviso).toBeInTheDocument();
    expect(aviso.textContent).toContain("não serão enviadas ao escritório");
  });
});

describe("Remover foto de evidência", () => {
  beforeEach(() => {
    estado.visita = visitaBase({
      respostas: [
        {
          itemId: "item-EST-1",
          resposta: "nao_conforme",
          descricao: "Descrição da não conformidade registrada.",
        },
      ],
      fotos: [
        {
          itemId: "item-EST-1",
          dataUrl: "data:image/jpeg;base64,AAA",
          gps: null,
          tiradaEm: "2026-08-23T10:00:00Z",
        },
      ],
    });
  });

  it("pede confirmação antes de apagar (e o alvo de toque é grande)", async () => {
    await abrir();

    const remover = await screen.findByRole("button", {
      name: "Remover evidência 1",
    });
    // Alvo de toque: 36px (size-9), bem acima dos 20px antigos.
    expect(remover.className).toContain("size-9");

    await userEvent.click(remover);
    expect(gravarVisita).not.toHaveBeenCalled();
    expect(screen.getByText("Apagar esta foto?")).toBeInTheDocument();

    // Desistir mantém a evidência.
    await userEvent.click(screen.getByRole("button", { name: "Manter" }));
    expect(gravarVisita).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Remover evidência 1" }),
    ).toBeInTheDocument();
  });

  it("só apaga depois do segundo toque", async () => {
    await abrir();

    await userEvent.click(
      await screen.findByRole("button", { name: "Remover evidência 1" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Apagar" }));

    expect(ultimaGravada().fotos).toHaveLength(0);
  });
});

describe("Falha ao salvar no aparelho", () => {
  it("mostra aviso permanente e visível — nunca falha em silêncio", async () => {
    estado.gravacaoFalha = true;
    await abrir();

    await userEvent.click(
      (await screen.findAllByRole("button", { name: "Conforme" }))[0],
    );

    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent(/Não foi possível salvar no aparelho/);
    expect(alerta).toHaveTextContent(/anote os dados/);
    // Fundo sólido destrutivo com texto branco: legível sob sol.
    expect(alerta.className).toContain("bg-destructive");
    expect(alerta.className).toContain("text-white");

    // O aviso some sozinho? Não: só quando uma gravação der certo.
    estado.gravacaoFalha = false;
    await userEvent.click(
      screen.getAllByRole("button", { name: "Não conforme" })[0],
    );
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
  });
});

describe("Alvos de toque do checklist", () => {
  it("dá 48px de altura mínima aos botões Conforme/NC/N.A.", async () => {
    await abrir();
    const grupo = await screen.findByRole("group", {
      name: "Resposta do item EST-1",
    });
    for (const rotulo of ["Conforme", "Não conforme", "N.A."]) {
      expect(
        within(grupo).getByRole("button", { name: rotulo }).className,
      ).toContain("min-h-12");
    }
  });
});

describe("Pacote de dados atualizado no meio da visita", () => {
  it("avisa em vez de deixar as respostas sumirem da tela sem explicação", async () => {
    estado.visita = visitaBase({
      versaoChecklistId: "versao-1",
      respostas: [
        { itemId: "item-ANTIGO", resposta: "nao_conforme", descricao: "NC." },
      ],
      fotos: [
        {
          itemId: "item-ANTIGO",
          dataUrl: "data:image/jpeg;base64,AAA",
          gps: null,
          tiradaEm: "2026-08-23T10:00:00Z",
        },
      ],
    });
    estado.pacote = {
      usuarioNome: "Maria Consultora",
      clientes: [],
      // O consultor atualizou o pacote e o checklist virou a versão 2.
      checklist: checklist("versao-2"),
      tarefas: [],
      baixadoEm: "2026-08-23T08:00:00Z",
    };
    await abrir();

    const aviso = await screen.findByRole("alert");
    expect(aviso).toHaveTextContent(/O checklist mudou depois que esta visita/);
    expect(aviso).toHaveTextContent(/1 resposta e 1 foto/);
    expect(aviso).toHaveTextContent(/Nada foi apagado do aparelho/);
  });

  it("não incomoda quando a visita está na versão publicada atual", async () => {
    await abrir();
    await screen.findByText("Pergunta EST-1");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
