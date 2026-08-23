import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VISITAS_DEMO } from "@/lib/checklists/dados-demo";
import { ExecucaoVisita } from "./execucao-visita";

vi.mock("@/lib/checklists/acoes", () => ({
  responderItem: vi.fn(async () => ({ ok: true })),
  concluirVisita: vi.fn(async () => ({ ok: true })),
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
