import { describe, expect, it } from "vitest";
import { CERTIFICADORA_PADRAO } from "./regras";
import {
  esquemaAchado,
  esquemaAtualizarStatusAchado,
  primeiraMensagem,
} from "./validacao";

const ACHADO_VALIDO = {
  clienteId: "55555555-1111-4111-8111-111111111111",
  codigo: "NC-2026-042",
  descricao: "Depósito de defensivos sem sinalização adequada",
  severidade: "maior" as const,
  encontradoEm: "2026-08-22",
  prazo: "2026-10-31",
};

describe("esquemaAchado", () => {
  it("aceita um achado válido e aplica a certificadora padrão do sistema", () => {
    const resultado = esquemaAchado.safeParse(ACHADO_VALIDO);
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.certificadora).toBe(CERTIFICADORA_PADRAO);
      expect(resultado.data.criarCapa).toBe(false);
    }
  });

  it("recusa descrição curta demais", () => {
    const resultado = esquemaAchado.safeParse({
      ...ACHADO_VALIDO,
      descricao: "curta",
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(primeiraMensagem(resultado.error)).toMatch(/Descreva o achado/);
    }
  });

  it("recusa cliente e prazo inválidos", () => {
    expect(
      esquemaAchado.safeParse({ ...ACHADO_VALIDO, clienteId: "abc" }).success,
    ).toBe(false);
    expect(
      esquemaAchado.safeParse({ ...ACHADO_VALIDO, prazo: "31/10/2026" }).success,
    ).toBe(false);
  });

  it("com criar CAPA vinculada, o responsável do plano é obrigatório", () => {
    const semResponsavel = esquemaAchado.safeParse({
      ...ACHADO_VALIDO,
      criarCapa: true,
    });
    expect(semResponsavel.success).toBe(false);
    if (!semResponsavel.success) {
      expect(primeiraMensagem(semResponsavel.error)).toMatch(
        /informe o responsável/,
      );
    }

    const comResponsavel = esquemaAchado.safeParse({
      ...ACHADO_VALIDO,
      criarCapa: true,
      responsavelCapa: "Silvio Dutra",
    });
    expect(comResponsavel.success).toBe(true);
  });
});

describe("esquemaAtualizarStatusAchado", () => {
  it("aceita apenas status conhecidos", () => {
    expect(
      esquemaAtualizarStatusAchado.safeParse({
        achadoId: "55555555-1111-4111-8111-111111111111",
        status: "fechada",
      }).success,
    ).toBe(true);
    expect(
      esquemaAtualizarStatusAchado.safeParse({
        achadoId: "55555555-1111-4111-8111-111111111111",
        status: "cancelada",
      }).success,
    ).toBe(false);
  });
});
