import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PaginaMeuCertificado from "./page";
import PaginaPendencias from "./pendencias/page";
import PaginaMinhaFazenda from "./fazenda/page";
import PaginaRelatorios from "./relatorios/page";

/**
 * Sem Supabase no ambiente de teste, o portal renderiza no modo demonstração
 * com os dados da Fazenda Alto da Serra — mesma estrutura do banco conectado.
 */

describe("Portal · Meu certificado", () => {
  it("mostra a certificação com vencimento e a conformidade", async () => {
    render(await PaginaMeuCertificado());
    expect(
      screen.getByRole("heading", { name: "Meu certificado" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Rainforest Alliance")).toBeInTheDocument();
    expect(screen.getByText("88%")).toBeInTheDocument();
    // Certificado da demo vence em 14/08/2026 — já aparece como vencido.
    expect(screen.getByText(/Vencido em 14 de ago/)).toBeInTheDocument();
  });

  it("traz os próximos passos em linguagem simples", async () => {
    render(await PaginaMeuCertificado());
    expect(screen.getByText("Próximos passos")).toBeInTheDocument();
    expect(
      screen.getByText(/equipe Mundo Novo já está cuidando da renovação/),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 pendência para resolver/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Ver minhas pendências/ }),
    ).toHaveAttribute("href", "/portal/pendencias");
  });
});

describe("Portal · Pendências", () => {
  it("lista a CAPA do produtor com severidade, prazo e ações", async () => {
    render(await PaginaPendencias());
    expect(
      screen.getByText(/Depósito de defensivos sem sinalização/),
    ).toBeInTheDocument();
    expect(screen.getByText("Importante")).toBeInTheDocument();
    expect(screen.getByText(/vence 15 de set/)).toBeInTheDocument();
    expect(
      screen.getByText("Instalar sinalização NR-31 no depósito"),
    ).toBeInTheDocument();
    // Ação já concluída aparece riscada, mas presente.
    expect(
      screen.getByText("Instalar trava/cadeado na porta"),
    ).toBeInTheDocument();
  });

  it("oferece o envio de foto para verificação", async () => {
    render(await PaginaPendencias());
    expect(
      screen.getByRole("button", { name: /Enviar para verificação/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/o consultor confere a foto e conclui a ação/i),
    ).toBeInTheDocument();
  });

  it("não lista pendências de outros clientes", async () => {
    render(await PaginaPendencias());
    // CAPA #130 é da Fazenda Tecoara — não pode vazar para este produtor.
    expect(
      screen.queryByText(/Fiação exposta nos disjuntores/),
    ).not.toBeInTheDocument();
  });
});

describe("Portal · Minha fazenda", () => {
  it("mostra as áreas somadas dos imóveis", async () => {
    render(await PaginaMinhaFazenda());
    expect(
      screen.getByRole("heading", { name: "Minha fazenda" }),
    ).toBeInTheDocument();
    expect(screen.getByText("área total")).toBeInTheDocument();
    expect(screen.getByText("área de café")).toBeInTheDocument();
    expect(screen.getByText("área de APP")).toBeInTheDocument();
    expect(screen.getByText("reserva legal")).toBeInTheDocument();
  });

  it("lista os talhões resumidos e a próxima visita", async () => {
    render(await PaginaMinhaFazenda());
    expect(screen.getByText("Talhões de café")).toBeInTheDocument();
    expect(screen.getByText("São Bento")).toBeInTheDocument();
    // Sem banco conectado não há tarefas — a tela explica com calma.
    expect(screen.getByText(/Nenhuma visita agendada/)).toBeInTheDocument();
  });
});

describe("Portal · Relatórios", () => {
  it("aponta os PDFs para o cliente do produtor logado", async () => {
    render(await PaginaRelatorios());
    const links = screen.getAllByRole("link", { name: /Baixar PDF/ });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute(
      "href",
      "/api/relatorios/mensal?formato=pdf&cliente=alto-da-serra",
    );
    expect(links[1]).toHaveAttribute(
      "href",
      "/api/relatorios/safra?formato=pdf&cliente=alto-da-serra",
    );
  });
});
