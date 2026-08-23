import { describe, expect, it } from "vitest";
import { listarEventosTrilha } from "./consultas";

/** Sem Supabase no ambiente de teste, a consulta serve os dados de demonstração. */
describe("listarEventosTrilha — modo demonstração", () => {
  it("devolve os eventos de exemplo, mais recentes primeiro", async () => {
    const eventos = await listarEventosTrilha();
    expect(eventos.length).toBeGreaterThan(0);
    for (let i = 1; i < eventos.length; i += 1) {
      expect(eventos[i - 1].ocorridoEm >= eventos[i].ocorridoEm).toBe(true);
    }
  });

  it("respeita o limite pedido", async () => {
    const eventos = await listarEventosTrilha(3);
    expect(eventos).toHaveLength(3);
  });

  it("todo evento tem ação normalizada e tabela conhecida", async () => {
    const eventos = await listarEventosTrilha();
    for (const evento of eventos) {
      expect(["inserir", "atualizar", "remover"]).toContain(evento.acao);
      expect(evento.tabela).toBeTruthy();
    }
  });
});
