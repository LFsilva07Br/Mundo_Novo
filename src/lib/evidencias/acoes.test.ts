import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  enviarEvidenciaCapa,
  enviarFotoVisita,
  listarEvidenciasCapa,
  listarFotosVisita,
} from "./acoes";
import { createClient, getUsuarioAtual } from "@/lib/supabase/server";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
  getUsuarioAtual: vi.fn(),
}));

const ID_VISITA = "11111111-1111-4111-8111-111111111111";
const ID_ITEM = "22222222-1111-4111-8111-111111111111";
const ID_CAPA = "33333333-1111-4111-8111-111111111111";
const ID_ACAO = "44444444-1111-4111-8111-111111111111";
const ID_USUARIO = "55555555-1111-4111-8111-111111111111";

type Resultado = {
  data?: unknown;
  error?: { message: string } | null;
};

type Chamada = { alvo: string; metodo: string; args: unknown[] };

/**
 * Supabase de mentira: cada `from(tabela)` consome o próximo resultado da
 * fila daquela tabela; o storage responde upload/assinatura/remoção e toda
 * chamada fica registrada para inspeção.
 */
function criarSupabaseFalso(
  filas: Record<string, Resultado[]>,
  storage: { erroUpload?: string } = {},
) {
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
            chamadas.push({ alvo: tabela, metodo: prop, args });
            return proxy;
          };
        },
      },
    );
    return proxy;
  }

  const supabase = {
    from: (tabela: string) => tabelaFalsa(tabela),
    storage: {
      from: (bucket: string) => ({
        upload: async (...args: unknown[]) => {
          chamadas.push({ alvo: `storage:${bucket}`, metodo: "upload", args });
          return {
            error: storage.erroUpload ? { message: storage.erroUpload } : null,
          };
        },
        createSignedUrls: async (caminhos: string[], validade: number) => {
          chamadas.push({
            alvo: `storage:${bucket}`,
            metodo: "createSignedUrls",
            args: [caminhos, validade],
          });
          return {
            data: caminhos.map((caminho) => ({
              path: caminho,
              signedUrl: `https://assinada.exemplo/${caminho}`,
            })),
            error: null,
          };
        },
        remove: async (...args: unknown[]) => {
          chamadas.push({ alvo: `storage:${bucket}`, metodo: "remove", args });
          return { error: null };
        },
      }),
    },
  };

  return { supabase, chamadas };
}

function usarSupabase(
  filas: Record<string, Resultado[]>,
  storage: { erroUpload?: string } = {},
) {
  const { supabase, chamadas } = criarSupabaseFalso(filas, storage);
  vi.mocked(createClient).mockResolvedValue(supabase as never);
  return chamadas;
}

function formularioComFoto(tipo = "image/jpeg", nome = "foto.jpg") {
  const dados = new FormData();
  dados.append("arquivo", new File(["conteudo-da-foto"], nome, { type: tipo }));
  return dados;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getUsuarioAtual).mockResolvedValue({ id: ID_USUARIO } as never);
});

describe("modo demonstração (sem Supabase)", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(null as never);
  });

  it("enviar foto de visita degrada com aviso amigável", async () => {
    const resultado = await enviarFotoVisita(ID_VISITA, null, formularioComFoto());
    expect(resultado).toEqual({
      ok: false,
      erro: expect.stringContaining("Modo demonstração"),
    });
  });

  it("enviar evidência de CAPA degrada com aviso amigável", async () => {
    const resultado = await enviarEvidenciaCapa(ID_CAPA, null, formularioComFoto());
    expect(resultado).toEqual({
      ok: false,
      erro: expect.stringContaining("Modo demonstração"),
    });
  });

  it("listagens voltam vazias sem quebrar as telas", async () => {
    expect(await listarFotosVisita(ID_VISITA)).toEqual([]);
    expect(await listarEvidenciasCapa(ID_CAPA)).toEqual([]);
  });
});

