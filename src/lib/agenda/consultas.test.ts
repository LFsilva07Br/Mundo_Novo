import { describe, expect, it } from "vitest";
import { agendaDaSemana, listarTarefasPendentes } from "./consultas";
import { compromissosDemo } from "./dados-demo";
import { chaveDia, diasDaSemana, segundaDaSemana } from "./semana";

/**
 * Sem Supabase nos testes, a agenda serve os compromissos de demonstração —
 * que são calculados a partir de "hoje" justamente para nunca ficar vazia.
 */
describe("Agenda — modo demonstração", () => {
  const hoje = new Date(2026, 7, 20); // quinta-feira, 20/08/2026
  const segunda = segundaDaSemana(hoje);

  it("monta a semana da segunda informada com sete dias", async () => {
    const agenda = await agendaDaSemana(segunda, hoje);
    expect(agenda.dias.map(chaveDia)).toEqual(
      diasDaSemana(segunda).map(chaveDia),
    );
    expect(chaveDia(agenda.segunda)).toBe("2026-08-17");
  });

  it("traz compromissos na semana atual, todos dentro do intervalo", async () => {
    const agenda = await agendaDaSemana(segunda, hoje);
    expect(agenda.compromissos.length).toBeGreaterThan(0);
    const chaves = new Set(agenda.dias.map(chaveDia));
    for (const compromisso of agenda.compromissos) {
      expect(compromisso.dia).not.toBeNull();
      expect(chaves.has(compromisso.dia!)).toBe(true);
    }
  });

  it("separa as tarefas sem data para elas não sumirem", async () => {
    const agenda = await agendaDaSemana(segunda, hoje);
    expect(agenda.semData.length).toBeGreaterThan(0);
    expect(agenda.semData.every((t) => t.dia === null)).toBe(true);
    expect(agenda.compromissos.some((c) => c.dia === null)).toBe(false);
  });

  it("une tarefas e visitas na mesma lista de compromissos", async () => {
    const agenda = await agendaDaSemana(segunda, hoje);
    const tipos = new Set(agenda.compromissos.map((c) => c.tipo));
    expect(tipos.has("tarefa")).toBe(true);
    expect(tipos.has("visita")).toBe(true);
    expect(agenda.compromissos.some((c) => c.tipo === "visita" && c.concluido)).toBe(
      true,
    );
  });

  it("também tem conteúdo na semana seguinte e na anterior", async () => {
    const proxima = await agendaDaSemana(
      new Date(2026, 7, 24), // 24/08/2026
      hoje,
    );
    const anterior = await agendaDaSemana(new Date(2026, 7, 10), hoje);
    expect(proxima.compromissos.length).toBeGreaterThan(0);
    expect(anterior.compromissos.length).toBeGreaterThan(0);
  });

  it("fica vazia numa semana distante — para exercitar o estado vazio", async () => {
    const agenda = await agendaDaSemana(new Date(2030, 0, 7), hoje);
    expect(agenda.compromissos).toHaveLength(0);
  });

  it("lista o planejamento previsto para o mês exibido", async () => {
    const agenda = await agendaDaSemana(segunda, hoje);
    // Demo: agosto/2026 tem auditoria interna prevista na Alto da Serra.
    expect(agenda.previstos.length).toBeGreaterThan(0);
    expect(agenda.previstos.every((p) => p.mes === 8 && p.ano === 2026)).toBe(
      true,
    );
    expect(agenda.previstos.map((p) => p.clienteNome)).toContain(
      "Fazenda Alto da Serra",
    );
  });

  it("lista as tarefas pendentes com e sem data para a visão em lista", async () => {
    const tarefas = await listarTarefasPendentes(hoje);
    expect(tarefas.every((t) => t.tipo === "tarefa")).toBe(true);
    expect(tarefas.some((t) => t.dia === null)).toBe(true);
    expect(tarefas.some((t) => t.dia !== null)).toBe(true);
  });

  it("gera a demonstração ancorada em qualquer 'hoje'", () => {
    const outroHoje = new Date(2031, 4, 15);
    const segundaOutro = chaveDia(segundaDaSemana(outroHoje));
    const naSemana = compromissosDemo(outroHoje).filter(
      (c) => c.dia === segundaOutro,
    );
    expect(naSemana.length).toBeGreaterThan(0);
  });
});
