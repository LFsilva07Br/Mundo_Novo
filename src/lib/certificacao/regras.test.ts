import { describe, expect, it } from "vitest";
import {
  calcularRankingGaps,
  categoriaDoItem,
  contratoEscalonado,
  diasParado,
  ETAPAS_PROCESSO,
  motivoRejeicaoValido,
  MOTIVO_REJEICAO_MAXIMO,
  MOTIVO_REJEICAO_MINIMO,
  movimentoValido,
  podeFecharCapa,
  proximaEtapa,
} from "./regras";

describe("sequência de etapas do workflow", () => {
  it("tem as 6 etapas na ordem correta, com implantação antes da auditoria", () => {
    expect(ETAPAS_PROCESSO).toEqual([
      "implantacao",
      "auditoria_interna",
      "correcao_ncs",
      "revisao_gestor",
      "na_certificadora",
      "aprovado",
    ]);
  });

  it("permite avançar exatamente 1 etapa", () => {
    expect(movimentoValido("implantacao", "auditoria_interna")).toBe(true);
    expect(movimentoValido("revisao_gestor", "na_certificadora")).toBe(true);
    expect(movimentoValido("na_certificadora", "aprovado")).toBe(true);
  });

  it("permite voltar exatamente 1 etapa", () => {
    expect(movimentoValido("correcao_ncs", "auditoria_interna")).toBe(true);
    expect(movimentoValido("na_certificadora", "revisao_gestor")).toBe(true);
  });

  it("bloqueia pular etapas ou ficar parado", () => {
    expect(movimentoValido("implantacao", "correcao_ncs")).toBe(false);
    expect(movimentoValido("implantacao", "aprovado")).toBe(false);
    expect(movimentoValido("aprovado", "auditoria_interna")).toBe(false);
    expect(movimentoValido("revisao_gestor", "revisao_gestor")).toBe(false);
  });

  it("conhece a próxima etapa de cada uma (aprovado é a última)", () => {
    expect(proximaEtapa("implantacao")).toBe("auditoria_interna");
    expect(proximaEtapa("na_certificadora")).toBe("aprovado");
    expect(proximaEtapa("aprovado")).toBeNull();
  });
});

describe("fechamento de CAPA", () => {
  it("não fecha com qualquer ação pendente", () => {
    expect(
      podeFecharCapa([{ concluida: true }, { concluida: false }]),
    ).toBe(false);
  });

  it("fecha quando todas as ações estão concluídas", () => {
    expect(podeFecharCapa([{ concluida: true }, { concluida: true }])).toBe(true);
    expect(podeFecharCapa([])).toBe(true);
  });
});

describe("escalonamento de contrato", () => {
  it("dispara somente após 10 dias parado", () => {
    expect(contratoEscalonado(10)).toBe(false);
    expect(contratoEscalonado(11)).toBe(true);
    expect(contratoEscalonado(38)).toBe(true);
  });

  it("calcula os dias parados a partir da solicitação", () => {
    const hoje = new Date("2026-08-22T12:00:00");
    expect(diasParado("2026-08-12", hoje)).toBe(10);
    expect(diasParado("2026-07-15", hoje)).toBe(38);
  });
});

describe("ranking de gaps por categoria do item", () => {
  it("classifica o código do item na categoria certa", () => {
    expect(categoriaDoItem("1.2.8")).toBe("Gerência");
    expect(categoriaDoItem("1.5.1")).toBe("Gerência");
    expect(categoriaDoItem("2.1.3")).toBe("Rastreabilidade");
    expect(categoriaDoItem("EST-1")).toBe("Infraestrutura");
    expect(categoriaDoItem(null)).toBe("Outros");
  });

  it("agrupa e ordena as CAPAs por quantidade", () => {
    const ranking = calcularRankingGaps([
      { itemCodigo: "EST-1" },
      { itemCodigo: "EST-2" },
      { itemCodigo: "EST-3" },
      { itemCodigo: "1.2.8" },
      { itemCodigo: "1.5.1" },
    ]);
    expect(ranking).toEqual([
      { categoria: "Infraestrutura", quantidade: 3 },
      { categoria: "Gerência", quantidade: 2 },
      { categoria: "Rastreabilidade", quantidade: 0 },
    ]);
  });
});

describe("motivoRejeicaoValido", () => {
  it("aprovação não exige motivo", () => {
    expect(motivoRejeicaoValido("aprovado", null)).toBe(true);
    expect(motivoRejeicaoValido("aprovado", "")).toBe(true);
  });

  it("rejeição exige motivo curto, entre o mínimo e o máximo", () => {
    expect(motivoRejeicaoValido("rejeitado", null)).toBe(false);
    expect(motivoRejeicaoValido("rejeitado", "   ")).toBe(false);
    expect(motivoRejeicaoValido("rejeitado", "a".repeat(MOTIVO_REJEICAO_MINIMO - 1))).toBe(false);
    expect(motivoRejeicaoValido("rejeitado", "a".repeat(MOTIVO_REJEICAO_MINIMO))).toBe(true);
    expect(motivoRejeicaoValido("rejeitado", "a".repeat(MOTIVO_REJEICAO_MAXIMO))).toBe(true);
    expect(motivoRejeicaoValido("rejeitado", "a".repeat(MOTIVO_REJEICAO_MAXIMO + 1))).toBe(false);
  });

  it("espaços nas pontas não contam como motivo", () => {
    expect(motivoRejeicaoValido("rejeitado", "   curto   ")).toBe(false);
  });
});
