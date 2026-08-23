import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  atualizarStatusNegociacao,
  criarLote,
  criarNegociacao,
  marcarLoteEntregue,
} from "./acoes";
import { createClient } from "@/lib/supabase/server";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const ID_LOTE = "11111111-1111-4111-8111-111111111111";
const ID_NEGOCIACAO = "22222222-1111-4111-8111-111111111111";
const ID_CLIENTE = "33333333-1111-4111-8111-111111111111";

type Resultado = {
  data?: unknown;
  error?: { message: string; code?: string } | null;
};

type Chamada = { tabela: string; metodo: string; args: unknown[] };

/**
 * Supabase de mentira para os testes: cada `from(tabela)` consome o próximo
 * resultado da fila daquela tabela; toda chamada de método fica registrada.
 */
function criarSupabaseFalso(filas: Record<string, Resultado[]>) {
  const chamadas: Chamada[] = [];

  function tabelaFalsa(tabela: string) {
    const resultado = (filas[tabela] ?? []).shift() ?? { data: null, error: null };
    const proxy: Record<string | symbol, unknown> = new Proxy(
      {},
      {
        get(_alvo, prop) {
          if (typeof prop !== "string") return undefined;
          if (prop === "then") {
            return (resolve: (valor: unknown) => void) =>
              resolve({
                data: resultado.data ?? null,
                error: resultado.error ?? null,
              });
          }
          return (...args: unknown[]) => {
            chamadas.push({ tabela, metodo: prop, args });
            return proxy;
          };
        },
      },
    );
    return proxy;
  }

  return {
    supabase: { from: (tabela: string) => tabelaFalsa(tabela) },
    chamadas,
  };
}

function usarSupabase(filas: Record<string, Resultado[]>) {
  const { supabase, chamadas } = criarSupabaseFalso(filas);
  vi.mocked(createClient).mockResolvedValue(supabase as never);
  return chamadas;
}

function formularioNegociacao(campos: Record<string, string>) {
  const formData = new FormData();
  const base: Record<string, string> = {
    loteId: ID_LOTE,
    comprador: "Cooxupé",
    sacas: "100",
    precoPorSaca: "2500",
    status: "proposta",
    ...campos,
  };
  for (const [campo, valor] of Object.entries(base)) {
    formData.set(campo, valor);
  }
  return formData;
}

