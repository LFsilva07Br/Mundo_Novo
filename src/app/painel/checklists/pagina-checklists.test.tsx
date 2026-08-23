import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CHECKLIST_DEMO } from "@/lib/checklists/dados-demo";
import { BarraNormas } from "./barra-normas";
import PaginaChecklists from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/lib/checklists/biblioteca-acoes", () => ({
  criarChecklistDeTemplate: vi.fn(async () => ({ ok: true, id: "novo" })),
}));

afterEach(cleanup);

type PropsPagina = Parameters<typeof PaginaChecklists>[0];

async function renderizarPagina(checklist?: string) {
  const props = {
    params: Promise.resolve({}),
    searchParams: Promise.resolve(checklist ? { checklist } : {}),
  } as unknown as PropsPagina;
  render(await PaginaChecklists(props));
}

describe("Página de checklists — multi-normas", () => {
  it("renderiza o editor do checklist demo com o botão da biblioteca", async () => {
    await renderizarPagina();

    expect(
      screen.getByRole("heading", { name: "Editor de Checklist" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Auditoria interna — Rainforest Alliance/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Nova norma da biblioteca/ }),
    ).toBeInTheDocument();
  });

  it("com um só checklist não mostra o seletor de norma", async () => {
    await renderizarPagina();

    expect(screen.queryByRole("combobox", { name: "Norma" })).not.toBeInTheDocument();
    expect(screen.getByText(/Uma norma cadastrada/)).toBeInTheDocument();
  });

  it("abre o dialog da biblioteca com as opções 4C e Orgânico e o preview dos itens", async () => {
    const usuario = userEvent.setup();
    await renderizarPagina();

    await usuario.click(
      screen.getByRole("button", { name: /Nova norma da biblioteca/ }),
    );

    expect(
      await screen.findByText(/versão 1 em rascunho/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^4C/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Orgânico \(IBD\/BR\)/ }),
    ).toBeInTheDocument();

    // Preview do template 4C (seleção padrão): itens com código e pergunta.
    expect(screen.getByText("Auditoria interna — 4C")).toBeInTheDocument();
    expect(screen.getByText("12 itens")).toBeInTheDocument();
    expect(screen.getByText("4C-3.1")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Criar checklist em rascunho/ }),
    ).toBeInTheDocument();
  });

  it("troca o preview ao escolher a norma Orgânico", async () => {
    const usuario = userEvent.setup();
    await renderizarPagina();

    await usuario.click(
      screen.getByRole("button", { name: /Nova norma da biblioteca/ }),
    );
    await usuario.click(
      await screen.findByRole("button", { name: /Orgânico \(IBD\/BR\)/ }),
    );

    expect(
      screen.getByText("Auditoria interna — Orgânico (IBD/BR)"),
    ).toBeInTheDocument();
    expect(screen.getByText("ORG-2.1")).toBeInTheDocument();
  });
});

describe("BarraNormas — com mais de um checklist", () => {
  const CHECKLISTS = [
    {
      id: CHECKLIST_DEMO.id,
      nome: CHECKLIST_DEMO.nome,
      norma: CHECKLIST_DEMO.norma,
      versaoNorma: CHECKLIST_DEMO.versaoNorma,
    },
    {
      id: "checklist-4c",
      nome: "Auditoria interna — 4C",
      norma: "quatro_c",
      versaoNorma: "v4",
    },
  ];

  it("mostra o seletor com todas as normas cadastradas", () => {
    render(
      <BarraNormas
        checklists={CHECKLISTS}
        checklistSelecionadoId="checklist-4c"
      />,
    );

    const seletor = screen.getByRole("combobox", { name: "Norma" });
    expect(seletor).toHaveValue("checklist-4c");
    expect(
      screen.getByRole("option", { name: /Rainforest Alliance/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /Auditoria interna — 4C/ }),
    ).toBeInTheDocument();
  });
});
