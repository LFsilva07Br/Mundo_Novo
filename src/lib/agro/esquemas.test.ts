import { describe, expect, it } from "vitest";
import {
  esquemaAplicacao,
  esquemaDestinacao,
  esquemaProduto,
  primeiraMensagem,
} from "./esquemas";

const UUID = "22222222-0000-4000-8000-000000000001";

describe("esquemaProduto", () => {
  it("aceita produto completo com a flag de proibido", () => {
    const resultado = esquemaProduto.safeParse({
      nome: "Paraquate 200 SL",
      ingredienteAtivo: "Paraquate",
      proibidoRa: true,
      observacao: "Lista de banidos da RA",
    });
    expect(resultado.success).toBe(true);
    if (resultado.success) expect(resultado.data.proibidoRa).toBe(true);
  });

  it("proibidoRa é falso por padrão", () => {
    const resultado = esquemaProduto.safeParse({ nome: "Priori Xtra" });
    expect(resultado.success).toBe(true);
    if (resultado.success) expect(resultado.data.proibidoRa).toBe(false);
  });

  it("recusa nome curto demais com mensagem clara", () => {
    const resultado = esquemaProduto.safeParse({ nome: "X" });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(primeiraMensagem(resultado.error)).toMatch(/nome comercial/);
    }
  });
});

describe("esquemaAplicacao", () => {
  const base = {
    clienteId: UUID,
    talhaoId: UUID,
    produtoId: UUID,
    data: "2026-05-20",
  };

  it("aceita aplicação mínima (sem dose, aplicador nem equipamento)", () => {
    expect(esquemaAplicacao.safeParse(base).success).toBe(true);
  });

  it("recusa data fora do formato ISO", () => {
    const resultado = esquemaAplicacao.safeParse({
      ...base,
      data: "20/05/2026",
    });
    expect(resultado.success).toBe(false);
  });

  it("recusa talhão que não é uuid, pedindo a seleção", () => {
    const resultado = esquemaAplicacao.safeParse({
      ...base,
      talhaoId: "talhao-garagem",
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(primeiraMensagem(resultado.error)).toMatch(/talhão/);
    }
  });

  it("recusa aplicação sem produto", () => {
    const resultado = esquemaAplicacao.safeParse({
      ...base,
      produtoId: undefined,
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(primeiraMensagem(resultado.error)).toMatch(/produto/);
    }
  });
});

describe("esquemaDestinacao", () => {
  const base = {
    clienteId: UUID,
    data: "2026-07-15",
    descricao: "Devolução na central de recebimento",
  };

  it("aceita destinação com quantidade em texto do formulário", () => {
    const resultado = esquemaDestinacao.safeParse({
      ...base,
      quantidade: "48",
    });
    expect(resultado.success).toBe(true);
    if (resultado.success) expect(resultado.data.quantidade).toBe(48);
  });

  it("quantidade é opcional", () => {
    expect(esquemaDestinacao.safeParse(base).success).toBe(true);
  });

  it("recusa quantidade zero ou negativa", () => {
    expect(
      esquemaDestinacao.safeParse({ ...base, quantidade: "0" }).success,
    ).toBe(false);
    expect(
      esquemaDestinacao.safeParse({ ...base, quantidade: "-3" }).success,
    ).toBe(false);
  });

  it("recusa descrição curta demais", () => {
    const resultado = esquemaDestinacao.safeParse({
      ...base,
      descricao: "ok",
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(primeiraMensagem(resultado.error)).toMatch(/destinação/);
    }
  });
});