const loteEmEstoque = (
  sacas: number,
  negociacoes: { id: string; sacas: number; status: string }[] = [],
): Resultado => ({
  data: { id: ID_LOTE, sacas, status: "estoque", negociacoes },
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("criarLote", () => {
  it("valida a identificação antes de tocar no banco", async () => {
    vi.mocked(createClient).mockResolvedValue(null);
    const formData = new FormData();
    formData.set("clienteId", ID_CLIENTE);
    formData.set("identificacao", "");
    formData.set("sacas", "350");

    const resultado = await criarLote(null, formData);
    expect(resultado?.ok).toBe(false);
    expect(resultado?.mensagem).toContain("identificação do lote");
  });

  it("sem Supabase, responde com a mensagem do modo demonstração", async () => {
    vi.mocked(createClient).mockResolvedValue(null);
    const formData = new FormData();
    formData.set("clienteId", ID_CLIENTE);
    formData.set("identificacao", "LOTE-2026-010");
    formData.set("sacas", "350");

    const resultado = await criarLote(null, formData);
    expect(resultado?.ok).toBe(false);
    expect(resultado?.mensagem).toContain("modo demonstração");
  });

  it("grava o lote em estoque e traduz o conflito de identificação", async () => {
    const chamadas = usarSupabase({ lotes: [{ error: null }] });
    const formData = new FormData();
    formData.set("clienteId", ID_CLIENTE);
    formData.set("identificacao", "LOTE-2026-010");
    formData.set("sacas", "350,5");
    formData.set("origemTalhoes", "T-01, T-02");

    const resultado = await criarLote(null, formData);
    expect(resultado?.ok).toBe(true);
    const insercao = chamadas.find(
      (c) => c.tabela === "lotes" && c.metodo === "insert",
    );
    expect(insercao?.args[0]).toMatchObject({
      cliente_id: ID_CLIENTE,
      identificacao: "LOTE-2026-010",
      sacas: 350.5,
      origem_talhoes: "T-01, T-02",
      status: "estoque",
    });

    usarSupabase({
      lotes: [{ error: { message: "duplicate key", code: "23505" } }],
    });
    const conflito = await criarLote(null, formData);
    expect(conflito?.ok).toBe(false);
    expect(conflito?.mensagem).toContain("Já existe um lote");
  });
});

describe("criarNegociacao — saldo do lote", () => {
  it("recusa negociação acima do saldo disponível", async () => {
    const chamadas = usarSupabase({
      lotes: [
        loteEmEstoque(350, [
          { id: ID_NEGOCIACAO, sacas: 300, status: "fechada" },
        ]),
      ],
    });

    const resultado = await criarNegociacao(
      null,
      formularioNegociacao({ sacas: "100" }),
    );

    expect(resultado?.ok).toBe(false);
    expect(resultado?.mensagem).toContain("Saldo insuficiente");
    expect(
      chamadas.some((c) => c.tabela === "negociacoes" && c.metodo === "insert"),
    ).toBe(false);
  });

  it("recusa negociação em lote já entregue", async () => {
    usarSupabase({
      lotes: [{ data: { id: ID_LOTE, sacas: 120, status: "entregue", negociacoes: [] } }],
    });

    const resultado = await criarNegociacao(null, formularioNegociacao({}));
    expect(resultado?.ok).toBe(false);
    expect(resultado?.mensagem).toContain("já foi entregue");
  });

  it("fechada que zera o saldo muda o lote para negociado", async () => {
    const chamadas = usarSupabase({
      lotes: [loteEmEstoque(200), { error: null }],
      negociacoes: [{ error: null }],
    });

    const resultado = await criarNegociacao(
      null,
      formularioNegociacao({ sacas: "200", status: "fechada" }),
    );

    expect(resultado?.ok).toBe(true);
    const atualizacao = chamadas.find(
      (c) => c.tabela === "lotes" && c.metodo === "update",
    );
    expect(atualizacao?.args[0]).toEqual({ status: "negociado" });
  });

  it("proposta não muda o status do lote", async () => {
    const chamadas = usarSupabase({
      lotes: [loteEmEstoque(200)],
      negociacoes: [{ error: null }],
    });

    const resultado = await criarNegociacao(
      null,
      formularioNegociacao({ sacas: "200", status: "proposta" }),
    );

    expect(resultado?.ok).toBe(true);
    expect(
      chamadas.some((c) => c.tabela === "lotes" && c.metodo === "update"),
    ).toBe(false);
  });
});

describe("atualizarStatusNegociacao", () => {
  const negociacao = (
    status: string,
    lote: { sacas: number; status: string; negociacoes: unknown[] },
  ): Resultado => ({
    data: {
      id: ID_NEGOCIACAO,
      sacas: 200,
      status,
      lote_id: ID_LOTE,
      lotes: { id: ID_LOTE, ...lote },
    },
  });

  it("fechar a proposta que zera o saldo muda o lote para negociado", async () => {
    const chamadas = usarSupabase({
      negociacoes: [
        negociacao("proposta", {
          sacas: 200,
          status: "estoque",
          negociacoes: [{ id: ID_NEGOCIACAO, sacas: 200, status: "proposta" }],
        }),
        { error: null },
      ],
      lotes: [{ error: null }],
    });

    const resultado = await atualizarStatusNegociacao(ID_NEGOCIACAO, "fechada");

    expect(resultado).toEqual({ ok: true });
    const atualizacaoLote = chamadas.find(
      (c) => c.tabela === "lotes" && c.metodo === "update",
    );
    expect(atualizacaoLote?.args[0]).toEqual({ status: "negociado" });
  });

  it("recusa fechar quando outras fechadas já consumiram o saldo", async () => {
    usarSupabase({
      negociacoes: [
        negociacao("proposta", {
          sacas: 300,
          status: "estoque",
          negociacoes: [
            { id: ID_NEGOCIACAO, sacas: 200, status: "proposta" },
            { id: "outra", sacas: 250, status: "fechada" },
          ],
        }),
      ],
    });

    const resultado = await atualizarStatusNegociacao(ID_NEGOCIACAO, "fechada");
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.erro).toContain("Saldo insuficiente");
  });

  it("cancelar a única fechada devolve o lote ao estoque", async () => {
    const chamadas = usarSupabase({
      negociacoes: [
        negociacao("fechada", {
          sacas: 200,
          status: "negociado",
          negociacoes: [{ id: ID_NEGOCIACAO, sacas: 200, status: "fechada" }],
        }),
        { error: null },
      ],
      lotes: [{ error: null }],
    });

    const resultado = await atualizarStatusNegociacao(
      ID_NEGOCIACAO,
      "cancelada",
    );

    expect(resultado).toEqual({ ok: true });
    const atualizacaoLote = chamadas.find(
      (c) => c.tabela === "lotes" && c.metodo === "update",
    );
    expect(atualizacaoLote?.args[0]).toEqual({ status: "estoque" });
  });

  it("negociação cancelada não pode ser reaberta", async () => {
    usarSupabase({
      negociacoes: [
        negociacao("cancelada", {
          sacas: 200,
          status: "estoque",
          negociacoes: [],
        }),
      ],
    });

    const resultado = await atualizarStatusNegociacao(ID_NEGOCIACAO, "fechada");
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.erro).toContain("não pode ser reaberta");
  });
});

describe("marcarLoteEntregue", () => {
  it("recusa a entrega sem negociação fechada", async () => {
    const chamadas = usarSupabase({
      lotes: [
        loteEmEstoque(350, [
          { id: ID_NEGOCIACAO, sacas: 100, status: "proposta" },
        ]),
      ],
    });

    const resultado = await marcarLoteEntregue(ID_LOTE);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.erro).toContain("negociação fechada");
    }
    expect(
      chamadas.some((c) => c.tabela === "lotes" && c.metodo === "update"),
    ).toBe(false);
  });

  it("marca a entrega quando há venda fechada", async () => {
    const chamadas = usarSupabase({
      lotes: [
        {
          data: {
            id: ID_LOTE,
            sacas: 200,
            status: "negociado",
            negociacoes: [
              { id: ID_NEGOCIACAO, sacas: 200, status: "fechada" },
            ],
          },
        },
        { error: null },
      ],
    });

    const resultado = await marcarLoteEntregue(ID_LOTE);
    expect(resultado).toEqual({ ok: true });
    const atualizacao = chamadas.find(
      (c) => c.tabela === "lotes" && c.metodo === "update",
    );
    expect(atualizacao?.args[0]).toEqual({ status: "entregue" });
  });
});
