import { describe, expect, it } from "vitest";
import {
  esquemaConviteProdutor,
  esquemaEvidenciaPortal,
  primeiroErro,
} from "./validacao";

const CONVITE_VALIDO = {
  clienteId: "alto-da-serra",
  nome: "Silvio Dutra",
  email: "silvio@exemplo.com.br",
};

describe("esquemaConviteProdutor", () => {
  it("aceita um convite completo", () => {
    const analise = esquemaConviteProdutor.safeParse(CONVITE_VALIDO);
    expect(analise.success).toBe(true);
  });

  it("recusa e-mail inválido com mensagem clara", () => {
    const analise = esquemaConviteProdutor.safeParse({
      ...CONVITE_VALIDO,
      email: "sem-arroba",
    });
    expect(analise.success).toBe(false);
    if (!analise.success) {
      expect(primeiroErro(analise.error)).toBe("Informe um e-mail válido.");
    }
  });

  it("recusa nome muito curto", () => {
    const analise = esquemaConviteProdutor.safeParse({
      ...CONVITE_VALIDO,
      nome: "Si",
    });
    expect(analise.success).toBe(false);
    if (!analise.success) {
      expect(primeiroErro(analise.error)).toMatch(/nome completo/i);
    }
  });

  it("recusa cliente vazio", () => {
    const analise = esquemaConviteProdutor.safeParse({
      ...CONVITE_VALIDO,
      clienteId: "  ",
    });
    expect(analise.success).toBe(false);
  });
});

describe("esquemaEvidenciaPortal", () => {
  const CAPA = "6f9619ff-8b86-4d01-b42d-00cf4fc964ff";

  it("aceita capa válida com ação nula", () => {
    const analise = esquemaEvidenciaPortal.safeParse({
      capaId: CAPA,
      acaoId: null,
    });
    expect(analise.success).toBe(true);
  });

  it("recusa capa que não é uuid", () => {
    const analise = esquemaEvidenciaPortal.safeParse({
      capaId: "131",
      acaoId: null,
    });
    expect(analise.success).toBe(false);
    if (!analise.success) {
      expect(primeiroErro(analise.error)).toBe("Pendência inválida.");
    }
  });

  it("recusa descrição acima de 500 letras", () => {
    const analise = esquemaEvidenciaPortal.safeParse({
      capaId: CAPA,
      acaoId: null,
      descricao: "a".repeat(501),
    });
    expect(analise.success).toBe(false);
  });
});
