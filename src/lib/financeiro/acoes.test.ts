import { describe, expect, it, vi } from "vitest";
import {
  criarContratoFinanceiro,
  gerarFaturasDoMes,
  registrarPagamento,
} from "./acoes";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

function formularioContrato(campos: Record<string, string> = {}) {
  const formData = new FormData();
  const base: Record<string, string> = {
    clienteId: "tecoara",
    descricao: "Acompanhamento de conformidade Rainforest",
    valorMensal: "1.200,00",
    diaVencimento: "5",
    inicio: "2026-08-10",
    fim: "",
    ...campos,
  };
  for (const [campo, valor] of Object.entries(base)) {
    formData.set(campo, valor);
  }
  return formData;
}

/**
 * Sem env do Supabase (ambiente de teste), o módulo está em pré-ativação:
 * a validação com zod acontece normalmente, mas nada é gravado — as ações
 * respondem com o aviso da migration financeira pendente.
 */

describe("criarContratoFinanceiro em pré-ativação", () => {
  it("com dados válidos, avisa que a gravação depende da migration", async () => {
    const estado = await criarContratoFinanceiro(null, formularioContrato());
    expect(estado).toEqual({
      ok: false,
      mensagem: expect.stringContaining("migration financeira"),
    });
  });

  it("valida o formulário antes de qualquer aviso de banco", async () => {
    const semCliente = await criarContratoFinanceiro(
      null,
      formularioContrato({ clienteId: "" }),
    );
    expect(semCliente?.ok).toBe(false);
    expect(semCliente?.mensagem).toMatch(/escolha o cliente/i);

    const diaInvalido = await criarContratoFinanceiro(
      null,
      formularioContrato({ diaVencimento: "31" }),
    );
    expect(diaInvalido?.mensagem).toMatch(/dia até 28/i);

    const fimInvalido = await criarContratoFinanceiro(
      null,
      formularioContrato({ fim: "2026-01-01" }),
    );
    expect(fimInvalido?.mensagem).toMatch(/depois do início/i);
  });
});

describe("registrarPagamento em pré-ativação", () => {
  it("com dados válidos, avisa que a gravação depende da migration", async () => {
    const resultado = await registrarPagamento("fatura-tecoara", "2026-08-22");
    expect(resultado).toEqual({
      ok: false,
      erro: expect.stringContaining("migration financeira"),
    });
  });

  it("rejeita fatura vazia e data fora do formato", async () => {
    const semFatura = await registrarPagamento("", "2026-08-22");
    expect(semFatura).toMatchObject({ ok: false });

    const dataInvalida = await registrarPagamento("fatura-1", "22/08/2026");
    expect(dataInvalida).toMatchObject({ ok: false });
    if (!dataInvalida.ok) {
      expect(dataInvalida.erro).toMatch(/data de pagamento inválida/i);
    }
  });
});

describe("gerarFaturasDoMes em pré-ativação", () => {
  it("com competência válida, avisa que a gravação depende da migration", async () => {
    const resultado = await gerarFaturasDoMes("2026-08");
    expect(resultado).toEqual({
      ok: false,
      erro: expect.stringContaining("migration financeira"),
    });
  });

  it("sem argumento, usa o mês corrente e continua validando", async () => {
    const resultado = await gerarFaturasDoMes();
    expect(resultado).toMatchObject({ ok: false });

    const invalida = await gerarFaturasDoMes("2026-13");
    expect(invalida).toMatchObject({ ok: false });
    if (!invalida.ok) expect(invalida.erro).toMatch(/competência inválida/i);
  });
});
