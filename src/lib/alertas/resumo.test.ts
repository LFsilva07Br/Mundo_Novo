import { describe, expect, it } from "vitest";
import {
  montarDetalheResumo,
  montarResumoHtml,
  segundaFeiraDaSemana,
  type DadosResumoSemanal,
} from "./resumo";

const DADOS: DadosResumoSemanal = {
  semana: "2026-08-17",
  tarefasPendentesPorOrigem: [
    { origem: "data", total: 12 },
    { origem: "evento", total: 3 },
    { origem: "manual", total: 5 },
  ],
  capasAbertas: 4,
  capasPrazoProximo: 2,
  certificadosProximos90Dias: 6,
  contratosAguardandoAlcada: 1,
};

describe("segundaFeiraDaSemana", () => {
  it("devolve o próprio dia quando já é segunda-feira", () => {
    expect(segundaFeiraDaSemana(new Date(2026, 7, 17))).toBe("2026-08-17");
  });

  it("recua para a segunda em qualquer dia útil", () => {
    // 21/08/2026 é sexta-feira.
    expect(segundaFeiraDaSemana(new Date(2026, 7, 21))).toBe("2026-08-17");
  });

  it("trata domingo como parte da semana anterior", () => {
    // 23/08/2026 é domingo.
    expect(segundaFeiraDaSemana(new Date(2026, 7, 23))).toBe("2026-08-17");
  });
});

describe("montarDetalheResumo", () => {
  it("soma as tarefas pendentes e lista os números da semana", () => {
    const detalhe = montarDetalheResumo(DADOS);
    expect(detalhe).toContain("Tarefas pendentes: 20");
    expect(detalhe).toContain("CAPAs abertas: 4 (2 com prazo próximo)");
    expect(detalhe).toContain("Certificados nos próximos 90 dias: 6");
    expect(detalhe).toContain("Contratos aguardando alçada: 1");
  });
});

describe("montarResumoHtml", () => {
  it("gera o HTML do e-mail com todos os números do resumo", () => {
    const html = montarResumoHtml(DADOS);
    expect(html).toContain("Resumo semanal da carteira");
    expect(html).toContain("Semana de 2026-08-17");
    expect(html).toContain("Tarefas pendentes: 20");
    expect(html).toContain("12 gatilhos por data");
    expect(html).toContain("3 gatilhos por evento");
    expect(html).toContain("5 criadas manualmente");
    expect(html).toContain("4 abertas");
    expect(html).toContain("2 com prazo nos próximos 7 dias");
    expect(html).toContain("6 certificado(s)");
    expect(html).toContain("1 contrato(s) aguardando aprovação de alçada");
  });

  it("não quebra sem tarefas pendentes", () => {
    const html = montarResumoHtml({ ...DADOS, tarefasPendentesPorOrigem: [] });
    expect(html).toContain("Tarefas pendentes: 0");
  });
});
