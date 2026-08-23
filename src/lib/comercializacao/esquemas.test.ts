import { describe, expect, it } from "vitest";
import { esquemaLote, esquemaNegociacao } from "./esquemas";

function primeiraMensagem(resultado: { error?: { issues: { message: string }[] } }) {
  return resultado.error?.issues[0]?.message;
}

describe("esquema do lote", () => {
  const base = {
    clienteId: "alto-da-serra",
    identificacao: "LOTE-2026-001",
    sacas: "350",
  };

  it("aceita o cadastro mínimo e converte sacas com vírgula", () => {
    const resultado = esquemaLote.safeParse({ ...base, sacas: "350,5" });
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.sacas).toBe(350.5);
      expect(resultado.data.safraId).toBeUndefined();
    }
  });

  it("exige a identificação do lote", () => {
    const resultado = esquemaLote.safeParse({ ...base, identificacao: "  " });
    expect(resultado.success).toBe(false);
    expect(primeiraMensagem(resultado)).toContain("identificação do lote");
  });

  it("recusa sacas zeradas ou negativas com mensagem clara", () => {
    const resultado = esquemaLote.safeParse({ ...base, sacas: "0" });
    expect(resultado.success).toBe(false);
    expect(primeiraMensagem(resultado)).toBe(
      "A quantidade de sacas deve ser maior que zero.",
    );
  });

  it("campos opcionais vazios viram undefined", () => {
    const resultado = esquemaLote.safeParse({
      ...base,
      origemTalhoes: "",
      peneira: "",
      bebida: "",
      observacao: "",
    });
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.origemTalhoes).toBeUndefined();
      expect(resultado.data.peneira).toBeUndefined();
    }
  });
});

describe("esquema da negociação", () => {
  const base = {
    loteId: "lote-2026-001",
    comprador: "Cooxupé",
    sacas: "100",
    precoPorSaca: "2.450,00",
    status: "proposta",
  };

  it("aceita a negociação mínima e converte o preço em reais", () => {
    const resultado = esquemaNegociacao.safeParse(base);
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.precoPorSaca).toBe(2450);
      expect(resultado.data.status).toBe("proposta");
    }
  });

  it("exige o comprador", () => {
    const resultado = esquemaNegociacao.safeParse({ ...base, comprador: "" });
    expect(resultado.success).toBe(false);
    expect(primeiraMensagem(resultado)).toBe("Informe o comprador.");
  });

  it("recusa preço por saca inválido", () => {
    const resultado = esquemaNegociacao.safeParse({
      ...base,
      precoPorSaca: "abc",
    });
    expect(resultado.success).toBe(false);
    expect(primeiraMensagem(resultado)).toContain("preço por saca");
  });

  it("só aceita criar como proposta ou fechada", () => {
    const resultado = esquemaNegociacao.safeParse({
      ...base,
      status: "cancelada",
    });
    expect(resultado.success).toBe(false);
  });
});
