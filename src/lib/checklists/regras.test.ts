import { describe, expect, it } from "vitest";
import {
  calcularConformidade,
  calcularConformidadeCliente,
  itensObrigatoriosPendentes,
  tamanhoDescricao,
  validarConclusaoVisita,
  validarDescricaoNc,
} from "./regras";

describe("validarDescricaoNc — NC exige descrição mínima do item", () => {
  it("recusa NC com descrição menor que o mínimo, dizendo quanto falta", () => {
    const resultado = validarDescricaoNc("nao_conforme", "Curto demais", 100);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.erro).toContain("100");
      expect(resultado.erro).toContain("faltam 88");
    }
  });

  it("recusa NC sem descrição alguma", () => {
    expect(validarDescricaoNc("nao_conforme", null, 100).ok).toBe(false);
    expect(validarDescricaoNc("nao_conforme", undefined, 100).ok).toBe(false);
  });

  it("espaços nas pontas não contam para o mínimo", () => {
    const soEspacos = "   " + "a".repeat(98) + "   ";
    expect(validarDescricaoNc("nao_conforme", soEspacos, 100).ok).toBe(false);
  });

  it("aceita NC com exatamente o mínimo de caracteres", () => {
    expect(
      validarDescricaoNc("nao_conforme", "a".repeat(100), 100).ok,
    ).toBe(true);
  });

  it("conforme e N.A. não exigem descrição", () => {
    expect(validarDescricaoNc("conforme", null, 100).ok).toBe(true);
    expect(validarDescricaoNc("nao_aplicavel", "", 100).ok).toBe(true);
  });

  it("tamanhoDescricao ignora espaços nas pontas", () => {
    expect(tamanhoDescricao("  abc  ")).toBe(3);
    expect(tamanhoDescricao(null)).toBe(0);
  });
});

const ITENS = [
  { id: "i1", codigo: "1.2.8", obrigatorio: true },
  { id: "i2", codigo: "1.2.9", obrigatorio: true },
  { id: "i3", codigo: "EXTRA", obrigatorio: false },
];

describe("validarConclusaoVisita — só conclui com obrigatórios respondidos", () => {
  it("recusa a conclusão com item obrigatório pendente, citando o código", () => {
    const resultado = validarConclusaoVisita(ITENS, [{ itemId: "i1" }]);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.erro).toContain("1.2.9");
      expect(resultado.erro).not.toContain("EXTRA");
    }
  });

  it("item opcional sem resposta não bloqueia a conclusão", () => {
    const resultado = validarConclusaoVisita(ITENS, [
      { itemId: "i1" },
      { itemId: "i2" },
    ]);
    expect(resultado.ok).toBe(true);
  });

  it("itensObrigatoriosPendentes lista apenas os obrigatórios sem resposta", () => {
    const pendentes = itensObrigatoriosPendentes(ITENS, [{ itemId: "i2" }]);
    expect(pendentes.map((p) => p.id)).toEqual(["i1"]);
  });
});

describe("calcularConformidade — conformes ÷ (respondidos − N.A.)", () => {
  it("calcula o percentual descontando os N.A.", () => {
    const respostas = [
      ...Array.from({ length: 8 }, () => ({ resposta: "conforme" as const })),
      { resposta: "nao_conforme" as const },
      { resposta: "nao_aplicavel" as const },
    ];
    // 8 conformes / (10 − 1 N.A.) = 88,9% → arredonda para 89
    expect(calcularConformidade(respostas)).toBe(89);
  });

  it("100% quando tudo respondido é conforme", () => {
    expect(
      calcularConformidade([
        { resposta: "conforme" },
        { resposta: "conforme" },
      ]),
    ).toBe(100);
  });

  it("sem base de cálculo (nada respondido ou tudo N.A.) retorna null", () => {
    expect(calcularConformidade([])).toBeNull();
    expect(
      calcularConformidade([
        { resposta: "nao_aplicavel" },
        { resposta: "nao_aplicavel" },
      ]),
    ).toBeNull();
  });
});

describe("calcularConformidadeCliente — média das visitas concluídas", () => {
  it("sem visitas retorna null (o cliente não é alterado)", () => {
    expect(calcularConformidadeCliente([])).toBeNull();
  });

  it("ignora visitas sem conformidade calculável (null)", () => {
    expect(
      calcularConformidadeCliente([
        { conformidade: 90 },
        { conformidade: null },
        { conformidade: 70 },
      ]),
    ).toBe(80);
  });

  it("só visitas com conformidade null também retorna null", () => {
    expect(
      calcularConformidadeCliente([
        { conformidade: null },
        { conformidade: null },
      ]),
    ).toBeNull();
  });

  it("arredonda a média para o inteiro mais próximo", () => {
    // (89 + 92) / 2 = 90,5 → 91
    expect(
      calcularConformidadeCliente([
        { conformidade: 89 },
        { conformidade: 92 },
      ]),
    ).toBe(91);
  });

  it("uma única visita devolve a própria conformidade", () => {
    expect(calcularConformidadeCliente([{ conformidade: 89 }])).toBe(89);
  });
});
