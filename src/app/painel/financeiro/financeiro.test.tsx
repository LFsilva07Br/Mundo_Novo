import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  gerarFaturasDoMes,
  registrarPagamento,
} from "@/lib/financeiro/acoes";
import {
  formatarMoeda,
  type ContratoFinanceiro,
  type Fatura,
} from "@/lib/financeiro/regras";
import { FormularioContratoFinanceiro } from "./dialogos";
import { VisaoFinanceiro } from "./visao-financeiro";

vi.mock("@/lib/financeiro/acoes", () => ({
  criarContratoFinanceiro: vi.fn(),
  registrarPagamento: vi.fn().mockResolvedValue({ ok: true }),
  gerarFaturasDoMes: vi
    .fn()
    .mockResolvedValue({ ok: false, erro: "Pré-ativação." }),
}));

const HOJE = "2026-08-22";

const CONTRATOS: ContratoFinanceiro[] = [
  {
    id: "contrato-alto-da-serra",
    clienteId: "alto-da-serra",
    clienteNome: "Fazenda Alto da Serra",
    descricao: "Consultoria de certificação Rainforest Alliance",
    valorMensal: 2800,
    diaVencimento: 5,
    inicio: "2025-06-01",
    ativo: true,
  },
  {
    id: "contrato-tecoara",
    clienteId: "tecoara",
    clienteNome: "Fazenda Tecoara",
    descricao: "Acompanhamento de conformidade Rainforest",
    valorMensal: 1200,
    diaVencimento: 5,
    inicio: "2026-02-10",
    ativo: true,
  },
];

const FATURAS: Fatura[] = [
  {
    id: "fatura-alto-da-serra-2026-08",
    contratoId: "contrato-alto-da-serra",
    clienteId: "alto-da-serra",
    clienteNome: "Fazenda Alto da Serra",
    competencia: "2026-08",
    valor: 2800,
    vencimento: "2026-08-05",
    pagoEm: "2026-08-05",
    status: "paga",
  },
  {
    id: "fatura-tecoara-2026-08",
    contratoId: "contrato-tecoara",
    clienteId: "tecoara",
    clienteNome: "Fazenda Tecoara",
    competencia: "2026-08",
    valor: 1200,
    vencimento: "2026-08-05",
    status: "atrasada",
  },
  {
    id: "fatura-alto-da-serra-2026-07",
    contratoId: "contrato-alto-da-serra",
    clienteId: "alto-da-serra",
    clienteNome: "Fazenda Alto da Serra",
    competencia: "2026-07",
    valor: 2800,
    vencimento: "2026-07-05",
    pagoEm: "2026-07-05",
    status: "paga",
  },
  {
    id: "fatura-tecoara-2026-07",
    contratoId: "contrato-tecoara",
    clienteId: "tecoara",
    clienteNome: "Fazenda Tecoara",
    competencia: "2026-07",
    valor: 1200,
    vencimento: "2026-07-05",
    status: "atrasada",
  },
];

const CLIENTES = [
  { id: "alto-da-serra", nome: "Fazenda Alto da Serra" },
  { id: "tecoara", nome: "Fazenda Tecoara" },
];

/** O Intl usa espaço inflexível no "R$ …"; o matcher normaliza para espaço. */
function textoMoeda(valor: number): string {
  return formatarMoeda(valor).replace(/\s/g, " ");
}

function renderizarVisao(modoPreparado = true) {
  return render(
    <VisaoFinanceiro
      contratos={CONTRATOS}
      faturas={FATURAS}
      clientes={CLIENTES}
      hoje={HOJE}
      modoPreparado={modoPreparado}
    />,
  );
}

describe("VisaoFinanceiro — aviso de pré-ativação", () => {
  it("avisa que os lançamentos serão gravados após a migração", () => {
    renderizarVisao();
    expect(
      screen.getByText(
        /módulo em pré-ativação — os lançamentos serão gravados após a migração financeira/i,
      ),
    ).toBeInTheDocument();
  });

  it("com o banco pronto, o aviso some", () => {
    renderizarVisao(false);
    expect(
      screen.queryByText(/módulo em pré-ativação/i),
    ).not.toBeInTheDocument();
  });
});

describe("VisaoFinanceiro — KPIs", () => {
  it("mostra MRR, recebido no mês, em atraso e inadimplência", () => {
    renderizarVisao();

    const kpiMrr = screen
      .getByText("Receita mensal recorrente")
      .closest("div") as HTMLElement;
    expect(within(kpiMrr).getByText(textoMoeda(4000))).toBeInTheDocument();
    expect(within(kpiMrr).getByText(/2 contratos ativos/)).toBeInTheDocument();

    const kpiRecebido = screen
      .getByText("Recebido no mês")
      .closest("div") as HTMLElement;
    expect(within(kpiRecebido).getByText(textoMoeda(2800))).toBeInTheDocument();

    const kpiAtraso = screen.getByText("Em atraso").closest("div") as HTMLElement;
    expect(within(kpiAtraso).getByText(textoMoeda(2400))).toBeInTheDocument();

    // Vencidas: 8000; atrasadas: 2400 → 30%.
    const kpiInadimplencia = screen
      .getByText("Inadimplência")
      .closest("div") as HTMLElement;
    expect(within(kpiInadimplencia).getByText("30%")).toBeInTheDocument();
  });
});

