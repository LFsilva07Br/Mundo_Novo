import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listarContratos } from "@/lib/certificacao/consultas";
import type { ContratoAlcada } from "@/lib/certificacao/consultas";
import { listarContratosFinanceiros } from "@/lib/financeiro/consultas";
import { enriquecerContratos } from "./enriquecimento";
import { VisaoContratos } from "./visao-contratos";

vi.mock("@/lib/certificacao/acoes", () => ({
  decidirContrato: vi.fn(async () => ({ ok: true })),
}));

// O toast real depende do Toaster montado no layout do painel.
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

afterEach(cleanup);

/** Contratos da demonstração já com valor/vigência/escopo do financeiro. */
async function contratosDemo() {
  const [contratos, financeiros] = await Promise.all([
    listarContratos(),
    listarContratosFinanceiros(),
  ]);
  return enriquecerContratos(contratos, financeiros);
}

const SEM_CONTEXTO = {
  valorMensal: null,
  valorFormatado: null,
  vigencia: null,
  escopo: null,
  documentoUrl: null,
};

function contratoBase(campos: Partial<ContratoAlcada> = {}) {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    codigo: "2026-041",
    clienteNome: "Fazenda Rio Verde (novo cadastro)",
    clienteId: null,
    tipo: "fazenda" as const,
    status: "aguardando_alcada" as const,
    solicitadoPor: "Adriano Carvalho",
    solicitadoEm: "2026-07-15",
    diasParado: 38,
    decididoPor: null,
    decididoEm: null,
    observacao: null,
    ...campos,
    contexto: { ...SEM_CONTEXTO },
  };
}

const COM_ALCADA = {
  id: "u2",
  nome: "Tâmara Isa da Silva",
  papel: "gestor",
  alcadaAprovacao: true,
};

describe("Contratos & Alçada — modo demonstração", () => {
  it("mantém o seletor 'Ver como' e mostra os botões só para quem tem alçada", async () => {
    const usuario = userEvent.setup();
    render(
      <VisaoContratos
        contratos={await contratosDemo()}
        perfil={null}
        modoDemo={true}
      />,
    );

    // Tâmara (com alçada) é a visão inicial → botões visíveis.
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Aprovar" })).toHaveLength(3);

    // Winicius não tem alçada → botões somem.
    await usuario.selectOptions(screen.getByRole("combobox"), "winicius");
    expect(
      screen.queryByRole("button", { name: "Aprovar" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText(/não possui alçada/)).not.toHaveLength(0);
  });

  it("mostra o escalonamento de contrato parado há mais de 10 dias", async () => {
    render(
      <VisaoContratos
        contratos={await contratosDemo()}
        perfil={null}
        modoDemo={true}
      />,
    );

    expect(screen.getAllByText(/escalonamento\s+disparado/)).toHaveLength(2);
  });
});

describe("Contratos & Alçada — decidir com informação", () => {
  it("traz valor, vigência, escopo e link do documento do contrato do cliente", async () => {
    render(
      <VisaoContratos
        contratos={await contratosDemo()}
        perfil={null}
        modoDemo={true}
      />,
    );

    // 2026-044 é renovação da Fazenda Bernardes, que tem contrato no financeiro.
    expect(screen.getByText(/3\.500,00\/mês/)).toBeInTheDocument();
    expect(screen.getByText(/^Desde .*sem prazo de término$/)).toBeInTheDocument();
    expect(
      screen.getByText("Gestão ambiental e certificações (RA + 4C)"),
    ).toBeInTheDocument();

    const documento = screen.getByRole("link", {
      name: "Abrir documento do contrato",
    });
    expect(documento).toHaveAttribute(
      "href",
      "https://arquivos.mundonovocafe.com.br/contratos/2026-044.pdf",
    );
  });

  it("sem valor cadastrado, avisa e leva ao Financeiro", async () => {
    render(
      <VisaoContratos
        contratos={await contratosDemo()}
        perfil={null}
        modoDemo={true}
      />,
    );

    // Os dois cadastros novos ainda não têm contrato no financeiro.
    expect(screen.getAllByText("Sem valor cadastrado")).toHaveLength(2);
    const atalhos = screen.getAllByRole("link", {
      name: "cadastrar no Financeiro",
    });
    expect(atalhos).toHaveLength(2);
    expect(atalhos[0]).toHaveAttribute("href", "/painel/financeiro");
  });
});

describe("Contratos & Alçada — confirmação da decisão", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aprovar pede confirmação explicando o que acontece e o que NÃO acontece", async () => {
    const acoes = await import("@/lib/certificacao/acoes");
    const usuario = userEvent.setup();
    render(
      <VisaoContratos
        contratos={[contratoBase()]}
        perfil={COM_ALCADA}
        modoDemo={false}
      />,
    );

    await usuario.click(screen.getByRole("button", { name: "Aprovar" }));

    const dialogo = await screen.findByRole("dialog");
    expect(
      within(dialogo).getByText("Aprovar este contrato?"),
    ).toBeInTheDocument();
    expect(
      within(dialogo).getByText(/cadastro do cliente é liberado/),
    ).toBeInTheDocument();
    expect(
      within(dialogo).getByText(/Nenhuma cobrança é gerada/),
    ).toBeInTheDocument();
    expect(acoes.decidirContrato).not.toHaveBeenCalled();

    await usuario.click(
      within(dialogo).getByRole("button", { name: "Aprovar contrato" }),
    );

    await waitFor(() =>
      expect(acoes.decidirContrato).toHaveBeenCalledWith(
        contratoBase().id,
        "aprovado",
        undefined,
      ),
    );

    const { toast } = await import("sonner");
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Contrato 2026-041 aprovado — cadastro do cliente liberado",
      ),
    );
  });

  it("cancelar a confirmação não decide nada", async () => {
    const acoes = await import("@/lib/certificacao/acoes");
    const usuario = userEvent.setup();
    render(
      <VisaoContratos
        contratos={[contratoBase()]}
        perfil={COM_ALCADA}
        modoDemo={false}
      />,
    );

    await usuario.click(screen.getByRole("button", { name: "Aprovar" }));
    const dialogo = await screen.findByRole("dialog");
    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar" }));

    expect(acoes.decidirContrato).not.toHaveBeenCalled();
  });

  it("avisa por toast quando o servidor recusa a decisão", async () => {
    const acoes = await import("@/lib/certificacao/acoes");
    vi.mocked(acoes.decidirContrato).mockResolvedValueOnce({
      ok: false,
      erro: "Você não possui alçada de aprovação.",
    });
    const { toast } = await import("sonner");
    const usuario = userEvent.setup();
    render(
      <VisaoContratos
        contratos={[contratoBase()]}
        perfil={COM_ALCADA}
        modoDemo={false}
      />,
    );

    await usuario.click(screen.getByRole("button", { name: "Aprovar" }));
    await usuario.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "Aprovar contrato",
      }),
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Contrato 2026-041 não foi decidido",
        expect.objectContaining({
          description: "Você não possui alçada de aprovação.",
        }),
      ),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /não possui alçada/,
    );
  });
});

