import { describe, expect, it } from "vitest";
import {
  calcularVenceEm,
  esquemaMoradia,
  esquemaMorador,
  esquemaParticipacao,
  esquemaTrabalhador,
  primeiraMensagem,
} from "./validacao";

const CLIENTE = "22222222-0000-4000-8000-000000000001";
const TREINAMENTO = "88888888-0000-4000-8000-000000000001";
const TRABALHADOR = "66666666-0000-4000-8000-000000000001";

const trabalhadorValido = {
  clienteId: CLIENTE,
  nome: "Maria de Lourdes",
  vinculo: "fixo",
  funcao: "Trabalhador Agrop. em Geral",
  cbo: "621005",
  salario: "1783.10",
  admissao: "2026-01-15",
  moradia: true,
  alimentacao: false,
  transporte: false,
  cestaBasica: false,
  gratificacoes: false,
  insalubridade: false,
  periculosidade: false,
  funcoesHabilitadas: ["Trator", "Outros"],
};

describe("esquemaTrabalhador", () => {
  it("aceita um cadastro completo e converte o salário para número", () => {
    const resultado = esquemaTrabalhador.safeParse(trabalhadorValido);
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.salario).toBe(1783.1);
      expect(resultado.data.funcoesHabilitadas).toEqual(["Trator", "Outros"]);
    }
  });

  it("aceita campos opcionais vazios (cbo, salário, datas, gênero)", () => {
    const resultado = esquemaTrabalhador.safeParse({
      clienteId: CLIENTE,
      nome: "João da Silva",
      vinculo: "temporario",
      funcao: "Colhedor",
      moradia: false,
      alimentacao: false,
      transporte: false,
      cestaBasica: false,
      gratificacoes: false,
      insalubridade: false,
      periculosidade: false,
      funcoesHabilitadas: [],
    });
    expect(resultado.success).toBe(true);
  });

  it("recusa nome curto demais com mensagem clara", () => {
    const resultado = esquemaTrabalhador.safeParse({
      ...trabalhadorValido,
      nome: "Jo",
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(primeiraMensagem(resultado.error)).toContain("nome completo");
    }
  });

  it("recusa vínculo desconhecido", () => {
    const resultado = esquemaTrabalhador.safeParse({
      ...trabalhadorValido,
      vinculo: "diarista",
    });
    expect(resultado.success).toBe(false);
  });

  it("recusa CBO que não tem 6 números", () => {
    const resultado = esquemaTrabalhador.safeParse({
      ...trabalhadorValido,
      cbo: "62A05",
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(primeiraMensagem(resultado.error)).toContain("CBO");
    }
  });

  it("recusa salário zerado ou negativo", () => {
    for (const salario of ["0", "-100"]) {
      const resultado = esquemaTrabalhador.safeParse({
        ...trabalhadorValido,
        salario,
      });
      expect(resultado.success, `salário ${salario}`).toBe(false);
    }
  });

  it("recusa data de admissão fora do formato", () => {
    const resultado = esquemaTrabalhador.safeParse({
      ...trabalhadorValido,
      admissao: "15/01/2026",
    });
    expect(resultado.success).toBe(false);
  });
});

describe("esquemaMoradia e esquemaMorador", () => {
  it("moradia exige cliente e nome", () => {
    expect(
      esquemaMoradia.safeParse({ clienteId: CLIENTE, nome: "Casa 04" }).success,
    ).toBe(true);
    expect(
      esquemaMoradia.safeParse({ clienteId: CLIENTE, nome: "" }).success,
    ).toBe(false);
    expect(
      esquemaMoradia.safeParse({ clienteId: "abc", nome: "Casa 04" }).success,
    ).toBe(false);
  });

  it("morador exige moradia, nome e parentesco", () => {
    const moradiaId = "77777777-0000-4000-8000-000000000001";
    expect(
      esquemaMorador.safeParse({
        moradiaId,
        nome: "Josiane Maria",
        parentesco: "Esposa",
      }).success,
    ).toBe(true);
    expect(
      esquemaMorador.safeParse({ moradiaId, nome: "Josiane Maria" }).success,
    ).toBe(false);
  });
});

describe("esquemaParticipacao", () => {
  it("exige ao menos um colaborador participante", () => {
    const resultado = esquemaParticipacao.safeParse({
      treinamentoId: TREINAMENTO,
      trabalhadorIds: [],
      realizadoEm: "2026-08-01",
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(primeiraMensagem(resultado.error)).toContain(
        "ao menos um colaborador",
      );
    }
  });

  it("aceita turma com data e colaboradores válidos", () => {
    const resultado = esquemaParticipacao.safeParse({
      treinamentoId: TREINAMENTO,
      trabalhadorIds: [TRABALHADOR],
      realizadoEm: "2026-08-01",
    });
    expect(resultado.success).toBe(true);
  });
});

describe("calcularVenceEm — realização + periodicidade do treinamento", () => {
  it("treinamento anual vence um ano após a realização", () => {
    expect(calcularVenceEm("2026-03-06", 12)).toBe("2027-03-06");
  });

  it("treinamento bienal vence dois anos após a realização", () => {
    expect(calcularVenceEm("2026-06-08", 24)).toBe("2028-06-08");
  });

  it("ajusta fim de mês sem pular para o mês seguinte", () => {
    // 31/01 + 1 mês não existe — vence no último dia de fevereiro.
    expect(calcularVenceEm("2026-01-31", 1)).toBe("2026-02-28");
  });

  it("periodicidade que cruza a virada do ano", () => {
    expect(calcularVenceEm("2026-11-15", 3)).toBe("2027-02-15");
  });
});
