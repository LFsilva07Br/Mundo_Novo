import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { VisaoCapas } from "./visao-capas";

afterEach(cleanup);
import { listarCapas } from "@/lib/certificacao/consultas";
import type { Capa } from "@/lib/certificacao/consultas";

const CLIENTES = [
  { id: "55555555-1111-4111-8111-111111111111", nome: "Fazenda Alto da Serra" },
];

let capas: Capa[];

beforeEach(async () => {
  capas = await listarCapas();
});

describe("Planos de ação — CAPA", () => {
  it("mostra a tabela com as CAPAs e o botão Nova CAPA", () => {
    render(<VisaoCapas capas={capas} clientes={CLIENTES} modoDemo={true} />);

    expect(screen.getByText(/#131/)).toBeInTheDocument();
    expect(screen.getByText(/#127/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nova CAPA/ })).toBeEnabled();
    expect(screen.getByText("CAPAs em aberto")).toBeInTheDocument();
  });

  it("calcula o ranking de gaps a partir das CAPAs em aberto", () => {
    render(<VisaoCapas capas={capas} clientes={CLIENTES} modoDemo={true} />);

    // Demo: EST-1 e EST-2 abertas → Infraestrutura lidera o ranking.
    expect(screen.getByText("Infraestrutura")).toBeInTheDocument();
    expect(screen.getByText("Gerência")).toBeInTheDocument();
    expect(screen.getByText("Rastreabilidade")).toBeInTheDocument();
  });

  it("expande a CAPA, e o Fechar só libera com todas as ações concluídas", async () => {
    const usuario = userEvent.setup();
    render(<VisaoCapas capas={capas} clientes={CLIENTES} modoDemo={true} />);

    // Expande a CAPA #131 (2 ações pendentes + 1 concluída).
    await usuario.click(
      screen.getByRole("button", { name: /Expandir CAPA #131/ }),
    );

    const caixas = screen.getAllByRole("checkbox");
    expect(caixas).toHaveLength(3);
    expect(
      screen.getByRole("button", { name: "Fechar CAPA" }),
    ).toBeDisabled();

    // Conclui as duas ações pendentes → botão libera.
    for (const caixa of caixas) {
      if (!(caixa as HTMLInputElement).checked) await usuario.click(caixa);
    }
    expect(screen.getByRole("button", { name: "Fechar CAPA" })).toBeEnabled();

    // Fecha a CAPA (demonstração: simulação local).
    await usuario.click(screen.getByRole("button", { name: "Fechar CAPA" }));
    expect(screen.getAllByText("✓ Fechada").length).toBeGreaterThanOrEqual(2);
  });

  it("área expandida traz a seção de Evidências (demonstração: aviso amigável)", async () => {
    const usuario = userEvent.setup();
    render(<VisaoCapas capas={capas} clientes={CLIENTES} modoDemo={true} />);

    await usuario.click(
      screen.getByRole("button", { name: /Expandir CAPA #131/ }),
    );

    expect(screen.getByText("Evidências")).toBeInTheDocument();
    expect(
      screen.getByText(/conecte o Supabase para anexar e ver evidências/),
    ).toBeInTheDocument();
  });

  it("oferece a cobrança por WhatsApp quando o contato do cliente tem telefone", async () => {
    const usuario = userEvent.setup();
    const comTelefone = [{ ...CLIENTES[0], telefone: "(35) 99999-0001" }];
    render(<VisaoCapas capas={capas} clientes={comTelefone} modoDemo={true} />);

    await usuario.click(
      screen.getByRole("button", { name: /Expandir CAPA #131/ }),
    );

    const link = screen.getByRole("link", { name: /Cobrar por WhatsApp/ });
    expect(link).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/5535999990001?text="),
    );
  });

  it("sem telefone no contato, não mostra a cobrança por WhatsApp", async () => {
    const usuario = userEvent.setup();
    render(<VisaoCapas capas={capas} clientes={CLIENTES} modoDemo={true} />);

    await usuario.click(
      screen.getByRole("button", { name: /Expandir CAPA #131/ }),
    );

    expect(
      screen.queryByRole("link", { name: /Cobrar por WhatsApp/ }),
    ).not.toBeInTheDocument();
  });

  it("abre o diálogo de Nova CAPA com responsável e prazo obrigatórios", async () => {
    const usuario = userEvent.setup();
    render(<VisaoCapas capas={capas} clientes={CLIENTES} modoDemo={true} />);

    await usuario.click(screen.getByRole("button", { name: /Nova CAPA/ }));

    expect(
      await screen.findByText(/responsável e prazo são\s+obrigatórios/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Responsável")).toBeRequired();
    expect(screen.getByLabelText("Prazo")).toBeRequired();
    expect(screen.getByLabelText("Cliente")).toBeRequired();
    expect(
      screen.getByLabelText("Descrição da não conformidade"),
    ).toBeRequired();
  });
});
