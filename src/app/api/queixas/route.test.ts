import { beforeEach, describe, expect, it, vi } from "vitest";
import { normalizarProtocolo } from "@/lib/portal/protocolo";

/**
 * Testes do canal público (RA 1.5.1) rodando SEM Supabase — ou seja, no modo
 * demonstração. É justamente onde estava o buraco: a API respondia
 * "recebemos" para qualquer endereço e o relato sumia.
 */

const clienteDoCanal = vi.hoisted(() => vi.fn());
const consultarPorProtocolo = vi.hoisted(() => vi.fn());
const servicoSupabase = vi.hoisted(() => vi.fn(() => null));

vi.mock("@/lib/portal/canal-queixas", async () => {
  const real = await vi.importActual<
    typeof import("@/lib/portal/canal-queixas")
  >("@/lib/portal/canal-queixas");
  return { ...real, clienteDoCanal, consultarPorProtocolo, servicoSupabase };
});

const { GET, POST, MARCA_TRIAGEM_PRIORITARIA } = await import("./route");

function pedido(corpo: unknown, ip = "10.0.0.1") {
  return new Request("http://localhost/api/queixas", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(corpo),
  });
}

const RELATO = "O chuveiro do alojamento está sem água quente há duas semanas.";

beforeEach(() => {
  vi.clearAllMocks();
  clienteDoCanal.mockResolvedValue({
    id: "alto-da-serra",
    nome: "Fazenda Alto da Serra",
  });
});

describe("POST /api/queixas · endereço do canal", () => {
  it("recusa cliente inexistente mesmo em modo demonstração", async () => {
    clienteDoCanal.mockResolvedValue(null);
    const resposta = await POST(
      pedido({ clienteId: "fazenda-que-nao-existe", mensagem: RELATO }),
    );
    const corpo = await resposta.json();

    expect(resposta.status).toBe(404);
    expect(corpo.ok).toBe(false);
    expect(corpo.erro).toContain("cartaz");
  });

  it("aceita cliente existente e devolve o protocolo", async () => {
    const resposta = await POST(
      pedido({ clienteId: "alto-da-serra", mensagem: RELATO }, "10.0.1.1"),
    );
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo.ok).toBe(true);
    expect(normalizarProtocolo(corpo.protocolo)).not.toBeNull();
    expect(corpo.prazoDias).toBe(10);
  });

  it("continua recusando relato curto demais", async () => {
    const resposta = await POST(
      pedido({ clienteId: "alto-da-serra", mensagem: "oi" }),
    );
    expect(resposta.status).toBe(400);
    expect((await resposta.json()).ok).toBe(false);
  });
});

describe("POST /api/queixas · teto por IP", () => {
  it("aceita mutirão do mesmo Wi-Fi bem acima do teto antigo de 5/h", async () => {
    for (let i = 0; i < 10; i += 1) {
      const resposta = await POST(
        pedido({ clienteId: "alto-da-serra", mensagem: RELATO }, "10.9.9.9"),
      );
      const corpo = await resposta.json();
      expect(resposta.status).toBe(200);
      expect(corpo.ok).toBe(true);
      expect(corpo.prioritaria).toBe(false);
    }
  });

  it("passando de 30/h grava assim mesmo, marcando triagem prioritária", async () => {
    const ip = "10.7.7.7";
    for (let i = 0; i < 30; i += 1) {
      await POST(pedido({ clienteId: "alto-da-serra", mensagem: RELATO }, ip));
    }
    const resposta = await POST(
      pedido({ clienteId: "alto-da-serra", mensagem: RELATO }, ip),
    );
    const corpo = await resposta.json();

    // Nunca 429: relato de trabalhador não é rejeitado.
    expect(resposta.status).toBe(200);
    expect(corpo.ok).toBe(true);
    expect(corpo.prioritaria).toBe(true);
    expect(normalizarProtocolo(corpo.protocolo)).not.toBeNull();
  });

  it("a mensagem de sucesso não acusa quem enviou de abuso", async () => {
    const ip = "10.6.6.6";
    for (let i = 0; i < 31; i += 1) {
      await POST(pedido({ clienteId: "alto-da-serra", mensagem: RELATO }, ip));
    }
    const corpo = await (
      await POST(pedido({ clienteId: "alto-da-serra", mensagem: RELATO }, ip))
    ).json();

    expect(corpo.mensagem).toContain("Obrigado pela confiança");
    expect(corpo.mensagem).not.toMatch(/muitos envios|abuso|aguarde|spam/i);
  });

  it("a marca de triagem é para a equipe, não uma acusação", () => {
    expect(MARCA_TRIAGEM_PRIORITARIA).toContain("TRIAGEM PRIORITÁRIA");
    expect(MARCA_TRIAGEM_PRIORITARIA).toContain("problema coletivo");
  });
});

describe("GET /api/queixas · consulta anônima por protocolo", () => {
  it("explica o formato quando o código está malformado", async () => {
    const resposta = await GET(
      new Request("http://localhost/api/queixas?protocolo=ABC"),
    );
    expect(resposta.status).toBe(400);
    expect((await resposta.json()).erro).toContain("8 letras");
  });

  it("devolve a situação do relato quando o código confere", async () => {
    consultarPorProtocolo.mockResolvedValue({
      protocolo: "K7QM3XZ2",
      situacao: "em_analise",
      rotulo: "Em apuração",
      explicacao: "A equipe de certificação está apurando.",
      recebidoEm: "2026-08-10T10:00:00Z",
    });
    const resposta = await GET(
      new Request("http://localhost/api/queixas?protocolo=k7qm-3xz2"),
    );
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo.consulta.rotulo).toBe("Em apuração");
    // A consulta nunca devolve o texto do relato nem o contato: se o papel
    // com o código cair na mão do patrão, ele não lê o que foi dito.
    expect(corpo.consulta.mensagem).toBeUndefined();
    expect(corpo.consulta.contato).toBeUndefined();
  });

  it("avisa com calma quando não acha o código", async () => {
    consultarPorProtocolo.mockResolvedValue(null);
    const resposta = await GET(
      new Request("http://localhost/api/queixas?protocolo=K7QM3XZ2"),
    );
    expect(resposta.status).toBe(404);
    expect((await resposta.json()).erro).toContain("Confira as letras");
  });
});
