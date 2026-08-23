import { describe, expect, it } from "vitest";
import {
  criarTrabalhador,
  desativarTrabalhador,
  registrarParticipacaoTreinamento,
} from "./acoes";

/**
 * Sem variáveis do Supabase (ambiente de teste), as ações validam os dados
 * e avisam que o modo demonstração não grava — sem quebrar a tela.
 */

const CLIENTE = "22222222-0000-4000-8000-000000000001";

function formularioTrabalhador(
  sobrescritas: Record<string, string> = {},
): FormData {
  const fd = new FormData();
  fd.set("clienteId", CLIENTE);
  fd.set("nome", "Maria de Lourdes");
  fd.set("vinculo", "fixo");
  fd.set("funcao", "Trabalhador Agrop. em Geral");
  fd.set("cbo", "621005");
  fd.set("salario", "1783.10");
  fd.set("admissao", "2026-01-15");
  fd.append("funcoesHabilitadas", "Trator");
  for (const [campo, valor] of Object.entries(sobrescritas)) {
    fd.set(campo, valor);
  }
  return fd;
}

describe("criarTrabalhador", () => {
  it("devolve erro claro quando o nome está incompleto", async () => {
    const estado = await criarTrabalhador(
      null,
      formularioTrabalhador({ nome: "Jo" }),
    );
    expect(estado).not.toBeNull();
    expect(estado!.ok).toBe(false);
    if (!estado!.ok) {
      expect(estado!.erro).toContain("nome completo");
    }
  });

  it("devolve erro claro quando o CBO é inválido", async () => {
    const estado = await criarTrabalhador(
      null,
      formularioTrabalhador({ cbo: "abc" }),
    );
    expect(estado!.ok).toBe(false);
    if (!estado!.ok) {
      expect(estado!.erro).toContain("CBO");
    }
  });

  it("com dados válidos e sem banco, avisa o modo demonstração", async () => {
    const estado = await criarTrabalhador(null, formularioTrabalhador());
    expect(estado!.ok).toBe(false);
    if (!estado!.ok) {
      expect(estado!.erro).toContain("Modo demonstração");
    }
  });
});

describe("desativarTrabalhador", () => {
  it("recusa identificador inválido", async () => {
    const fd = new FormData();
    fd.set("id", "nao-e-uuid");
    const estado = await desativarTrabalhador(null, fd);
    expect(estado!.ok).toBe(false);
    if (!estado!.ok) {
      expect(estado!.erro).toContain("Colaborador inválido");
    }
  });
});

describe("registrarParticipacaoTreinamento", () => {
  it("exige ao menos um colaborador na turma", async () => {
    const fd = new FormData();
    fd.set("treinamentoId", "88888888-0000-4000-8000-000000000001");
    fd.set("realizadoEm", "2026-08-01");
    const estado = await registrarParticipacaoTreinamento(null, fd);
    expect(estado!.ok).toBe(false);
    if (!estado!.ok) {
      expect(estado!.erro).toContain("ao menos um colaborador");
    }
  });

  it("exige data de realização válida", async () => {
    const fd = new FormData();
    fd.set("treinamentoId", "88888888-0000-4000-8000-000000000001");
    fd.append("trabalhadorIds", "66666666-0000-4000-8000-000000000001");
    fd.set("realizadoEm", "01/08/2026");
    const estado = await registrarParticipacaoTreinamento(null, fd);
    expect(estado!.ok).toBe(false);
  });

  it("com turma válida e sem banco, avisa o modo demonstração", async () => {
    const fd = new FormData();
    fd.set("treinamentoId", "88888888-0000-4000-8000-000000000001");
    fd.append("trabalhadorIds", "66666666-0000-4000-8000-000000000001");
    fd.append("trabalhadorIds", "66666666-0000-4000-8000-000000000002");
    fd.set("realizadoEm", "2026-08-01");
    const estado = await registrarParticipacaoTreinamento(null, fd);
    expect(estado!.ok).toBe(false);
    if (!estado!.ok) {
      expect(estado!.erro).toContain("Modo demonstração");
    }
  });
});