describe("VisaoFinanceiro — gráfico de recebimentos", () => {
  it("descreve os últimos 6 meses pela data de pagamento", () => {
    renderizarVisao();
    const grafico = screen.getByRole("img", { name: /gráfico de recebimentos/i });
    expect(grafico.getAttribute("aria-label")).toContain("ago/2026");
    expect(grafico.getAttribute("aria-label")).toContain("mar/2026");
    expect(screen.getByText("jul/2026")).toBeInTheDocument();
  });
});

describe("VisaoFinanceiro — contratos", () => {
  it("lista cliente, serviço, valor, dia de vencimento e status", () => {
    renderizarVisao();

    const tabela = screen
      .getByText("Contratos de mensalidade")
      .closest("[data-slot=card]") as HTMLElement;
    expect(
      within(tabela).getByText("Fazenda Alto da Serra"),
    ).toBeInTheDocument();
    expect(
      within(tabela).getByText("Consultoria de certificação Rainforest Alliance"),
    ).toBeInTheDocument();
    expect(within(tabela).getByText(textoMoeda(2800))).toBeInTheDocument();
    expect(within(tabela).getAllByText("dia 5")).toHaveLength(2);
    expect(within(tabela).getAllByText("Ativo")).toHaveLength(2);
  });
});

describe("VisaoFinanceiro — faturas do mês", () => {
  it("mostra só a competência atual, com status e pagamento registrado", () => {
    renderizarVisao();

    const cartao = screen
      .getByText("Faturas de ago/2026")
      .closest("[data-slot=card]") as HTMLElement;
    expect(within(cartao).getByText("Paga")).toBeInTheDocument();
    expect(within(cartao).getByText("Atrasada")).toBeInTheDocument();
    expect(within(cartao).getByText("Paga em 05/08/2026")).toBeInTheDocument();
    // Julho não aparece na tabela do mês.
    expect(within(cartao).queryByText("05/07/2026")).not.toBeInTheDocument();
  });

  it("registrar pagamento chama a ação com a fatura e a data de hoje", async () => {
    const usuario = userEvent.setup();
    renderizarVisao();

    await usuario.click(
      screen.getByRole("button", { name: "Registrar pagamento" }),
    );

    await waitFor(() => {
      expect(registrarPagamento).toHaveBeenCalledWith(
        "fatura-tecoara-2026-08",
        HOJE,
      );
    });
  });

  it("cobrar copia a mensagem de cobrança para a área de transferência", async () => {
    const usuario = userEvent.setup();
    renderizarVisao();

    const escrever = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: escrever },
      configurable: true,
    });

    await usuario.click(
      screen.getByRole("button", {
        name: "Copiar cobrança de Fazenda Tecoara",
      }),
    );

    await waitFor(() => {
      expect(escrever).toHaveBeenCalledTimes(1);
    });
    const mensagem = escrever.mock.calls[0][0] as string;
    expect(mensagem).toContain("Fazenda Tecoara");
    expect(mensagem).toContain("ago/2026");
    expect(mensagem).toContain("05/08/2026");
    expect(await screen.findByText("Copiado!")).toBeInTheDocument();
  });

  it("gerar faturas do mês mostra o retorno da ação", async () => {
    const usuario = userEvent.setup();
    renderizarVisao();

    await usuario.click(
      screen.getByRole("button", { name: /gerar faturas do mês/i }),
    );

    await waitFor(() => {
      expect(gerarFaturasDoMes).toHaveBeenCalledWith("2026-08");
    });
    expect(await screen.findByText("Pré-ativação.")).toBeInTheDocument();
  });
});

describe("FormularioContratoFinanceiro", () => {
  it("exige cliente, serviço, valor, dia e início — com a dica do pró-rata", () => {
    render(<FormularioContratoFinanceiro clientes={CLIENTES} />);

    expect(screen.getByLabelText("Cliente")).toBeRequired();
    expect(screen.getByLabelText("Serviço contratado")).toBeRequired();
    expect(screen.getByLabelText("Valor mensal (R$)")).toBeRequired();
    expect(screen.getByLabelText("Dia de vencimento")).toBeRequired();
    expect(screen.getByLabelText("Início da vigência")).toBeRequired();
    expect(screen.getByLabelText("Fim da vigência (opcional)")).not.toBeRequired();
    expect(
      screen.getByText(/primeiro mês é cobrado proporcional/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Criar contrato" }),
    ).toBeEnabled();
  });
});
