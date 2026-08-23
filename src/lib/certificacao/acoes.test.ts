import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  criarCapa,
  decidirContrato,
  fecharCapa,
  moverEtapa,
} from "./acoes";
import { createClient, getUsuarioAtual } from "@/lib/supabase/server";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
  getUsuarioAtual: vi.fn(),
}));
// Guarda do modo auditor liberada aqui — o bloqueio tem teste próprio
// em src/lib/auditor/guarda.test.ts.
vi.mock("@/lib/auditor/guarda", () => ({
  exigirEscrita: vi.fn(async () => null),
}));

const ID_PROCESSO = "11111111-1111-4111-8111-111111111111";
const ID_CONTRATO = "22222222-1111-4111-8111-111111111111";
const ID_CAPA = "33333333-1111-4111-8111-111111111111";
const ID_USUARIO = "44444444-1111-4111-8111-111111111111";
const ID_CLIENTE = "55555555-1111-4111-8111-111111111111";

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

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getUsuarioAtual).mockResolvedValue({ id: ID_USUARIO } as never);
});

describe("moverEtapa — sequência do workflow", () => {
  const processo = (etapa: string) => ({
    data: {
      id: ID_PROCESSO,
      etapa,
      cliente_id: ID_CLIENTE,
      clientes: { nome: "Fazenda Alto da Serra" },
    },
  });

  it("recusa pular etapas (implantação → revisão do gestor)", async () => {
    const chamadas = usarSupabase({
      processos_certificacao: [processo("implantacao")],
    });

    const resultado = await moverEtapa(ID_PROCESSO, "revisao_gestor");

    expect(resultado).toMatchObject({ ok: false });
    if (!resultado.ok) expect(resultado.erro).toContain("Movimento inválido");
    expect(
      chamadas.some(
        (c) => c.tabela === "processos_certificacao" && c.metodo === "update",
      ),
    ).toBe(false);
  });

  it("avança 1 etapa e registra o movimento com o autor", async () => {
    const chamadas = usarSupabase({
      processos_certificacao: [processo("implantacao"), { error: null }],
      movimentos_workflow: [{ error: null }],
    });

    const resultado = await moverEtapa(ID_PROCESSO, "auditoria_interna");

    expect(resultado).toEqual({ ok: true });
    const atualizacao = chamadas.find(
      (c) => c.tabela === "processos_certificacao" && c.metodo === "update",
    );
    expect(atualizacao?.args[0]).toMatchObject({
      etapa: "auditoria_interna",
      atualizado_por: ID_USUARIO,
    });
    const movimento = chamadas.find(
      (c) => c.tabela === "movimentos_workflow" && c.metodo === "insert",
    );
    expect(movimento?.args[0]).toMatchObject({
      de: "implantacao",
      para: "auditoria_interna",
      autor_id: ID_USUARIO,
    });
  });

  it("ao chegar em 'na certificadora' cria a tarefa que notifica o gestor", async () => {
    const chamadas = usarSupabase({
      processos_certificacao: [processo("revisao_gestor"), { error: null }],
      movimentos_workflow: [{ error: null }],
      tarefas: [{ error: null }],
    });

    const resultado = await moverEtapa(ID_PROCESSO, "na_certificadora");

    expect(resultado).toEqual({ ok: true });
    const tarefa = chamadas.find(
      (c) => c.tabela === "tarefas" && c.metodo === "insert",
    );
    expect(tarefa?.args[0]).toMatchObject({
      origem: "evento",
      regra: "na-certificadora",
      cliente_id: ID_CLIENTE,
    });
    expect(String((tarefa?.args[0] as { titulo: string }).titulo)).toContain(
      "Notificar gestor",
    );
  });

  it("ignora o conflito de tarefa duplicada (unique regra+cliente+data)", async () => {
    usarSupabase({
      processos_certificacao: [processo("revisao_gestor"), { error: null }],
      movimentos_workflow: [{ error: null }],
      tarefas: [{ error: { message: "duplicate key", code: "23505" } }],
    });

    const resultado = await moverEtapa(ID_PROCESSO, "na_certificadora");

    expect(resultado).toEqual({ ok: true });
  });

  it("recusa voltar mais de 1 etapa", async () => {
    usarSupabase({
      processos_certificacao: [processo("na_certificadora")],
    });

    const resultado = await moverEtapa(ID_PROCESSO, "auditoria_interna");

    expect(resultado).toMatchObject({ ok: false });
  });
});

