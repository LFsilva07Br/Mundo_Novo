import { describe, expect, it } from "vitest";
import {
  deFormData,
  esquemaCliente,
  esquemaClienteExistente,
  esquemaContato,
  esquemaGrupo,
  esquemaGrupoExistente,
  esquemaRegistroContato,
  esquemaRemocaoContato,
  primeiroErro,
} from "./validacao";

describe("esquemaGrupo", () => {
  it("aceita um grupo válido só com nome e administração", () => {
    const resultado = esquemaGrupo.safeParse({
      nome: "Grupo Alta Mogiana",
      administracao: "mundo_novo",
    });
    expect(resultado.success).toBe(true);
  });

  it("rejeita nome vazio com mensagem em linguagem de negócio", () => {
    const resultado = esquemaGrupo.safeParse({
      nome: "",
      administracao: "mundo_novo",
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(primeiroErro(resultado.error)).toBe("Informe o nome do grupo.");
    }
  });

  it("rejeita administração desconhecida", () => {
    const resultado = esquemaGrupo.safeParse({
      nome: "Grupo Teste",
      administracao: "governo",
    });
    expect(resultado.success).toBe(false);
  });

  it("normaliza a UF para maiúsculas e rejeita UF com tamanho errado", () => {
    const ok = esquemaGrupo.safeParse({
      nome: "Grupo Teste",
      administracao: "terceiro",
      uf: "mg",
    });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.uf).toBe("MG");

    const errado = esquemaGrupo.safeParse({
      nome: "Grupo Teste",
      administracao: "terceiro",
      uf: "Minas",
    });
    expect(errado.success).toBe(false);
  });

  it("exige o id na atualização de grupo", () => {
    const resultado = esquemaGrupoExistente.safeParse({
      nome: "Grupo Teste",
      administracao: "mundo_novo",
    });
    expect(resultado.success).toBe(false);
  });
});

describe("esquemaCliente", () => {
  const clienteValido = {
    nome: "Fazenda Boa Esperança",
    tipo: "fazenda",
    cidade: "Patrocínio",
    uf: "MG",
    regiao: "Cerrado Mineiro",
  };

  it("aceita cliente válido e aplica a fase padrão de implantação", () => {
    const resultado = esquemaCliente.safeParse(clienteValido);
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.fase).toBe("implantacao");
      expect(resultado.data.grupoId).toBeUndefined();
    }
  });

  it("aceita grupo opcional e produtor opcional", () => {
    const resultado = esquemaCliente.safeParse({
      ...clienteValido,
      grupoId: "cerrado-mineiro",
      produtor: "Maria Silva",
    });
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.grupoId).toBe("cerrado-mineiro");
    }
  });

  it("rejeita cliente sem cidade, sem região ou com UF inválida", () => {
    expect(
      esquemaCliente.safeParse({ ...clienteValido, cidade: "" }).success,
    ).toBe(false);
    expect(
      esquemaCliente.safeParse({ ...clienteValido, regiao: "" }).success,
    ).toBe(false);
    expect(
      esquemaCliente.safeParse({ ...clienteValido, uf: "M" }).success,
    ).toBe(false);
  });

  it("rejeita tipo de cliente desconhecido", () => {
    const resultado = esquemaCliente.safeParse({
      ...clienteValido,
      tipo: "cooperativa",
    });
    expect(resultado.success).toBe(false);
  });

  it("exige o id e aceita a fase na atualização de cliente", () => {
    expect(esquemaClienteExistente.safeParse(clienteValido).success).toBe(
      false,
    );
    const resultado = esquemaClienteExistente.safeParse({
      ...clienteValido,
      id: "cliente-1",
      fase: "ativo",
    });
    expect(resultado.success).toBe(true);
    if (resultado.success) expect(resultado.data.fase).toBe("ativo");
  });
});

describe("esquemaContato", () => {
  it("aceita contato válido com telefone e e-mail opcionais", () => {
    const resultado = esquemaContato.safeParse({
      clienteId: "cliente-1",
      nome: "Tâmara Isa",
      area: "ambiental",
    });
    expect(resultado.success).toBe(true);
  });

  it("rejeita área desconhecida e e-mail inválido", () => {
    expect(
      esquemaContato.safeParse({
        clienteId: "cliente-1",
        nome: "Fulano",
        area: "financeiro",
      }).success,
    ).toBe(false);

    const emailInvalido = esquemaContato.safeParse({
      clienteId: "cliente-1",
      nome: "Fulano",
      area: "outro",
      email: "nao-e-email",
    });
    expect(emailInvalido.success).toBe(false);
    if (!emailInvalido.success) {
      expect(primeiroErro(emailInvalido.error)).toBe(
        "E-mail do contato inválido.",
      );
    }
  });

  it("na remoção exige cliente, nome e área", () => {
    expect(
      esquemaRemocaoContato.safeParse({
        clienteId: "cliente-1",
        nome: "Fulano",
        area: "outro",
      }).success,
    ).toBe(true);
    expect(
      esquemaRemocaoContato.safeParse({ clienteId: "", nome: "", area: "x" })
        .success,
    ).toBe(false);
  });
});

describe("esquemaRegistroContato", () => {
  const registroValido = {
    clienteId: "cliente-1",
    tipo: "ligacao",
    assunto: "Agendamento da auditoria",
    ocorridoEm: "2026-08-20T10:30",
  };

  it("aceita registro válido sem detalhes nem duração", () => {
    const resultado = esquemaRegistroContato.safeParse(registroValido);
    expect(resultado.success).toBe(true);
  });

  it("converte a duração para número inteiro positivo", () => {
    const resultado = esquemaRegistroContato.safeParse({
      ...registroValido,
      duracaoMinutos: "45",
    });
    expect(resultado.success).toBe(true);
    if (resultado.success) expect(resultado.data.duracaoMinutos).toBe(45);
  });

  it("rejeita duração zero, negativa, quebrada ou acima de um dia", () => {
    for (const duracao of ["0", "-10", "12.5", "2000"]) {
      const resultado = esquemaRegistroContato.safeParse({
        ...registroValido,
        duracaoMinutos: duracao,
      });
      expect(resultado.success).toBe(false);
    }
  });

  it("rejeita tipo de contato desconhecido e assunto curto demais", () => {
    expect(
      esquemaRegistroContato.safeParse({ ...registroValido, tipo: "carta" })
        .success,
    ).toBe(false);
    expect(
      esquemaRegistroContato.safeParse({ ...registroValido, assunto: "ok" })
        .success,
    ).toBe(false);
  });

  it("rejeita data inválida", () => {
    const resultado = esquemaRegistroContato.safeParse({
      ...registroValido,
      ocorridoEm: "ontem de manhã",
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(primeiroErro(resultado.error)).toBe("Data e hora inválidas.");
    }
  });
});

describe("deFormData", () => {
  it("converte FormData em objeto e descarta campos em branco", () => {
    const formData = new FormData();
    formData.set("nome", "Fazenda Teste");
    formData.set("produtor", "   ");
    formData.set("grupoId", "");
    expect(deFormData(formData)).toEqual({ nome: "Fazenda Teste" });
  });
});
