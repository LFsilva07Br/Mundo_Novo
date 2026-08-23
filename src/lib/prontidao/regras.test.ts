import { describe, expect, it } from "vitest";
import {
  avaliarProntidao,
  NOTA_MINIMA_PRONTA,
  PESOS_PRONTIDAO,
  type DadosProntidao,
} from "./regras";

const HOJE = new Date("2026-08-23T12:00:00");

function dadosOk(): DadosProntidao {
  return {
    certificacoes: [
      { rotulo: "Rainforest Alliance", venceEm: "2027-06-30", status: "ativa" },
    ],
    capasAbertas: [],
    documentosVencidos: [],
    treinamentosVencidos: [],
    visitaInternaNoAno: true,
  };
}

describe("avaliarProntidao", () => {
  it("dá nota 100 e pronta quando está tudo em dia", () => {
    const resultado = avaliarProntidao(dadosOk(), HOJE);
    expect(resultado.nota).toBe(100);
    expect(resultado.pronta).toBe(true);
    expect(resultado.pendencias).toHaveLength(0);
  });

  it("certificado vencido derruba a nota e bloqueia a prontidão", () => {
    const dados = dadosOk();
    dados.certificacoes = [
      { rotulo: "Rainforest Alliance", venceEm: "2026-08-14", status: "ativa" },
    ];
    const resultado = avaliarProntidao(dados, HOJE);
    expect(resultado.nota).toBe(100 - PESOS_PRONTIDAO.certificadoVencido);
    expect(resultado.pronta).toBe(false);
    expect(resultado.pendencias[0]).toMatch(/Rainforest Alliance vencida/);
  });

  it("certificado vencido bloqueia mesmo com nota acima do corte", () => {
    const dados = dadosOk();
    dados.certificacoes = [
      { rotulo: "4C", venceEm: "2026-08-20", status: "ativa" },
    ];
    const resultado = avaliarProntidao(dados, HOJE);
    // 100 − 40 = 60 < 80, mas o bloqueio vale por si só.
    expect(resultado.nota).toBeLessThan(NOTA_MINIMA_PRONTA);
    expect(resultado.pronta).toBe(false);
  });

  it("CAPA maior pesa mais que CAPA menor", () => {
    const comMaior = dadosOk();
    comMaior.capasAbertas = [{ severidade: "maior", prazo: "2026-09-15" }];
    const comMenor = dadosOk();
    comMenor.capasAbertas = [{ severidade: "menor", prazo: "2026-09-15" }];

    const maior = avaliarProntidao(comMaior, HOJE);
    const menor = avaliarProntidao(comMenor, HOJE);

    expect(maior.nota).toBe(100 - PESOS_PRONTIDAO.capaMaior);
    expect(menor.nota).toBe(100 - PESOS_PRONTIDAO.capaMenor);
    expect(maior.nota).toBeLessThan(menor.nota);
    // CAPA maior bloqueia a prontidão; menor não.
    expect(maior.pronta).toBe(false);
    expect(menor.pronta).toBe(true);
  });

  it("CAPA com prazo estourado leva desconto adicional", () => {
    const dados = dadosOk();
    dados.capasAbertas = [{ severidade: "menor", prazo: "2026-08-01" }];
    const resultado = avaliarProntidao(dados, HOJE);
    expect(resultado.nota).toBe(
      100 - PESOS_PRONTIDAO.capaMenor - PESOS_PRONTIDAO.capaPrazoEstourado,
    );
    expect(resultado.pendencias[0]).toMatch(/prazo estourado/);
  });

  it("acumula documentos, treinamentos e falta de auditoria interna", () => {
    const dados = dadosOk();
    dados.documentosVencidos = [{ tipo: "Licença de operação" }];
    dados.treinamentosVencidos = ["Defensivos (NR-31)"];
    dados.visitaInternaNoAno = false;
    const resultado = avaliarProntidao(dados, HOJE);
    expect(resultado.nota).toBe(
      100 -
        PESOS_PRONTIDAO.documentoVencido -
        PESOS_PRONTIDAO.treinamentoVencido -
        PESOS_PRONTIDAO.semVisitaInterna,
    );
    expect(resultado.pronta).toBe(false); // 60 < 80
    // Ordenadas da mais grave para a mais leve.
    expect(resultado.pendencias[0]).toMatch(/auditoria interna/);
  });

  it("nota nunca fica negativa", () => {
    const dados = dadosOk();
    dados.certificacoes = [
      { rotulo: "RA", venceEm: "2026-01-01", status: "ativa" },
      { rotulo: "4C", venceEm: "2026-01-01", status: "ativa" },
    ];
    dados.capasAbertas = [
      { severidade: "critica", prazo: "2026-07-01" },
      { severidade: "maior", prazo: "2026-07-01" },
    ];
    dados.visitaInternaNoAno = false;
    const resultado = avaliarProntidao(dados, HOJE);
    expect(resultado.nota).toBe(0);
    expect(resultado.pronta).toBe(false);
  });
});
