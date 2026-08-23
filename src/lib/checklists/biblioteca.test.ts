import { describe, expect, it } from "vitest";
import {
  BIBLIOTECA_NORMAS,
  ROTULO_NORMA_BIBLIOTECA,
  type NormaBiblioteca,
} from "./biblioteca";

const NORMAS = Object.keys(BIBLIOTECA_NORMAS) as NormaBiblioteca[];

describe("biblioteca multi-normas — integridade dos templates", () => {
  it("oferece os templates 4C e Orgânico, com rótulo para a escolha", () => {
    expect(NORMAS).toEqual(["quatro_c", "organico"]);
    for (const norma of NORMAS) {
      expect(ROTULO_NORMA_BIBLIOTECA[norma]).toBeTruthy();
      expect(BIBLIOTECA_NORMAS[norma].norma).toBe(norma);
      expect(BIBLIOTECA_NORMAS[norma].nome).not.toBe("");
      expect(BIBLIOTECA_NORMAS[norma].versaoNorma).not.toBe("");
      expect(BIBLIOTECA_NORMAS[norma].descricao).not.toBe("");
    }
  });

  it.each(NORMAS)("template %s tem ~12 itens com códigos únicos", (norma) => {
    const itens = BIBLIOTECA_NORMAS[norma].itens;
    expect(itens).toHaveLength(12);

    const codigos = itens.map((i) => i.codigo);
    expect(new Set(codigos).size).toBe(codigos.length);
  });

  it.each(NORMAS)(
    "template %s tem todos os itens com pergunta, capítulo e referência à norma",
    (norma) => {
      for (const item of BIBLIOTECA_NORMAS[norma].itens) {
        expect(item.pergunta.trim(), item.codigo).not.toBe("");
        expect(item.capitulo.trim(), item.codigo).not.toBe("");
        expect(item.referenciaNorma.trim(), item.codigo).not.toBe("");
      }
    },
  );

  it.each(NORMAS)(
    "template %s respeita as faixas: fotos 1–2 e descrição mínima 80–100",
    (norma) => {
      for (const item of BIBLIOTECA_NORMAS[norma].itens) {
        expect(item.fotosMinimas, item.codigo).toBeGreaterThanOrEqual(1);
        expect(item.fotosMinimas, item.codigo).toBeLessThanOrEqual(2);
        expect(item.descricaoMinima, item.codigo).toBeGreaterThanOrEqual(80);
        expect(item.descricaoMinima, item.codigo).toBeLessThanOrEqual(100);
      }
    },
  );

  it("os itens críticos citados pela consultoria estão presentes", () => {
    const perguntas4c = BIBLIOTECA_NORMAS.quatro_c.itens
      .map((i) => i.pergunta)
      .join(" ");
    expect(perguntas4c).toMatch(/banidos 4C/);
    expect(perguntas4c).toMatch(/trabalho infantil/i);

    const perguntasOrganico = BIBLIOTECA_NORMAS.organico.itens
      .map((i) => i.pergunta)
      .join(" ");
    expect(perguntasOrganico).toMatch(/conversão/i);
    expect(perguntasOrganico).toMatch(/plano de manejo orgânico/i);
  });
});