describe("enviarFotoVisita", () => {
  it("recusa formato que não é foto antes de tocar o storage", async () => {
    const chamadas = usarSupabase({
      visitas: [{ data: { id: ID_VISITA } }],
    });

    const resultado = await enviarFotoVisita(
      ID_VISITA,
      ID_ITEM,
      formularioComFoto("application/pdf", "laudo.pdf"),
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.erro).toMatch(/JPEG, PNG ou WebP/);
    expect(chamadas.some((c) => c.metodo === "upload")).toBe(false);
  });

  it("recusa GPS fora do formato lat,long", async () => {
    usarSupabase({ visitas: [{ data: { id: ID_VISITA } }] });

    const resultado = await enviarFotoVisita(
      ID_VISITA,
      ID_ITEM,
      formularioComFoto(),
      "perto do barracão",
    );

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.erro).toMatch(/Localização inválida/);
  });

  it("sobe no bucket em visitas/<id>/ e registra em visita_fotos com GPS", async () => {
    const chamadas = usarSupabase({
      visitas: [{ data: { id: ID_VISITA } }],
      visita_fotos: [{ data: null, error: null }],
    });

    const resultado = await enviarFotoVisita(
      ID_VISITA,
      ID_ITEM,
      formularioComFoto(),
      "-21.1234,-45.0021",
    );

    expect(resultado).toEqual({ ok: true });

    const upload = chamadas.find((c) => c.metodo === "upload");
    expect(upload?.alvo).toBe("storage:evidencias");
    expect(String(upload?.args[0])).toMatch(
      new RegExp(`^visitas/${ID_VISITA}/\\d+-[a-z0-9]+\\.jpg$`),
    );

    const insercao = chamadas.find(
      (c) => c.alvo === "visita_fotos" && c.metodo === "insert",
    );
    expect(insercao?.args[0]).toMatchObject({
      visita_id: ID_VISITA,
      item_id: ID_ITEM,
      gps: "-21.1234,-45.0021",
    });
  });

  it("remove o arquivo do bucket se o registro no banco falhar", async () => {
    const chamadas = usarSupabase({
      visitas: [{ data: { id: ID_VISITA } }],
      visita_fotos: [{ data: null, error: { message: "RLS negou" } }],
    });

    const resultado = await enviarFotoVisita(ID_VISITA, null, formularioComFoto());

    expect(resultado.ok).toBe(false);
    expect(chamadas.some((c) => c.metodo === "remove")).toBe(true);
  });
});

describe("enviarEvidenciaCapa", () => {
  it("recusa anexo em CAPA já fechada", async () => {
    const chamadas = usarSupabase({
      capas: [{ data: { id: ID_CAPA, status: "fechada" } }],
    });

    const resultado = await enviarEvidenciaCapa(ID_CAPA, null, formularioComFoto());

    expect(resultado).toEqual({
      ok: false,
      erro: expect.stringContaining("fechada"),
    });
    expect(chamadas.some((c) => c.metodo === "upload")).toBe(false);
  });

  it("sobe em capas/<id>/ e registra com ação, descrição e autor", async () => {
    const chamadas = usarSupabase({
      capas: [{ data: { id: ID_CAPA, status: "aberta" } }],
      capa_evidencias: [{ data: null, error: null }],
    });

    const resultado = await enviarEvidenciaCapa(
      ID_CAPA,
      ID_ACAO,
      formularioComFoto("image/webp", "sinalizacao.webp"),
      "Sinalização instalada no depósito",
    );

    expect(resultado).toEqual({ ok: true });

    const upload = chamadas.find((c) => c.metodo === "upload");
    expect(String(upload?.args[0])).toMatch(
      new RegExp(`^capas/${ID_CAPA}/\\d+-[a-z0-9]+\\.webp$`),
    );

    const insercao = chamadas.find(
      (c) => c.alvo === "capa_evidencias" && c.metodo === "insert",
    );
    expect(insercao?.args[0]).toMatchObject({
      capa_id: ID_CAPA,
      acao_id: ID_ACAO,
      descricao: "Sinalização instalada no depósito",
      autor_id: ID_USUARIO,
    });
  });
});

describe("listagens com URL assinada", () => {
  it("listarFotosVisita devolve as fotos com URL assinada do bucket privado", async () => {
    usarSupabase({
      visita_fotos: [
        {
          data: [
            {
              id: "f1",
              item_id: ID_ITEM,
              caminho: `visitas/${ID_VISITA}/1-a.jpg`,
              gps: "-21.1,-45.2",
              tirada_em: "2026-08-22T10:00:00Z",
            },
          ],
        },
      ],
    });

    const fotos = await listarFotosVisita(ID_VISITA);

    expect(fotos).toHaveLength(1);
    expect(fotos[0]).toMatchObject({
      id: "f1",
      itemId: ID_ITEM,
      gps: "-21.1,-45.2",
      url: `https://assinada.exemplo/visitas/${ID_VISITA}/1-a.jpg`,
    });
  });

  it("listarEvidenciasCapa devolve descrição, autor e URL assinada", async () => {
    usarSupabase({
      capa_evidencias: [
        {
          data: [
            {
              id: "e1",
              acao_id: ID_ACAO,
              caminho: `capas/${ID_CAPA}/1-b.png`,
              descricao: "Piso impermeabilizado",
              criado_em: "2026-08-23T09:00:00Z",
              autor: { nome: "João Torres" },
            },
          ],
        },
      ],
    });

    const evidencias = await listarEvidenciasCapa(ID_CAPA);

    expect(evidencias).toHaveLength(1);
    expect(evidencias[0]).toMatchObject({
      id: "e1",
      acaoId: ID_ACAO,
      descricao: "Piso impermeabilizado",
      autorNome: "João Torres",
      url: `https://assinada.exemplo/capas/${ID_CAPA}/1-b.png`,
    });
  });
});
