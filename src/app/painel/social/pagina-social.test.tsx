import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PaginaSocial from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(cleanup);

type PropsPagina = Parameters<typeof PaginaSocial>[0];

async function renderizarPagina(cliente?: string) {
  const props = {
    params: Promise.resolve({}),
    searchParams: Promise.resolve(cliente ? { cliente } : {}),
  } as unknown as PropsPagina;
  render(await PaginaSocial(props));
}

/**
 * Sem Supabase no ambiente de teste, a página renderiza com os dados de
 * demonstração — mesma estrutura usada com o banco conectado.
 */

describe("Página Social & Colaboradores", () => {
  it("mostra o cabeçalho com o cliente padrão (Alto da Serra)", async () => {
    await renderizarPagina();
    expect(
      screen.getByRole("heading", { name: "Social & Colaboradores" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Módulo social · Fazenda Alto da Serra/),
    ).toBeInTheDocument();
  });

  it("tem o seletor de cliente e os botões de ação", async () => {
    await renderizarPagina();
    expect(
      screen.getByRole("combobox", { name: "Selecionar cliente" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Novo trabalhador/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Registrar treinamento/ }),
    ).toBeInTheDocument();
  });

  it("lista os trabalhadores com função e salário", async () => {
    await renderizarPagina();
    // O nome também aparece na tabela de fichas de EPI.
    expect(
      screen.getAllByText("Antonio Sales Ferreira").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/CBO 641015/)).toHaveLength(2);
  });

  it("mostra o status dos treinamentos a partir do vencimento real", async () => {
    await renderizarPagina();
    // Turma de março/2026 (anual) vence em março/2027.
    expect(screen.getAllByText(/vence .*2027/).length).toBeGreaterThan(0);
    // Colhedeira nunca realizada fica pendente.
    expect(screen.getByText("Pendente de realização")).toBeInTheDocument();
  });

  it("mostra moradias e exames por cargo", async () => {
    await renderizarPagina();
    expect(screen.getByText(/Casa 01/)).toBeInTheDocument();
    expect(screen.getAllByText(/Tratorista Agrícola/).length).toBeGreaterThan(
      0,
    );
  });

  it("lista as fichas de EPI com o botão de entrega", async () => {
    await renderizarPagina();
    expect(
      screen.getByText("EPIs — fichas de entrega"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Entregar EPI/ }),
    ).toBeInTheDocument();
    // Dados de demonstração: entregas com e sem assinatura.
    expect(screen.getByText("Luva nitrílica")).toBeInTheDocument();
    expect(screen.getByText("Respirador PFF2")).toBeInTheDocument();
    expect(screen.getAllByText("Assinado ✓").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sem assinatura").length).toBeGreaterThan(0);
  });

  it("oferece a ata em PDF por turma com o indicador de assinaturas", async () => {
    await renderizarPagina();
    const links = screen.getAllByRole("link", { name: /Gerar ata \(PDF\)/ });
    // Só treinamentos já realizados têm ata (Colhedeira fica de fora).
    expect(links).toHaveLength(5);
    expect(links[0]).toHaveAttribute(
      "href",
      expect.stringContaining("/api/social/ata?treinamento="),
    );
    expect(screen.getAllByText(/assinaturas 0\//).length).toBeGreaterThan(0);
  });

  it("aceita a troca de cliente via parâmetro ?cliente=", async () => {
    await renderizarPagina("bernardes");
    expect(
      screen.getByText(/Módulo social · Fazenda Bernardes/),
    ).toBeInTheDocument();
  });
});
