import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { convidarProdutor, enviarEvidenciaProdutor } from "./acoes";
import { createClient } from "@/lib/supabase/server";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ origin: "https://exemplo.dev" })),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => null),
}));

const criarClienteMock = vi.mocked(createClient);

const CAPA_ID = "6f9619ff-8b86-4d01-b42d-00cf4fc964ff";
const CONVITE = {
  clienteId: "22222222-0000-4000-8000-000000000001",
  nome: "Silvio Dutra",
  email: "silvio@exemplo.com.br",
};

/** Cliente falso para o convite: perfil do solicitante (papel/ativo). */
function clienteGestao({ papel, ativo = true }: { papel: string; ativo?: boolean }) {
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: "11111111-1111-4111-8111-111111111111" } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({
            data: { papel, ativo },
            error: null,
          })),
        })),
      })),
    })),
  };
}

/** Cliente falso para a evidência: capa visível + insert em capa_evidencias. */
function clienteProdutor({
  capa = { id: CAPA_ID, status: "em_correcao" },
  erroInsert = null,
}: {
  capa?: { id: string; status: string } | null;
  erroInsert?: { message: string } | null;
} = {}) {
  const insert = vi.fn(async () => ({ error: erroInsert }));
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: "33333333-3333-4333-8333-333333333333" } },
      })),
    },
    from: vi.fn((tabela: string) => {
      if (tabela === "capa_evidencias") return { insert };
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: capa, error: null })),
          })),
        })),
      };
    }),
    __insert: insert,
  };
}

function fotoValida(): FormData {
  const formData = new FormData();
  formData.append(
    "arquivo",
    new File([new Uint8Array(1024)], "foto.jpg", { type: "image/jpeg" }),
  );
  return formData;
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://projeto.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  criarClienteMock.mockResolvedValue(null);
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("convidarProdutor", () => {
  it("recusa e-mail inválido antes de tocar no banco", async () => {
    const resultado = await convidarProdutor({ ...CONVITE, email: "errado" });
    expect(resultado).toEqual({ ok: false, erro: "Informe um e-mail válido." });
    expect(criarClienteMock).not.toHaveBeenCalled();
  });

  it("avisa quando o banco ainda não foi conectado (modo demonstração)", async () => {
    const resultado = await convidarProdutor(CONVITE);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.erro).toMatch(/demonstração/i);
  });

  it("recusa solicitante que não é gestor nem diretoria", async () => {
    const fetchEspiao = vi.fn();
    vi.stubGlobal("fetch", fetchEspiao);
    criarClienteMock.mockResolvedValue(
      clienteGestao({ papel: "consultor" }) as never,
    );

    const resultado = await convidarProdutor(CONVITE);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.erro).toMatch(/permissão/i);
    expect(fetchEspiao).not.toHaveBeenCalled();
  });

  it("recusa gestor desativado", async () => {
    criarClienteMock.mockResolvedValue(
      clienteGestao({ papel: "gestor", ativo: false }) as never,
    );
    const resultado = await convidarProdutor(CONVITE);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.erro).toMatch(/permissão/i);
  });

  it("sem a service key, explica que o convite fica para o ambiente publicado", async () => {
    criarClienteMock.mockResolvedValue(
      clienteGestao({ papel: "gestor" }) as never,
    );
    const resultado = await convidarProdutor(CONVITE);
    expect(resultado).toEqual({
      ok: false,
      erro: "O convite por e-mail estará disponível no ambiente publicado.",
    });
  });

  it("convida, vincula o perfil ao cliente e marca o papel consultor", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "chave-servico";
    criarClienteMock.mockResolvedValue(
      clienteGestao({ papel: "diretoria" }) as never,
    );

    const fetchFalso = vi.fn<
      (url: string, init?: RequestInit) => Promise<Response>
    >(async (url) => {
      const endereco = String(url);
      if (endereco.includes("/auth/v1/invite")) {
        return new Response(JSON.stringify({ id: "perfil-novo" }), {
          status: 200,
        });
      }
      return new Response(null, { status: 204 });
    });
    vi.stubGlobal("fetch", fetchFalso);

    const resultado = await convidarProdutor(CONVITE);

    expect(resultado).toEqual({
      ok: true,
      mensagem: `Convite do portal enviado para ${CONVITE.email}.`,
    });

    // 1ª chamada: convite com redirect para /definir-senha.
    const [urlConvite, opcoesConvite] = fetchFalso.mock.calls[0];
    expect(urlConvite).toBe("https://projeto.supabase.co/auth/v1/invite");
    expect(String(opcoesConvite?.body)).toContain(
      "https://exemplo.dev/definir-senha",
    );

    // 2ª chamada: PATCH no perfil com cliente_id + papel consultor.
    const [urlVinculo, opcoesVinculo] = fetchFalso.mock.calls[1];
    expect(urlVinculo).toBe(
      "https://projeto.supabase.co/rest/v1/perfis?id=eq.perfil-novo",
    );
    expect(opcoesVinculo?.method).toBe("PATCH");
    const corpo = JSON.parse(String(opcoesVinculo?.body));
    expect(corpo).toEqual({
      cliente_id: CONVITE.clienteId,
      papel: "consultor",
    });
  });

  it("explica quando o e-mail já tem cadastro", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "chave-servico";
    criarClienteMock.mockResolvedValue(
      clienteGestao({ papel: "gestor" }) as never,
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ msg: "User already registered" }), {
            status: 422,
          }),
      ),
    );

    const resultado = await convidarProdutor(CONVITE);
    expect(resultado).toEqual({
      ok: false,
      erro: "Este e-mail já possui cadastro no sistema.",
    });
  });
});

