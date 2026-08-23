import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProcessoCertificacao } from "@/lib/certificacao/consultas";
import { moverEtapa } from "@/lib/certificacao/acoes";
import { QuadroWorkflow } from "./quadro-workflow";

vi.mock("@/lib/certificacao/acoes", () => ({
  moverEtapa: vi.fn(async () => ({ ok: true })),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { toast } from "sonner";

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

const PROCESSOS: ProcessoCertificacao[] = [
  {
    id: "processo-1",
    clienteId: "alto-da-serra",
    cliente: "Fazenda Alto da Serra",
    normas: "RA",
    etapa: "auditoria_interna",
  },
];

function renderizar(modoDemo = false) {
  return render(
    <QuadroWorkflow
      processos={PROCESSOS}
      movimentos={[]}
      modoDemo={modoDemo}
    />,
  );
}

describe("QuadroWorkflow — avançar etapa", () => {
  it("não avança direto: pergunta antes, dizendo o que muda e o que não muda", async () => {
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(screen.getByRole("button", { name: /Avançar/ }));

    expect(
      screen.getByText(
        "Avançar Fazenda Alto da Serra para Correção de NCs?",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/O processo sai de Auditoria interna/)).toBeInTheDocument();
    expect(screen.getByText("O que não muda:")).toBeInTheDocument();
    expect(screen.getByText(/As CAPAs abertas/)).toBeInTheDocument();
    expect(moverEtapa).not.toHaveBeenCalled();
  });

  it("cancelar não move o processo de etapa", async () => {
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(screen.getByRole("button", { name: /Avançar/ }));
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(moverEtapa).not.toHaveBeenCalled();
  });

  it("confirmar move a etapa e avisa em linguagem de negócio", async () => {
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(screen.getByRole("button", { name: /Avançar/ }));
    await usuario.click(
      screen.getByRole("button", { name: "Avançar para Correção de NCs" }),
    );

    await waitFor(() => {
      expect(moverEtapa).toHaveBeenCalledWith("processo-1", "correcao_ncs");
    });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Fazenda Alto da Serra avançou para Correção de NCs.",
      );
    });
  });

  it("erro da ação vira aviso, não banner escondido", async () => {
    vi.mocked(moverEtapa).mockResolvedValueOnce({
      ok: false,
      erro: "Cliente sem checklist publicado.",
    } as never);
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(screen.getByRole("button", { name: /Avançar/ }));
    await usuario.click(
      screen.getByRole("button", { name: "Avançar para Correção de NCs" }),
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Cliente sem checklist publicado.",
      );
    });
  });

  it("sem movimentos, explica o que faria a lista aparecer", () => {
    renderizar();

    expect(
      screen.getByText("Nenhum movimento registrado ainda."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/o histórico aparece aqui com data e autor/),
    ).toBeInTheDocument();
  });
});
