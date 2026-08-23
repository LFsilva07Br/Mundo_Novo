import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CHECKLIST_DEMO } from "@/lib/checklists/dados-demo";
import type { ChecklistAtual } from "@/lib/checklists/tipos";
import { EditorChecklist } from "./editor-checklist";

vi.mock("@/lib/checklists/acoes", () => ({
  criarRascunho: vi.fn(async () => ({ ok: true })),
  atualizarItem: vi.fn(async () => ({ ok: true })),
  adicionarItem: vi.fn(async () => ({ ok: true })),
  removerItem: vi.fn(async () => ({ ok: true })),
  publicarVersao: vi.fn(async () => ({ ok: true })),
}));

afterEach(cleanup);

const COM_RASCUNHO: ChecklistAtual = {
  ...CHECKLIST_DEMO,
  rascunho: {
    id: "demo-versao-2",
    numero: 2,
    status: "rascunho",
    publicadaEm: null,
    itens: CHECKLIST_DEMO.publicada!.itens.map((i) => ({
      ...i,
      id: `rascunho-${i.id}`,
      versaoId: "demo-versao-2",
    })),
  },
};

describe("EditorChecklist — sem rascunho", () => {
  it("mostra o badge da versão publicada e o botão de criar rascunho v2", () => {
    render(<EditorChecklist checklist={CHECKLIST_DEMO} />);

    expect(screen.getByText("Publicada v1")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Criar rascunho v2/ }),
    ).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Publicar versão" }),
    ).not.toBeInTheDocument();
  });

  it("fora do rascunho o painel de propriedades é somente leitura", () => {
    render(<EditorChecklist checklist={CHECKLIST_DEMO} />);

    expect(
      screen.getByText(/Para alterar, crie um rascunho/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Salvar alterações" }),
    ).not.toBeInTheDocument();
  });
});

describe("EditorChecklist — com rascunho em edição", () => {
  it("mostra os badges das duas versões e as ações de edição", () => {
    render(<EditorChecklist checklist={COM_RASCUNHO} />);

    expect(screen.getByText("Publicada v1")).toBeInTheDocument();
    expect(screen.getByText("Rascunho v2 em edição")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Publicar versão" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: /Adicionar item/ }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Salvar alterações" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: /Remover item/ }),
    ).toBeEnabled();
  });

  it("permite editar pergunta, referência da norma, obrigatório e mínimos", () => {
    render(<EditorChecklist checklist={COM_RASCUNHO} />);

    expect(screen.getByLabelText("Pergunta")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Referência na norma (obrigatória)"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Item obrigatório/),
    ).toBeChecked();
    expect(
      screen.getByRole("button", { name: /Aumentar fotos mínimas/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Aumentar descrição mínima/,
      }),
    ).toBeInTheDocument();
  });
});
