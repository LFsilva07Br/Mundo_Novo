import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { BIBLIOTECA_NORMAS } from "./biblioteca";
import { criarChecklistDeTemplate } from "./biblioteca-acoes";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => null),
}));

const criarClienteMock = vi.mocked(createClient);

type LinhaInserida = Record<string, unknown>;

/**
 * Cliente Supabase falso: responde à checagem de duplicidade e captura os
 * inserts de checklists, checklist_versoes e checklist_itens.
 */
function clienteFalso({
  existente = null,
}: { existente?: { id: string } | null } = {}) {
  const inserts: {
    checklist?: LinhaInserida;
    versao?: LinhaInserida;
    itens?: LinhaInserida[];
  } = {};

  const from = vi.fn((tabela: string) => {
    if (tabela === "checklists") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({
                data: existente,
                error: null,
              })),
            })),
          })),
        })),
        insert: vi.fn((valores: LinhaInserida) => {
          inserts.checklist = valores;
          return {
            select: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: { id: "checklist-novo" },
                error: null,
              })),
            })),
          };
        }),
      };
    }
    if (tabela === "checklist_versoes") {
      return {
        insert: vi.fn((valores: LinhaInserida) => {
          inserts.versao = valores;
          return {
            select: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: { id: "versao-nova" },
                error: null,
              })),
            })),
          };
        }),
      };
    }
    return {
      insert: vi.fn(async (valores: LinhaInserida[]) => {
        inserts.itens = valores;
        return { error: null };
      }),
    };
  });

  return { cliente: { from }, inserts };
}

beforeEach(() => {
  criarClienteMock.mockReset();
  criarClienteMock.mockResolvedValue(null);
});

describe("criarChecklistDeTemplate", () => {
  it("sem Supabase, explica o modo demonstração", async () => {
    const resultado = await criarChecklistDeTemplate("quatro_c");
    expect(resultado).toEqual({
      ok: false,
      erro: "Modo demonstração — conecte o Supabase para gravar alterações.",
    });
  });

  it("cria checklist + versão 1 RASCUNHO com todos os itens do template", async () => {
    const { cliente, inserts } = clienteFalso();
    criarClienteMock.mockResolvedValue(
      cliente as unknown as Awaited<ReturnType<typeof createClient>>,
    );

    const resultado = await criarChecklistDeTemplate("organico");
    expect(resultado).toEqual({ ok: true, id: "checklist-novo" });

    const template = BIBLIOTECA_NORMAS.organico;
    expect(inserts.checklist).toEqual({
      nome: template.nome,
      norma: "organico",
      versao_norma: template.versaoNorma,
    });
    // Versão 1 nasce em rascunho — nada é publicado pela biblioteca.
    expect(inserts.versao).toEqual({
      checklist_id: "checklist-novo",
      numero: 1,
      status: "rascunho",
    });

    expect(inserts.itens).toHaveLength(template.itens.length);
    expect(inserts.itens?.[0]).toMatchObject({
      versao_id: "versao-nova",
      ordem: 1,
      codigo: template.itens[0].codigo,
      pergunta: template.itens[0].pergunta,
      referencia_norma: template.itens[0].referenciaNorma,
      permite_na: true,
    });
    expect(inserts.itens?.map((i) => i.ordem)).toEqual(
      template.itens.map((_, indice) => indice + 1),
    );
  });

  it("recusa criar de novo quando a norma já tem checklist", async () => {
    const { cliente } = clienteFalso({ existente: { id: "ja-existe" } });
    criarClienteMock.mockResolvedValue(
      cliente as unknown as Awaited<ReturnType<typeof createClient>>,
    );

    const resultado = await criarChecklistDeTemplate("quatro_c");
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.erro).toMatch(/Já existe um checklist desta norma/);
    }
  });
});