describe("Contratos & Alçada — rejeição pede motivo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("o botão de rejeitar só libera com motivo, e o motivo vai para o servidor", async () => {
    const acoes = await import("@/lib/certificacao/acoes");
    const usuario = userEvent.setup();
    render(
      <VisaoContratos
        contratos={[contratoBase()]}
        perfil={COM_ALCADA}
        modoDemo={false}
      />,
    );

    await usuario.click(screen.getByRole("button", { name: "Rejeitar" }));
    const dialogo = await screen.findByRole("dialog");

    const confirmar = within(dialogo).getByRole("button", {
      name: "Rejeitar contrato",
    });
    expect(confirmar).toBeDisabled();

    const campo = within(dialogo).getByLabelText(
      "Motivo da rejeição (obrigatório)",
    );
    await usuario.type(campo, "curto");
    expect(confirmar).toBeDisabled();
    expect(within(dialogo).getByText(/mínimo de 10/)).toBeInTheDocument();

    await usuario.clear(campo);
    await usuario.type(campo, "Valor acima do teto aprovado para este porte.");
    expect(confirmar).toBeEnabled();

    await usuario.click(confirmar);
    await waitFor(() =>
      expect(acoes.decidirContrato).toHaveBeenCalledWith(
        contratoBase().id,
        "rejeitado",
        "Valor acima do teto aprovado para este porte.",
      ),
    );

    const { toast } = await import("sonner");
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("Contrato 2026-041 rejeitado"),
      ),
    );
  });

  it("o motivo registrado aparece no histórico do contrato rejeitado", () => {
    render(
      <VisaoContratos
        contratos={[
          contratoBase({
            status: "rejeitado",
            diasParado: 0,
            decididoPor: "Tâmara Isa da Silva",
            decididoEm: "2026-08-22T10:00:00Z",
            observacao: "Valor acima do teto aprovado para este porte.",
          }),
        ]}
        perfil={null}
        modoDemo={false}
      />,
    );

    expect(screen.getByText(/Rejeitado por Tâmara Isa da Silva em/)).toBeInTheDocument();
    expect(
      screen.getByText("Valor acima do teto aprovado para este porte."),
    ).toBeInTheDocument();
  });
});

describe("Contratos & Alçada — conectado ao banco", () => {
  it("sem seletor 'Ver como': usa o perfil logado; sem alçada não há botões", () => {
    render(
      <VisaoContratos
        contratos={[contratoBase()]}
        perfil={{
          id: "u1",
          nome: "Winicius Baquião Dutra",
          papel: "consultor",
          alcadaAprovacao: false,
        }}
        modoDemo={false}
      />,
    );

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Aprovar" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Winicius não possui alçada/)).toBeInTheDocument();
  });

  it("perfil com alçada vê Aprovar/Rejeitar", () => {
    render(
      <VisaoContratos
        contratos={[contratoBase()]}
        perfil={COM_ALCADA}
        modoDemo={false}
      />,
    );

    expect(screen.getByRole("button", { name: "Aprovar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Rejeitar" })).toBeEnabled();
  });

  it("contrato decidido mostra quem decidiu e quando", () => {
    render(
      <VisaoContratos
        contratos={[
          contratoBase({
            status: "aprovado",
            diasParado: 0,
            decididoPor: "Tâmara Isa da Silva",
            decididoEm: "2026-08-22T10:00:00Z",
          }),
        ]}
        perfil={null}
        modoDemo={false}
      />,
    );

    expect(
      screen.getByText(/Aprovado por Tâmara Isa da Silva em/),
    ).toBeInTheDocument();
  });
});
