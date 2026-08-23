import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PacoteCampo, VisitaLocal } from "@/lib/campo/tipos";
import { CHECKLIST_DEMO } from "@/lib/checklists/dados-demo";

/**
 * Renderização básica das telas do App de Campo com o IndexedDB mockado —
 * as telas leem tudo do pacote local e da fila de visitas.
 */

const PACOTE_TESTE: PacoteCampo = {
  usuarioNome: "Maria Consultora",
  clientes: [
    {
      id: "alto-da-serra",
      grupoId: null,
      nome: "Fazenda Alto da Serra",
      tipo: "fazenda",
      fase: "ativo",
      produtor: "Seu Antônio",
      cidade: "Três Pontas",
      uf: "MG",
      regiao: "Sul de Minas",
      certificacoes: [
        { norma: "ra", principal: true, status: "ativa", venceEm: "2026-10-01" },
      ],
    },
    {
      id: "guatambu",
      grupoId: null,
      nome: "Fazendas Guatambu",
      tipo: "fazenda",
      fase: "ativo",
      cidade: "Boa Esperança",
      uf: "MG",
      regiao: "Sul de Minas",
      certificacoes: [],
    },
  ],
  checklist: CHECKLIST_DEMO,
  tarefas: [
    {
      id: "t1",
      titulo: "Renovar certificado RA",
      detalhe: "Vence em breve.",
      clienteNome: "Fazenda Alto da Serra",
      origem: "data",
      venceEm: "2026-09-15",
    },
    {
      id: "t2",
      titulo: "CAPA aguardando evidência",
      detalhe: null,
      clienteNome: null,
      origem: "evento",
      venceEm: null,
    },
  ],
  baixadoEm: "2026-08-23T08:00:00Z",
};

const VISITA_NA_FILA: VisitaLocal = {
  idLocal: "fila-1",
  clienteId: "alto-da-serra",
  clienteNome: "Fazenda Alto da Serra",
  titulo: "Auditoria interna RA",
  versaoChecklistId: "demo-versao-1",
  iniciadaEm: "2026-08-23T09:00:00Z",
  gpsInicio: null,
  respostas: [],
  fotos: [],
  assinatura: { dataUrl: "data:image/png;base64,AA", nome: "Seu Antônio" },
  concluidaEm: "2026-08-23T11:00:00Z",
  gpsFim: null,
  sincronizadaEm: null,
  erroSincronizacao: null,
};

vi.mock("@/lib/campo/banco-local", () => ({
  salvarPacoteLocal: vi.fn(),
  obterPacoteLocal: vi.fn(async () => PACOTE_TESTE),
  gravarUltimaSincronizacao: vi.fn(),
  obterUltimaSincronizacao: vi.fn(async () => "2026-08-23T07:30:00Z"),
  salvarVisitaLocal: vi.fn(),
  obterVisitaLocal: vi.fn(async () => null),
  listarVisitasLocais: vi.fn(async () => [VISITA_NA_FILA]),
  removerVisitaLocal: vi.fn(),
}));

vi.mock("@/lib/campo/pacote", () => ({
  baixarPacote: vi.fn(async () => PACOTE_TESTE),
  obterPacoteLocal: vi.fn(async () => PACOTE_TESTE),
  obterOuBaixarPacote: vi.fn(async () => PACOTE_TESTE),
}));

import PaginaInicioCampo from "./page";
import PaginaClientesCampo from "./clientes/page";
import PaginaAlertasCampo from "./alertas/page";
import PaginaSincronizarCampo from "./sync/page";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Início do campo", () => {
  it("saúda o consultor com os dados do pacote e oferece a nova visita", async () => {
    render(<PaginaInicioCampo />);
    expect(
      await screen.findByText(/Maria/, { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByText("Nova visita")).toBeInTheDocument();
    // Contadores do pacote: 2 clientes na carteira.
    expect(screen.getByText("Clientes na carteira")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    // Fila de envio com 1 visita concluída aguardando.
    expect(
      screen.getByText(/1 visita aguardando envio/, { exact: false }),
    ).toBeInTheDocument();
  });
});

describe("Clientes do campo", () => {
  it("lista os clientes do pacote e filtra pela busca", async () => {
    render(<PaginaClientesCampo />);
    expect(await screen.findByText("Fazenda Alto da Serra")).toBeInTheDocument();
    expect(screen.getByText("Fazendas Guatambu")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Buscar cliente"), "guatambu");
    expect(screen.queryByText("Fazenda Alto da Serra")).not.toBeInTheDocument();
    expect(screen.getByText("Fazendas Guatambu")).toBeInTheDocument();
  });

  it("aponta o link do cliente para a nova visita", async () => {
    render(<PaginaClientesCampo />);
    const cartao = await screen.findByText("Fazendas Guatambu");
    expect(cartao.closest("a")).toHaveAttribute(
      "href",
      "/campo/visita/nova?cliente=guatambu",
    );
  });
});

describe("Alertas do campo", () => {
  it("mostra as tarefas do pacote com a etiqueta de origem", async () => {
    render(<PaginaAlertasCampo />);
    expect(await screen.findByText("Renovar certificado RA")).toBeInTheDocument();
    expect(screen.getByText("⏱ gatilho por data")).toBeInTheDocument();
    expect(screen.getByText("⚡ gatilho por evento")).toBeInTheDocument();
  });
});

describe("Sincronizar", () => {
  it("mostra a fila, a última sincronização e o botão de envio", async () => {
    render(<PaginaSincronizarCampo />);
    expect(await screen.findByText("Auditoria interna RA")).toBeInTheDocument();
    expect(screen.getByText("Aguardando envio")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Sincronizar agora \(1\)/ }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByText(/Última sincronização em/, { exact: false }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: /Atualizar pacote de dados/ }),
    ).toBeInTheDocument();
  });
});
