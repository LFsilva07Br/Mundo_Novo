import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { atualizarPerfil, convidarUsuario, reenviarConvite } from "./acoes";
import { createClient } from "@/lib/supabase/server";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ origin: "https://exemplo.dev" })),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => null),
}));

const criarClienteMock = vi.mocked(createClient);

/** Monta um cliente Supabase falso com papel/alçada do solicitante logado. */
function clienteFalso({
  papel,
  ativo = true,
  logado = true,
  erroUpdate = null,
}: {
  papel: string;
  ativo?: boolean;
  logado?: boolean;
  erroUpdate?: { message: string } | null;
}) {
  const update = vi.fn(() => ({
    eq: vi.fn(async () => ({ error: erroUpdate })),
  }));
  const cliente = {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: logado ? { id: "11111111-1111-4111-8111-111111111111" } : null },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({
            data: logado ? { papel, ativo } : null,
            error: null,
          })),
        })),
      })),
      update,
    })),
    __update: update,
  };
  return cliente;
}

const CONVITE = {
  nome: "Maria da Silva",
  email: "maria@mundonovo.agr.br",
  papel: "consultor" as const,
  alcadaAprovacao: false,
};

const ID_VALIDO = "6f9619ff-8b86-4d01-b42d-00cf4fc964ff";

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

describe("convidarUsuario", () => {
  it("recusa dados inválidos antes de tocar no banco", async () => {
    const resultado = await convidarUsuario({
      ...CONVITE,
      email: "invalido",
    });
    expect(resultado).toEqual({ ok: false, erro: "Informe um e-mail válido." });
    expect(criarClienteMock).not.toHaveBeenCalled();
  });

  it("avisa quando o banco ainda não foi conectado (modo demonstração)", async () => {
    const resultado = await convidarUsuario(CONVITE);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.erro).toMatch(/demonstração/i);
  });

  it("recusa solicitante sem papel de gestão (consultor)", async () => {
    const fetchEspiao = vi.fn();
    vi.stubGlobal("fetch", fetchEspiao);
    criarClienteMock.mockResolvedValue(
      clienteFalso({ papel: "consultor" }) as never,
    );

    const resultado = await convidarUsuario(CONVITE);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.erro).toMatch(/permissão/i);
    expect(fetchEspiao).not.toHaveBeenCalled();
  });

  it("recusa gestor desativado", async () => {
    criarClienteMock.mockResolvedValue(
      clienteFalso({ papel: "gestor", ativo: false }) as never,
    );
    const resultado = await convidarUsuario(CONVITE);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.erro).toMatch(/permissão/i);
  });

  it("sem a service key, explica que o convite fica para o ambiente publicado", async () => {
    criarClienteMock.mockResolvedValue(
      clienteFalso({ papel: "gestor" }) as never,
    );
    const resultado = await convidarUsuario(CONVITE);
    expect(resultado).toEqual({
      ok: false,
      erro: "O convite por e-mail estará disponível no ambiente publicado.",
    });
  });

  it("gestor com service key convida via Admin API e ajusta papel/alçada", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "chave-servico";
    const cliente = clienteFalso({ papel: "diretoria" });
    criarClienteMock.mockResolvedValue(cliente as never);

    const fetchFalso = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: ID_VALIDO }),
    }));
    vi.stubGlobal("fetch", fetchFalso);

    const resultado = await convidarUsuario({
      ...CONVITE,
      papel: "gestor",
      alcadaAprovacao: true,
    });

    expect(resultado).toEqual({
      ok: true,
      mensagem: "Convite enviado para maria@mundonovo.agr.br.",
    });

    const [url, opcoes] = fetchFalso.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://projeto.supabase.co/auth/v1/invite");
    expect(opcoes.headers).toMatchObject({
      apikey: "chave-servico",
      Authorization: "Bearer chave-servico",
    });
    expect(JSON.parse(String(opcoes.body))).toEqual({
      email: "maria@mundonovo.agr.br",
      data: { nome: "Maria da Silva" },
      redirect_to: "https://exemplo.dev/definir-senha",
    });

    expect(cliente.__update).toHaveBeenCalledWith({
      papel: "gestor",
      alcada_aprovacao: true,
    });
  });

  it("traduz o erro de e-mail já cadastrado", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "chave-servico";
    criarClienteMock.mockResolvedValue(
      clienteFalso({ papel: "gestor" }) as never,
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        json: async () => ({
          msg: "A user with this email address has already been registered",
        }),
      })),
    );

    const resultado = await convidarUsuario(CONVITE);
    expect(resultado).toEqual({
      ok: false,
      erro: "Este e-mail já possui cadastro no sistema.",
    });
  });
});

describe("atualizarPerfil", () => {
  it("recusa identificador que não é uuid", async () => {
    const resultado = await atualizarPerfil("tamara", { ativo: false });
    expect(resultado).toEqual({
      ok: false,
      erro: "Identificador de usuário inválido.",
    });
  });

  it("recusa atualização sem nenhum campo", async () => {
    const resultado = await atualizarPerfil(ID_VALIDO, {});
    expect(resultado).toEqual({
      ok: false,
      erro: "Nenhuma alteração foi informada.",
    });
  });

  it("recusa solicitante sem papel de gestão", async () => {
    criarClienteMock.mockResolvedValue(
      clienteFalso({ papel: "comercial" }) as never,
    );
    const resultado = await atualizarPerfil(ID_VALIDO, { ativo: false });
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.erro).toMatch(/permissão/i);
  });

  it("gestor atualiza papel, alçada e status com nomes de coluna do banco", async () => {
    const cliente = clienteFalso({ papel: "gestor" });
    criarClienteMock.mockResolvedValue(cliente as never);

    const resultado = await atualizarPerfil(ID_VALIDO, {
      papel: "auditor",
      alcadaAprovacao: true,
      ativo: false,
    });

    expect(resultado).toEqual({ ok: true, mensagem: "Perfil atualizado." });
    expect(cliente.__update).toHaveBeenCalledWith({
      papel: "auditor",
      alcada_aprovacao: true,
      ativo: false,
    });
  });
});

describe("reenviarConvite", () => {
  it("valida o e-mail antes de qualquer coisa", async () => {
    const resultado = await reenviarConvite("sem-arroba");
    expect(resultado).toEqual({ ok: false, erro: "Informe um e-mail válido." });
  });

  it("recusa solicitante sem permissão", async () => {
    criarClienteMock.mockResolvedValue(
      clienteFalso({ papel: "consultor" }) as never,
    );
    const resultado = await reenviarConvite("maria@mundonovo.agr.br");
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.erro).toMatch(/permissão/i);
  });

  it("reenvia o convite pela Admin API quando tudo está em ordem", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "chave-servico";
    criarClienteMock.mockResolvedValue(
      clienteFalso({ papel: "gestor" }) as never,
    );
    const fetchFalso = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: ID_VALIDO }),
    }));
    vi.stubGlobal("fetch", fetchFalso);

    const resultado = await reenviarConvite("maria@mundonovo.agr.br");
    expect(resultado).toEqual({
      ok: true,
      mensagem: "Convite reenviado para maria@mundonovo.agr.br.",
    });
    expect(fetchFalso).toHaveBeenCalledOnce();
  });
});
