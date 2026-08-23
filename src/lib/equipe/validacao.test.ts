import { describe, expect, it } from "vitest";
import {
  esquemaAtualizacaoPerfil,
  esquemaConvite,
  esquemaEmailConvite,
  esquemaIdPerfil,
  mapearPapelDemo,
  primeiroErro,
  rotuloPapel,
} from "./validacao";

describe("esquemaConvite", () => {
  const conviteValido = {
    nome: "Maria da Silva",
    email: "maria@mundonovo.agr.br",
    papel: "consultor" as const,
    alcadaAprovacao: false,
  };

  it("aceita um convite completo e válido", () => {
    const resultado = esquemaConvite.safeParse(conviteValido);
    expect(resultado.success).toBe(true);
  });

  it("normaliza espaços do nome", () => {
    const resultado = esquemaConvite.safeParse({
      ...conviteValido,
      nome: "  Maria da Silva  ",
    });
    expect(resultado.success).toBe(true);
    if (resultado.success) expect(resultado.data.nome).toBe("Maria da Silva");
  });

  it("recusa e-mail inválido com mensagem clara", () => {
    const resultado = esquemaConvite.safeParse({
      ...conviteValido,
      email: "nao-e-email",
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(primeiroErro(resultado.error)).toBe("Informe um e-mail válido.");
    }
  });

  it("recusa nome muito curto", () => {
    const resultado = esquemaConvite.safeParse({
      ...conviteValido,
      nome: "Jo",
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(primeiroErro(resultado.error)).toMatch(/nome completo/i);
    }
  });

  it("recusa papel fora do enum do banco", () => {
    const resultado = esquemaConvite.safeParse({
      ...conviteValido,
      papel: "estagiario",
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(primeiroErro(resultado.error)).toBe("Escolha um papel válido.");
    }
  });
});

describe("esquemaAtualizacaoPerfil", () => {
  it("aceita alteração de um único campo", () => {
    expect(
      esquemaAtualizacaoPerfil.safeParse({ papel: "gestor" }).success,
    ).toBe(true);
    expect(
      esquemaAtualizacaoPerfil.safeParse({ alcadaAprovacao: true }).success,
    ).toBe(true);
    expect(esquemaAtualizacaoPerfil.safeParse({ ativo: false }).success).toBe(
      true,
    );
  });

  it("recusa atualização vazia", () => {
    const resultado = esquemaAtualizacaoPerfil.safeParse({});
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(primeiroErro(resultado.error)).toBe(
        "Nenhuma alteração foi informada.",
      );
    }
  });
});

describe("esquemaIdPerfil e esquemaEmailConvite", () => {
  it("aceita um uuid e recusa identificador solto", () => {
    expect(
      esquemaIdPerfil.safeParse("6f9619ff-8b86-4d01-b42d-00cf4fc964ff")
        .success,
    ).toBe(true);
    expect(esquemaIdPerfil.safeParse("tamara").success).toBe(false);
  });

  it("valida o e-mail de reenvio de convite", () => {
    expect(
      esquemaEmailConvite.safeParse("pessoa@mundonovo.agr.br").success,
    ).toBe(true);
    expect(esquemaEmailConvite.safeParse("sem-arroba").success).toBe(false);
  });
});

describe("mapearPapelDemo", () => {
  it("mapeia os papéis descritivos da demonstração para o enum do banco", () => {
    expect(mapearPapelDemo("Gestora do Grupo")).toBe("gestor");
    expect(mapearPapelDemo("Consultor de Campo")).toBe("consultor");
    expect(mapearPapelDemo("Consultor de Campo (App)")).toBe("consultor");
    expect(mapearPapelDemo("Diretoria Executiva")).toBe("diretoria");
    expect(mapearPapelDemo("Jurídico")).toBe("juridico");
    expect(mapearPapelDemo("Auditor Externo")).toBe("auditor");
    expect(mapearPapelDemo("Administrativo")).toBe("comercial");
  });
});

describe("rotuloPapel", () => {
  it("traduz o valor do enum para o rótulo exibido", () => {
    expect(rotuloPapel("gestor")).toBe("Gestor");
    expect(rotuloPapel("juridico")).toBe("Jurídico");
  });
});