describe("enviarEvidenciaProdutor", () => {
  it("em modo demonstração avisa que o envio fica para o ambiente publicado", async () => {
    const resultado = await enviarEvidenciaProdutor(CAPA_ID, null, fotoValida());
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.erro).toMatch(/ambiente publicado/i);
  });

  it("recusa pendência que não é uuid", async () => {
    criarClienteMock.mockResolvedValue(clienteProdutor() as never);
    const resultado = await enviarEvidenciaProdutor("131", null, fotoValida());
    expect(resultado).toEqual({ ok: false, erro: "Pendência inválida." });
  });

  it("exige a foto no envio", async () => {
    criarClienteMock.mockResolvedValue(clienteProdutor() as never);
    const resultado = await enviarEvidenciaProdutor(
      CAPA_ID,
      null,
      new FormData(),
    );
    expect(resultado).toEqual({
      ok: false,
      erro: "Escolha uma foto para enviar.",
    });
  });

  it("não aceita foto em pendência que o produtor não enxerga (RLS)", async () => {
    criarClienteMock.mockResolvedValue(
      clienteProdutor({ capa: null }) as never,
    );
    const resultado = await enviarEvidenciaProdutor(CAPA_ID, null, fotoValida());
    expect(resultado).toEqual({ ok: false, erro: "Pendência não encontrada." });
  });

  it("não aceita foto em pendência já resolvida", async () => {
    criarClienteMock.mockResolvedValue(
      clienteProdutor({ capa: { id: CAPA_ID, status: "fechada" } }) as never,
    );
    const resultado = await enviarEvidenciaProdutor(CAPA_ID, null, fotoValida());
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.erro).toMatch(/já foi resolvida/i);
  });

  it("sobe a foto pelo servidor e registra a evidência com o client do produtor", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "chave-servico";
    const cliente = clienteProdutor();
    criarClienteMock.mockResolvedValue(cliente as never);

    const fetchFalso = vi.fn<
      (url: string, init?: RequestInit) => Promise<Response>
    >(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchFalso);

    const resultado = await enviarEvidenciaProdutor(
      CAPA_ID,
      null,
      fotoValida(),
      "Placa instalada",
    );

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.mensagem).toMatch(/verificação/i);

    const [urlUpload, opcoesUpload] = fetchFalso.mock.calls[0];
    expect(urlUpload).toContain(
      `https://projeto.supabase.co/storage/v1/object/evidencias/capas/${CAPA_ID}/`,
    );
    expect(opcoesUpload?.method).toBe("POST");

    expect(cliente.__insert).toHaveBeenCalledWith(
      expect.objectContaining({
        capa_id: CAPA_ID,
        acao_id: null,
        descricao: "Placa instalada",
        autor_id: "33333333-3333-4333-8333-333333333333",
      }),
    );
  });

  it("remove o arquivo do bucket se o registro falhar", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "chave-servico";
    const cliente = clienteProdutor({ erroInsert: { message: "RLS" } });
    criarClienteMock.mockResolvedValue(cliente as never);

    const fetchFalso = vi.fn<
      (url: string, init?: RequestInit) => Promise<Response>
    >(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchFalso);

    const resultado = await enviarEvidenciaProdutor(CAPA_ID, null, fotoValida());

    expect(resultado.ok).toBe(false);
    const metodos = fetchFalso.mock.calls.map((chamada) => chamada[1]?.method);
    expect(metodos).toEqual(["POST", "DELETE"]);
  });
});
