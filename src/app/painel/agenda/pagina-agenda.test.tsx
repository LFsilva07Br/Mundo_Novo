import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  chaveDia,
  rotuloIntervalo,
  segundaDaSemana,
} from "@/lib/agenda/semana";
import PaginaAgenda from "./page";

type PropsPagina = Parameters<typeof PaginaAgenda>[0];

async function renderizarPagina(parametros: Record<string, string> = {}) {
  const props = {
    params: Promise.resolve({}),
    searchParams: Promise.resolve(parametros),
  } as unknown as PropsPagina;
  render(await PaginaAgenda(props));
}

const HOJE = new Date();
const SEGUNDA_ATUAL = chaveDia(segundaDaSemana(HOJE));

/** Sem Supabase no teste, a página mostra os compromissos de demonstração. */
describe("Página Agenda — visão de semana", () => {
  it("abre na visão de semana por padrão, com o intervalo no cabeçalho", async () => {
    await renderizarPagina();
    expect(screen.getByRole("heading", { name: "Agenda" })).toBeInTheDocument();
    expect(
      screen.getByText(`Semana de ${rotuloIntervalo(segundaDaSemana(HOJE))}`),
    ).toBeInTheDocument();
  });

  it("monta a grade como tabela com as sete colunas, de segunda a domingo", async () => {
    await renderizarPagina({ semana: "2026-08-19" });
    const grade = screen.getByRole("table");
    const colunas = within(grade).getAllByRole("columnheader");
    expect(colunas).toHaveLength(7);
    expect(colunas[0]).toHaveTextContent("Seg");
    expect(colunas[0]).toHaveTextContent("17/08");
    expect(colunas[5]).toHaveTextContent("Sáb");
    expect(colunas[6]).toHaveTextContent("Dom");
    expect(colunas[6]).toHaveTextContent("23/08");
    expect(within(grade).getAllByRole("cell")).toHaveLength(7);
  });

  it("mostra o contador de cada dia em texto, não só em cor", async () => {
    await renderizarPagina({ semana: "2030-01-07" });
    // Semana sem nada: os sete dias anunciam a ausência por escrito — duas
    // vezes cada, no cabeçalho da coluna (tela larga) e no título de seção
    // (tela estreita); só um dos dois fica visível por vez.
    expect(screen.getAllByText("sem compromissos")).toHaveLength(14);
    expect(screen.getAllByText("Nada agendado.")).toHaveLength(7);
  });

  it("destaca o dia de hoje na semana atual", async () => {
    await renderizarPagina({ semana: SEGUNDA_ATUAL });
    // Um selo "hoje" no cabeçalho da coluna e outro no título da versão estreita.
    expect(screen.getAllByText("hoje").length).toBeGreaterThanOrEqual(1);
  });

  it("lista os compromissos da semana com cliente, etiqueta e ação de concluir", async () => {
    await renderizarPagina({ semana: SEGUNDA_ATUAL });
    expect(
      screen.getAllByText("Conferir certificado RA").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Fazenda Alto da Serra").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("⏱ data").length).toBeGreaterThan(0);
    expect(screen.getAllByText("⚡ evento").length).toBeGreaterThan(0);
    expect(screen.getAllByText("🧭 visita").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", {
        name: "Concluir tarefa: Conferir certificado RA",
      }),
    ).toBeInTheDocument();
  });

  it("marca a visita já concluída com selo e leva ao registro da visita", async () => {
    await renderizarPagina({ semana: SEGUNDA_ATUAL });
    expect(screen.getAllByText("✓ concluída").length).toBeGreaterThan(0);
    const link = screen.getAllByRole("link", {
      name: "Auditoria interna RA 1.4",
    })[0];
    expect(link).toHaveAttribute("href", "/painel/visitas/demo-visita-1");
  });

  it("mantém as tarefas sem data numa faixa própria", async () => {
    await renderizarPagina({ semana: SEGUNDA_ATUAL });
    expect(screen.getByText(/Sem data definida/)).toBeInTheDocument();
    expect(
      screen.getAllByText("Levantar documentos de EUDR pendentes").length,
    ).toBeGreaterThan(0);
  });

  it("mostra o planejamento previsto para o mês, com link para o anual", async () => {
    await renderizarPagina({ semana: "2026-08-17" });
    expect(screen.getByText("Previsto para agosto de 2026")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver planejamento anual" }),
    ).toHaveAttribute("href", "/painel/planejamento");
  });

  it("navega entre semanas por links de URL, sem estado no cliente", async () => {
    await renderizarPagina({ semana: "2026-08-19" });
    expect(
      screen.getByRole("link", { name: "Semana anterior" }),
    ).toHaveAttribute("href", "/painel/agenda?visao=semana&semana=2026-08-10");
    expect(
      screen.getByRole("link", { name: "Próxima semana" }),
    ).toHaveAttribute("href", "/painel/agenda?visao=semana&semana=2026-08-24");
    expect(screen.getByRole("link", { name: "Hoje" })).toHaveAttribute(
      "href",
      `/painel/agenda?visao=semana&semana=${SEGUNDA_ATUAL}`,
    );
  });

  it("cai na semana de hoje quando o parâmetro da URL é inválido", async () => {
    await renderizarPagina({ semana: "ontem" });
    expect(
      screen.getByText(`Semana de ${rotuloIntervalo(segundaDaSemana(HOJE))}`),
    ).toBeInTheDocument();
  });

  it("mostra o estado vazio da semana com link para o planejamento", async () => {
    await renderizarPagina({ semana: "2030-01-07" });
    expect(
      screen.getByText(/Nenhum compromisso nesta semana/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "planejamento anual" }),
    ).toHaveAttribute("href", "/painel/planejamento");
  });
});

describe("Página Agenda — alternador de visualização", () => {
  it("oferece Semana e Lista, com a semana marcada como atual por padrão", async () => {
    await renderizarPagina({ semana: "2026-08-17" });
    const grupo = screen.getByRole("group", { name: "Visualização da agenda" });
    const semana = within(grupo).getByRole("link", { name: /Semana/ });
    const lista = within(grupo).getByRole("link", { name: /Lista/ });
    expect(semana).toHaveAttribute(
      "href",
      "/painel/agenda?visao=semana&semana=2026-08-17",
    );
    expect(lista).toHaveAttribute("href", "/painel/agenda?visao=lista");
    expect(semana).toHaveAttribute("aria-current", "page");
    expect(lista).not.toHaveAttribute("aria-current");
  });

  it("com visao=lista mostra a lista original e esconde a grade", async () => {
    await renderizarPagina({ visao: "lista" });
    expect(screen.getByText(/Tarefas pendentes/)).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
    expect(
      screen.getByText(/O motor roda automaticamente todos os dias às 06:00/),
    ).toBeInTheDocument();
    const grupo = screen.getByRole("group", { name: "Visualização da agenda" });
    expect(within(grupo).getByRole("link", { name: /Lista/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("a lista traz as tarefas com e sem data, com o selo de origem completo", async () => {
    await renderizarPagina({ visao: "lista" });
    expect(screen.getByText("Conferir certificado RA")).toBeInTheDocument();
    expect(
      screen.getByText("Levantar documentos de EUDR pendentes"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("⏱ gatilho por data").length).toBeGreaterThan(0);
    expect(screen.getAllByText("sem data definida").length).toBeGreaterThan(0);
  });
});