describe("decidirContrato — alçada é permissão", () => {
  it("recusa no servidor quem não tem alçada, mesmo chamando a action direto", async () => {
    const chamadas = usarSupabase({
      perfis: [{ data: { alcada_aprovacao: false } }],
    });

    const resultado = await decidirContrato(ID_CONTRATO, "aprovado");

    expect(resultado).toMatchObject({ ok: false });
    if (!resultado.ok) expect(resultado.erro).toContain("alçada");
    expect(
      chamadas.some((c) => c.tabela === "contratos" && c.metodo === "update"),
    ).toBe(false);
  });

  it("recusa quem não está logado", async () => {
    vi.mocked(getUsuarioAtual).mockResolvedValue(null);
    usarSupabase({});

    const resultado = await decidirContrato(ID_CONTRATO, "aprovado");

    expect(resultado).toMatchObject({ ok: false });
  });

  it("aprova registrando quem decidiu e quando", async () => {
    const chamadas = usarSupabase({
      perfis: [{ data: { alcada_aprovacao: true } }],
      contratos: [{ error: null }],
    });

    const resultado = await decidirContrato(ID_CONTRATO, "aprovado");

    expect(resultado).toEqual({ ok: true });
    const atualizacao = chamadas.find(
      (c) => c.tabela === "contratos" && c.metodo === "update",
    );
    expect(atualizacao?.args[0]).toMatchObject({
      status: "aprovado",
      decidido_por: ID_USUARIO,
    });
    expect(
      (atualizacao?.args[0] as { decidido_em: string }).decidido_em,
    ).toBeTruthy();
  });
});

describe("fecharCapa — CAPA só fecha sem pendências", () => {
  it("recusa fechar com ação pendente", async () => {
    const chamadas = usarSupabase({
      capa_acoes: [
        { data: [{ id: "a1", concluida: true }, { id: "a2", concluida: false }] },
      ],
    });

    const resultado = await fecharCapa(ID_CAPA);

    expect(resultado).toMatchObject({ ok: false });
    if (!resultado.ok) expect(resultado.erro).toContain("ações concluídas");
    expect(
      chamadas.some((c) => c.tabela === "capas" && c.metodo === "update"),
    ).toBe(false);
  });

  it("fecha quando todas as ações estão concluídas", async () => {
    const chamadas = usarSupabase({
      capa_acoes: [
        { data: [{ id: "a1", concluida: true }, { id: "a2", concluida: true }] },
      ],
      capas: [{ error: null }],
    });

    const resultado = await fecharCapa(ID_CAPA);

    expect(resultado).toEqual({ ok: true });
    const atualizacao = chamadas.find(
      (c) => c.tabela === "capas" && c.metodo === "update",
    );
    expect(atualizacao?.args[0]).toMatchObject({
      status: "fechada",
      verificador_id: ID_USUARIO,
    });
  });
});

describe("criarCapa — NC nunca fica sem plano", () => {
  const dadosValidos = {
    clienteId: ID_CLIENTE,
    descricao: "Depósito de defensivos sem sinalização adequada",
    severidade: "maior" as const,
    responsavel: "Silvio Dutra",
    prazo: "2026-09-15",
    origem: "campo" as const,
    itemCodigo: "EST-1",
    primeiraAcao: "Instalar sinalização NR-31",
  };

  it("recusa CAPA sem prazo", async () => {
    usarSupabase({});
    const resultado = await criarCapa({ ...dadosValidos, prazo: "" });
    expect(resultado).toMatchObject({ ok: false });
    if (!resultado.ok) expect(resultado.erro).toContain("prazo");
  });

  it("recusa CAPA sem responsável", async () => {
    usarSupabase({});
    const resultado = await criarCapa({ ...dadosValidos, responsavel: "" });
    expect(resultado).toMatchObject({ ok: false });
    if (!resultado.ok) expect(resultado.erro).toContain("responsável");
  });

  it("registra a CAPA aberta com a primeira ação do plano", async () => {
    const chamadas = usarSupabase({
      capas: [{ data: { id: ID_CAPA } }],
      capa_acoes: [{ error: null }],
    });

    const resultado = await criarCapa(dadosValidos);

    // A ação devolve o id da CAPA criada — a auditoria externa usa para vincular.
    expect(resultado).toEqual({ ok: true, id: ID_CAPA });
    const insercao = chamadas.find(
      (c) => c.tabela === "capas" && c.metodo === "insert",
    );
    expect(insercao?.args[0]).toMatchObject({
      cliente_id: ID_CLIENTE,
      responsavel: "Silvio Dutra",
      prazo: "2026-09-15",
      status: "aberta",
    });
    const acao = chamadas.find(
      (c) => c.tabela === "capa_acoes" && c.metodo === "insert",
    );
    expect(acao?.args[0]).toMatchObject({
      capa_id: ID_CAPA,
      descricao: "Instalar sinalização NR-31",
    });
  });
});

describe("modo demonstração", () => {
  it("as actions avisam que nada é gravado sem Supabase", async () => {
    vi.mocked(createClient).mockResolvedValue(null as never);

    const resultado = await moverEtapa(ID_PROCESSO, "auditoria_interna");

    expect(resultado).toMatchObject({ ok: false });
    if (!resultado.ok) expect(resultado.erro).toContain("demonstração");
  });
});
