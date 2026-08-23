import { render, screen, within } from "@testing-library/react";
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
  it("mostra a certificação com vencimento", async () => {
    render(await PaginaMeuCertificado());
    expect(
      screen.getByRole("heading", { name: "Meu certificado" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Rainforest Alliance")).toBeInTheDocument();
    // Certificado da demo vence em 14/08/2026 — já aparece como vencido.
    expect(screen.getByText(/Vencido em 14 de ago/)).toBeInTheDocument();
  });

  it("dá UMA resposta para 'está tudo certo?' — sem contradizer o vencimento", async () => {
    render(await PaginaMeuCertificado());

    expect(
      screen.getByText("Está tudo certo com a minha fazenda?"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Não. Seu certificado está vencido." }),
    ).toBeInTheDocument();
    // O antigo "88% CONFORMIDADE" solto, que brigava com "Vencido", sumiu.
    expect(screen.queryByText("88%")).not.toBeInTheDocument();
    expect(screen.queryByText("conformidade")).not.toBeInTheDocument();
  });

  it("traduz a conformidade para linguagem de gente", async () => {
    render(await PaginaMeuCertificado());
    expect(
      screen.getByText(
        "Sua fazenda cumpre 88 de cada 100 exigências da certificação.",
      ),
    ).toBeInTheDocument();
  });

  it("a faixa de situação termina em um botão de ação", async () => {
    render(await PaginaMeuCertificado());
    expect(
      screen.getByRole("link", { name: /Falar com meu consultor/ }),
    ).toHaveAttribute("href", "#ajuda-portal");
  });
});

describe("Portal · Pendências", () => {
  it("lista a CAPA do produtor com as ações", async () => {
    render(await PaginaPendencias());
    expect(
      screen.getByText(/Depósito de defensivos sem sinalização/),
    ).toBeInTheDocument();
    // Ação já concluída aparece riscada, mas presente.
    expect(
      screen.getByText("Instalar trava/cadeado na porta"),
    ).toBeInTheDocument();
  });

  it("mostra UMA etiqueta de urgência, sem rótulos que se contradizem", async () => {
    render(await PaginaPendencias());

    // A CAPA da demo vence 15/09/2026 e é "maior" + "em correção".
    expect(screen.queryByText("Importante")).not.toBeInTheDocument();
    expect(screen.queryByText("Em correção")).not.toBeInTheDocument();
    expect(screen.queryByText("Crítico")).not.toBeInTheDocument();
    expect(screen.getByText("Já está sendo corrigido.")).toBeInTheDocument();
  });

  it("diz a consequência de não cumprir", async () => {
    render(await PaginaPendencias());
    expect(
      screen.getByText(/O que acontece se ficar assim:/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/trava a renovação do certificado/),
    ).toBeInTheDocument();
  });

  it("traduz o jargão no padrão frase humana (termo técnico)", async () => {
    render(await PaginaPendencias());
    expect(
      screen.getByText(
        "Instalar sinalização regras de segurança do trabalho no campo (NR-31) no depósito",
      ),
    ).toBeInTheDocument();
  });

  it("explica o que fotografar em vez de pedir JPEG/PNG/WebP", async () => {
    render(await PaginaPendencias());

    expect(screen.getByLabelText("📷 Tirar foto agora")).toBeInTheDocument();
    expect(
      screen.getByText(/Fotografe o local depois de arrumado/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/JPEG, PNG ou WebP/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Enviar para verificação/ }),
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
  it("mostra as áreas somadas dos imóveis, com o jargão traduzido", async () => {
    render(await PaginaMinhaFazenda());
    expect(
      screen.getByRole("heading", { name: "Minha fazenda" }),
    ).toBeInTheDocument();
    expect(screen.getByText("área total")).toBeInTheDocument();
    expect(screen.getByText("área de café")).toBeInTheDocument();
    expect(
      screen.getByText(
        "área de faixa de mata que protege rios e nascentes (APP)",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("mata que precisa ficar em pé (reserva legal)"),
    ).toBeInTheDocument();
  });

  it("no celular os talhões viram cartões, sem tabela rolando de lado", async () => {
    render(await PaginaMinhaFazenda());
    expect(screen.getByText("Talhões de café")).toBeInTheDocument();

    const cartoes = screen.getByRole("list", { hidden: true });
    expect(cartoes).toHaveClass("md:hidden");
    const primeiro = within(cartoes).getAllByRole("listitem")[0];
    expect(within(primeiro).getByText("Imóvel:")).toBeInTheDocument();
    expect(within(primeiro).getByText("Área:")).toBeInTheDocument();
    expect(within(primeiro).getByText("Variedade:")).toBeInTheDocument();
  });

  it("a tabela completa continua disponível na tela grande", async () => {
    render(await PaginaMinhaFazenda());
    expect(screen.getAllByText("São Bento").length).toBeGreaterThanOrEqual(2);
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
