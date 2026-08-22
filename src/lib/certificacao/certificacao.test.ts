import { describe, expect, it } from "vitest";
import {
  CAPAS_DEMO,
  ETAPAS_WORKFLOW,
  ITENS_CHECKLIST_RA,
  WORKFLOW_DEMO,
} from "./dados-demo";
import { CLIENTES_DEMO } from "../carteira/dados-demo";

describe("workflow de certificação", () => {
  it("tem as 5 etapas reais na ordem correta", () => {
    expect(ETAPAS_WORKFLOW).toEqual([
      "Auditoria interna",
      "Correção de NCs",
      "Revisão do gestor",
      "Na certificadora",
      "Aprovado",
    ]);
  });

  it("todos os 8 clientes da carteira estão no quadro, sem repetição", () => {
    expect(WORKFLOW_DEMO).toHaveLength(CLIENTES_DEMO.length);
    const ids = WORKFLOW_DEMO.map((c) => c.clienteId);
    expect(new Set(ids).size).toBe(ids.length);
    const idsCarteira = new Set(CLIENTES_DEMO.map((c) => c.id));
    for (const id of ids) expect(idsCarteira.has(id), id).toBe(true);
  });

  it("cada cartão aponta para uma etapa válida", () => {
    for (const cartao of WORKFLOW_DEMO) {
      expect(ETAPAS_WORKFLOW).toContain(cartao.etapa);
    }
  });
});

describe("checklist RA 1.4", () => {
  it("tem os 10 itens reais validados no protótipo", () => {
    expect(ITENS_CHECKLIST_RA).toHaveLength(10);
    const codigos = ITENS_CHECKLIST_RA.map((i) => i.codigo);
    for (const codigo of ["1.2.8", "1.2.9", "1.4.1", "1.5.1", "2.1.3", "2.1.5"]) {
      expect(codigos).toContain(codigo);
    }
  });

  it("todo item é vinculado à norma e tem exigências definidas", () => {
    for (const item of ITENS_CHECKLIST_RA) {
      expect(item.referencia, item.codigo).toContain("RA 1.4");
      expect(item.fotosMinimas).toBeGreaterThan(0);
      expect(item.descricaoMinima).toBeGreaterThanOrEqual(100);
    }
  });
});

describe("CAPAs", () => {
  it("toda CAPA tem origem em um item de checklist", () => {
    const codigos = new Set(ITENS_CHECKLIST_RA.map((i) => i.codigo));
    for (const capa of CAPAS_DEMO) {
      expect(codigos.has(capa.origem), `CAPA #${capa.numero}`).toBe(true);
    }
  });

  it("toda CAPA aberta tem responsável e prazo (NC nunca fica sem plano)", () => {
    for (const capa of CAPAS_DEMO.filter((c) => c.status !== "Fechada")) {
      expect(capa.responsavel, `CAPA #${capa.numero}`).toBeTruthy();
      expect(capa.prazo, `CAPA #${capa.numero}`).toBeTruthy();
    }
  });

  it("registra a origem Campo ou Escritório", () => {
    for (const capa of CAPAS_DEMO) {
      expect(["Campo", "Escritório"]).toContain(capa.origemRegistro);
    }
  });
});
