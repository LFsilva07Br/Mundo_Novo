import { describe, expect, it } from "vitest";
import { ITENS_CHECKLIST_RA } from "@/lib/certificacao/dados-demo";
import {
  listarVisitas,
  obterChecklistAtual,
  obterVisita,
} from "./consultas";
import { VISITAS_DEMO } from "./dados-demo";
import { calcularConformidade } from "./regras";

describe("consultas de checklist — modo demonstração", () => {
  it("obterChecklistAtual traz a versão publicada v1 com os 10 itens da norma", async () => {
    const checklist = await obterChecklistAtual();
    expect(checklist).not.toBeNull();
    expect(checklist!.publicada?.numero).toBe(1);
    expect(checklist!.publicada?.status).toBe("publicada");
    expect(checklist!.publicada?.itens).toHaveLength(
      ITENS_CHECKLIST_RA.length,
    );
    expect(checklist!.rascunho).toBeNull();
  });

  it("itens vêm ordenados e todos com vínculo obrigatório com a norma", async () => {
    const checklist = await obterChecklistAtual();
    const itens = checklist!.publicada!.itens;
    expect(itens.map((i) => i.ordem)).toEqual(
      [...itens].map((_, indice) => indice + 1),
    );
    for (const item of itens) {
      expect(item.referenciaNorma, item.codigo).not.toBe("");
    }
  });
});

describe("consultas de visitas — modo demonstração", () => {
  it("listarVisitas retorna as visitas mais recentes primeiro", async () => {
    const visitas = await listarVisitas();
    expect(visitas).toHaveLength(VISITAS_DEMO.length);
    const datas = visitas.map((v) => v.iniciadaEm);
    expect(datas).toEqual([...datas].sort((a, b) => b.localeCompare(a)));
  });

  it("listarVisitas filtrada por cliente devolve só as visitas dele", async () => {
    const doCliente = await listarVisitas("alto-da-serra");
    expect(doCliente.length).toBeGreaterThan(0);
    for (const visita of doCliente) {
      expect(visita.clienteNome).toBe("Fazenda Alto da Serra");
    }

    expect(await listarVisitas("cliente-sem-visitas")).toEqual([]);
  });

  it("visita concluída traz a conformidade calculada; em andamento, não", async () => {
    const visitas = await listarVisitas();
    const concluida = visitas.find((v) => v.status === "concluida")!;
    const emAndamento = visitas.find((v) => v.status === "em_andamento")!;

    const demo = VISITAS_DEMO.find((v) => v.id === concluida.id)!;
    expect(concluida.conformidade).toBe(calcularConformidade(demo.respostas));
    expect(concluida.naoConformes).toBe(1);
    expect(emAndamento.conformidade).toBeNull();
  });

  it("resumo agrega respondidos e total de itens", async () => {
    const visitas = await listarVisitas();
    const emAndamento = visitas.find((v) => v.status === "em_andamento")!;
    expect(emAndamento.totalItens).toBe(ITENS_CHECKLIST_RA.length);
    expect(emAndamento.respondidos).toBe(2);
  });

  it("obterVisita devolve itens e respostas; id desconhecido devolve null", async () => {
    const visita = await obterVisita("demo-visita-1");
    expect(visita?.itens).toHaveLength(ITENS_CHECKLIST_RA.length);
    expect(visita?.respostas.length).toBeGreaterThan(0);
    expect(await obterVisita("nao-existe")).toBeNull();
  });

  it("a NC de demonstração respeita a descrição mínima do item", async () => {
    const visita = await obterVisita("demo-visita-1");
    const nc = visita!.respostas.find((r) => r.resposta === "nao_conforme")!;
    const item = visita!.itens.find((i) => i.id === nc.itemId)!;
    expect((nc.descricao ?? "").trim().length).toBeGreaterThanOrEqual(
      item.descricaoMinima,
    );
  });
});
