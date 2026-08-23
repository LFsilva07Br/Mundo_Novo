import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Lote } from "@/lib/comercializacao/consultas";
import { formatarPreco, formatarSacas } from "@/lib/comercializacao/regras";
import {
  atualizarStatusNegociacao,
  marcarLoteEntregue,
} from "@/lib/comercializacao/acoes";
import { FormularioLote, FormularioNegociacao } from "./dialogos";
import { VisaoComercializacao } from "./visao-comercializacao";

vi.mock("@/lib/comercializacao/acoes", () => ({
  criarLote: vi.fn(),
  atualizarLote: vi.fn(),
  criarNegociacao: vi.fn(),
  atualizarStatusNegociacao: vi.fn().mockResolvedValue({ ok: true }),
  marcarLoteEntregue: vi.fn().mockResolvedValue({ ok: true }),
}));

const LOTES: Lote[] = [
  {
    id: "lote-2026-001",
    clienteId: "alto-da-serra",
    clienteNome: "Fazenda Alto da Serra",
    safraId: "safra-2025-26",
    safraRotulo: "2025/26",
    identificacao: "LOTE-2026-001",
    sacas: 350,
    origemTalhoes: "T-01, T-02, T-05",
    peneira: "16 acima",
    bebida: "dura",
    status: "estoque",
    negociacoes: [
      {
        id: "negociacao-001",
        loteId: "lote-2026-001",
        comprador: "Stockler Exportadora",
        sacas: 150,
        precoPorSaca: 2480,
        data: "2026-08-10",
        status: "proposta",
      },
    ],
    sacasNegociadas: 0,
    saldoDisponivel: 350,
    melhorPreco: 2480,
    ultimoPreco: 2480,
  },
  {
    id: "lote-2026-002",
    clienteId: "alto-da-serra",
    clienteNome: "Fazenda Alto da Serra",
    safraId: "safra-2025-26",
    safraRotulo: "2025/26",
    identificacao: "LOTE-2026-002",
    sacas: 200,
    origemTalhoes: "T-03, T-04",
    peneira: "17/18",
    bebida: "mole",
    status: "negociado",
    negociacoes: [
      {
        id: "negociacao-002",
        loteId: "lote-2026-002",
        comprador: "Cooxupé",
        sacas: 200,
        precoPorSaca: 2520,
        data: "2026-07-28",
        contrato: "CT-2026-045",
        status: "fechada",
      },
    ],
    sacasNegociadas: 200,
    saldoDisponivel: 0,
    melhorPreco: 2520,
    ultimoPreco: 2520,
  },
  {
    id: "lote-2025-014",
    clienteId: "alto-da-serra",
    clienteNome: "Fazenda Alto da Serra",
    safraId: "safra-2024-25",
    safraRotulo: "2024/25",
    identificacao: "LOTE-2025-014",
    sacas: 120,
    origemTalhoes: "T-07",
    peneira: "15/16",
    bebida: "dura",
    status: "entregue",
    negociacoes: [],
    sacasNegociadas: 0,
    saldoDisponivel: 120,
    melhorPreco: null,
    ultimoPreco: null,
  },
];

const CLIENTES = [{ id: "alto-da-serra", nome: "Fazenda Alto da Serra" }];
const SAFRAS = [
  { id: "safra-2024-25", rotulo: "2024/25" },
  { id: "safra-2025-26", rotulo: "2025/26" },
];

/** O Intl usa espaço inflexível no "R$ …"; o matcher normaliza para espaço. */
function textoPreco(valor: number): string {
  return formatarPreco(valor).replace(/\s/g, " ");
}

function renderizarVisao() {
  return render(
    <VisaoComercializacao
      lotes={LOTES}
      clientes={CLIENTES}
      safras={SAFRAS}
      modoDemo
    />,
  );
}

describe("VisaoComercializacao — KPIs", () => {
  it("mostra estoque, negociadas na safra, preço médio e receita", () => {
    renderizarVisao();

    const kpiEstoque = screen
      .getByText("Sacas em estoque")
      .closest("div") as HTMLElement;
    expect(within(kpiEstoque).getByText(formatarSacas(350))).toBeInTheDocument();

    const kpiNegociadas = screen
      .getByText("Sacas negociadas")
      .closest("div") as HTMLElement;
    expect(
      within(kpiNegociadas).getByText(formatarSacas(200)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/negociações fechadas na safra 2025\/26/i),
    ).toBeInTheDocument();

    expect(screen.getByText(textoPreco(2520))).toBeInTheDocument();
    expect(screen.getByText(textoPreco(504000))).toBeInTheDocument();
  });
});

