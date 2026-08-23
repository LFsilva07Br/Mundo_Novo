import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { listarPagamentos } from "@/lib/sustentabilidade/consultas";
import type { PagamentoSustentabilidade } from "@/lib/sustentabilidade/consultas";
import { VisaoSustentabilidade } from "./visao-sustentabilidade";

const CLIENTES = [
  { id: "55555555-1111-4111-8111-111111111111", nome: "Fazenda Alto da Serra" },
];

let pagamentos: PagamentoSustentabilidade[];

beforeEach(async () => {
  pagamentos = await listarPagamentos();
});

describe("Sustentabilidade — DS/DI", () => {
  it("explica a exigência da norma e mostra os KPIs do ano", () => {
    render(
      <VisaoSustentabilidade
        pagamentos={pagamentos}
        clientes={CLIENTES}
        modoDemo={true}
      />,
    );

    expect(
      screen.getByText(/norma RA exige registrar o Diferencial de Sustentabilidade/),
    ).toBeInTheDocument();
    expect(screen.getByText("DS pago em 2026")).toBeInTheDocument();
    expect(screen.getByText("DI pago em 2026")).toBeInTheDocument();
    // Totais da demonstração: DS 30.900 e DI 11.000 em 2026; 3 clientes.
    expect(screen.getByText(/30\.900,00/)).toBeInTheDocument();
    expect(screen.getByText(/11\.000,00/)).toBeInTheDocument();
    expect(screen.getByText("clientes contemplados")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("mostra a tabela consolidada por cliente e ano", () => {
    render(
      <VisaoSustentabilidade
        pagamentos={pagamentos}
        clientes={CLIENTES}
        modoDemo={true}
      />,
    );

    expect(screen.getByText("Totais por cliente e ano")).toBeInTheDocument();
    // Fazenda Lagoinha aparece em 2026 e 2025 no consolidado + lançamentos.
    expect(screen.getAllByText("Fazenda Lagoinha").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("2026").length).toBeGreaterThanOrEqual(2);
  });

  it("tem o botão de baixar o relatório CSV apontando para a rota", () => {
    render(
      <VisaoSustentabilidade
        pagamentos={pagamentos}
        clientes={CLIENTES}
        modoDemo={true}
      />,
    );

    const link = screen.getByRole("link", { name: /Baixar CSV/ });
    expect(link).toHaveAttribute("href", "/api/sustentabilidade/csv");
  });

  it("abre o diálogo de registro com tipo, valor, data e comprovante opcional", async () => {
    const usuario = userEvent.setup();
    render(
      <VisaoSustentabilidade
        pagamentos={pagamentos}
        clientes={CLIENTES}
        modoDemo={true}
      />,
    );

    await usuario.click(
      screen.getByRole("button", { name: /Registrar pagamento/ }),
    );

    expect(
      await screen.findByText(/comprovante \(foto\) é opcional/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Cliente (produtor)")).toBeRequired();
    expect(screen.getByLabelText("Tipo")).toBeRequired();
    expect(screen.getByLabelText("Valor (R$)")).toBeRequired();
    expect(screen.getByLabelText("Data do pagamento")).toBeRequired();
    expect(screen.getByLabelText("Comprovante (opcional)")).not.toBeRequired();
  });
});