describe("VisaoComercializacao — tabela de lotes", () => {
  it("lista os lotes com saldo, rastreabilidade e badge de status", () => {
    renderizarVisao();

    expect(screen.getByText("LOTE-2026-001")).toBeInTheDocument();
    expect(screen.getByText("LOTE-2026-002")).toBeInTheDocument();
    expect(screen.getByText("LOTE-2025-014")).toBeInTheDocument();

    expect(screen.getByText("Em estoque")).toBeInTheDocument();
    expect(screen.getByText("Negociado")).toBeInTheDocument();
    expect(screen.getByText("Entregue")).toBeInTheDocument();

    expect(screen.getByText("T-01, T-02, T-05")).toBeInTheDocument();
    expect(screen.getByText("16 acima · dura")).toBeInTheDocument();
  });

  it("expande o lote e mostra as negociações com as ações", { timeout: 15000 }, async () => {
    const usuario = userEvent.setup();
    renderizarVisao();

    expect(screen.queryByText("Stockler Exportadora")).not.toBeInTheDocument();

    await usuario.click(
      screen.getByRole("button", {
        name: "Ver negociações do lote LOTE-2026-001",
      }),
    );

    expect(screen.getByText("Stockler Exportadora")).toBeInTheDocument();
    expect(screen.getByText("Proposta")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancelar" }),
    ).toBeInTheDocument();
  });

  it("fechar uma proposta chama a ação com o status fechada", async () => {
    const usuario = userEvent.setup();
    renderizarVisao();

    await usuario.click(
      screen.getByRole("button", {
        name: "Ver negociações do lote LOTE-2026-001",
      }),
    );
    await usuario.click(screen.getByRole("button", { name: "Fechar" }));

    await waitFor(() => {
      expect(atualizarStatusNegociacao).toHaveBeenCalledWith(
        "negociacao-001",
        "fechada",
      );
    });
  });

  it("venda fechada não mostra ações e lote negociado pode ser entregue", async () => {
    const usuario = userEvent.setup();
    renderizarVisao();

    await usuario.click(
      screen.getByRole("button", {
        name: "Ver negociações do lote LOTE-2026-002",
      }),
    );
    expect(screen.getByText("Cooxupé")).toBeInTheDocument();
    expect(screen.getByText("CT-2026-045")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Fechar" }),
    ).not.toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: /entregar/i }));
    await waitFor(() => {
      expect(marcarLoteEntregue).toHaveBeenCalledWith("lote-2026-002");
    });
  });
});

describe("FormularioLote", () => {
  it("exige identificação e sacas, com a dica de rastreabilidade", () => {
    render(<FormularioLote clientes={CLIENTES} safras={SAFRAS} />);

    expect(screen.getByLabelText("Identificação do lote")).toBeRequired();
    expect(screen.getByLabelText("Sacas")).toBeRequired();
    expect(screen.getByLabelText("Cliente")).toBeRequired();
    expect(screen.getByLabelText("Talhões de origem")).toHaveAttribute(
      "placeholder",
      "T-01, T-02, T-05",
    );
    expect(screen.getByText(/rainforest exige a separação/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cadastrar lote" }),
    ).toBeEnabled();
  });

  it("na edição, preenche a ficha e troca o rótulo do botão", () => {
    render(
      <FormularioLote clientes={CLIENTES} safras={SAFRAS} lote={LOTES[0]} />,
    );

    expect(screen.getByLabelText("Identificação do lote")).toHaveValue(
      "LOTE-2026-001",
    );
    expect(screen.getByLabelText("Sacas")).toHaveValue("350");
    expect(screen.getByLabelText("Safra")).toHaveValue("safra-2025-26");
    expect(
      screen.getByRole("button", { name: "Salvar alterações" }),
    ).toBeInTheDocument();
  });
});

describe("FormularioNegociacao", () => {
  it("lista os lotes com o saldo disponível e exige comprador e preço", () => {
    render(
      <FormularioNegociacao
        lotes={[
          {
            id: "lote-2026-001",
            identificacao: "LOTE-2026-001",
            clienteNome: "Fazenda Alto da Serra",
            saldoDisponivel: 350,
          },
        ]}
      />,
    );

    expect(screen.getByLabelText("Lote")).toBeRequired();
    expect(
      screen.getByRole("option", {
        name: /LOTE-2026-001 — Fazenda Alto da Serra \(saldo 350 sc\)/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Comprador")).toBeRequired();
    expect(screen.getByLabelText("Sacas")).toBeRequired();
    expect(screen.getByLabelText("Preço por saca (R$)")).toBeRequired();
    expect(screen.getByLabelText("Situação")).toHaveValue("proposta");
    expect(
      screen.getByRole("button", { name: "Registrar negociação" }),
    ).toBeEnabled();
  });
});
