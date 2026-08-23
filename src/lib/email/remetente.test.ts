import { describe, expect, it, vi } from "vitest";
import {
  emailConfigurado,
  enviarEmail,
  montarOpcoesTransporte,
  remetentePadrao,
  type ClienteEnvios,
  type OpcoesTransporte,
} from "./remetente";

const ENV_COMPLETO = {
  SMTP_HOST: "smtp.gmail.com",
  SMTP_USER: "alertas@mundonovo.agr.br",
  SMTP_PASS: "abcd efgh ijkl mnop",
};

type Atualizacao = { id: string; valores: Record<string, unknown> };

/** Banco falso que grava inserts e updates em memória para inspeção. */
function criarBancoFalso(opcoes: { falharInsert?: boolean } = {}) {
  const inseridos: Record<string, unknown>[] = [];
  const atualizacoes: Atualizacao[] = [];
  const banco: ClienteEnvios = {
    from() {
      return {
        insert(valores: Record<string, unknown>) {
          return {
            select() {
              return {
                single: async () => {
                  if (opcoes.falharInsert) throw new Error("banco fora do ar");
                  inseridos.push(valores);
                  return { data: { id: `reg-${inseridos.length}` }, error: null };
                },
              };
            },
          };
        },
        update(valores: Record<string, unknown>) {
          return {
            eq: async (_coluna: string, id: string) => {
              atualizacoes.push({ id, valores });
              return { error: null };
            },
          };
        },
      };
    },
  };
  return { banco, inseridos, atualizacoes };
}

describe("montarOpcoesTransporte", () => {
  it("monta as opções com porta padrão 587 (sem TLS implícito)", () => {
    const opcoes = montarOpcoesTransporte(ENV_COMPLETO);
    expect(opcoes).toEqual({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: "alertas@mundonovo.agr.br", pass: "abcd efgh ijkl mnop" },
    });
  });

  it("liga secure quando a porta é 465", () => {
    const opcoes = montarOpcoesTransporte({ ...ENV_COMPLETO, SMTP_PORT: "465" });
    expect(opcoes?.port).toBe(465);
    expect(opcoes?.secure).toBe(true);
  });

  it("ignora porta inválida e volta ao padrão 587", () => {
    const opcoes = montarOpcoesTransporte({ ...ENV_COMPLETO, SMTP_PORT: "abc" });
    expect(opcoes?.port).toBe(587);
  });

  it("devolve null quando falta host, usuário ou senha", () => {
    expect(montarOpcoesTransporte({})).toBeNull();
    expect(montarOpcoesTransporte({ ...ENV_COMPLETO, SMTP_HOST: "" })).toBeNull();
    expect(
      montarOpcoesTransporte({ ...ENV_COMPLETO, SMTP_PASS: undefined }),
    ).toBeNull();
  });
});

describe("remetentePadrao e emailConfigurado", () => {
  it("usa SMTP_FROM quando presente, senão o SMTP_USER", () => {
    expect(
      remetentePadrao({ ...ENV_COMPLETO, SMTP_FROM: "Mundo Novo <a@b.c>" }),
    ).toBe("Mundo Novo <a@b.c>");
    expect(remetentePadrao(ENV_COMPLETO)).toBe("alertas@mundonovo.agr.br");
  });

  it("emailConfigurado reflete a presença das variáveis obrigatórias", () => {
    expect(emailConfigurado(ENV_COMPLETO)).toBe(true);
    expect(emailConfigurado({})).toBe(false);
  });
});

describe("enviarEmail", () => {
  const mensagem = {
    para: "produtor@fazenda.com",
    assunto: "Certificado vence em 30 dias",
    html: "<p>detalhe</p>",
    origem: "gatilho",
  };

  it("sem SMTP configurado: registra como pendente com o motivo e não lança", async () => {
    const { banco, inseridos, atualizacoes } = criarBancoFalso();
    const transportar = vi.fn();

    const resultado = await enviarEmail(mensagem, banco, {
      env: {},
      transportar,
    });

    expect(resultado).toEqual({
      enviado: false,
      status: "pendente",
      erro: "SMTP não configurado",
    });
    expect(transportar).not.toHaveBeenCalled();
    expect(inseridos[0]).toMatchObject({
      destinatario: "produtor@fazenda.com",
      assunto: "Certificado vence em 30 dias",
      corpo_html: "<p>detalhe</p>",
      origem: "gatilho",
      status: "pendente",
    });
    expect(atualizacoes[0].valores).toEqual({ erro: "SMTP não configurado" });
  });

  it("com SMTP: envia e marca o registro como enviado", async () => {
    const { banco, atualizacoes } = criarBancoFalso();
    const transportar = vi.fn<
      (
        opcoes: OpcoesTransporte,
        msg: { from: string; to: string; subject: string; html: string },
      ) => Promise<void>
    >(async () => {});

    const resultado = await enviarEmail(mensagem, banco, {
      env: { ...ENV_COMPLETO, SMTP_FROM: "Mundo Novo <alertas@mn.br>" },
      transportar,
    });

    expect(resultado).toEqual({ enviado: true, status: "enviado" });
    expect(transportar).toHaveBeenCalledWith(
      expect.objectContaining({ host: "smtp.gmail.com", port: 587 }),
      {
        from: "Mundo Novo <alertas@mn.br>",
        to: "produtor@fazenda.com",
        subject: "Certificado vence em 30 dias",
        html: "<p>detalhe</p>",
      },
    );
    expect(atualizacoes[0].valores).toMatchObject({
      status: "enviado",
      erro: null,
    });
    expect(atualizacoes[0].valores.enviado_em).toBeTruthy();
  });

  it("falha do SMTP: marca como falha com o erro e não lança", async () => {
    const { banco, atualizacoes } = criarBancoFalso();
    const transportar = vi.fn(async () => {
      throw new Error("credenciais recusadas");
    });

    const resultado = await enviarEmail(mensagem, banco, {
      env: ENV_COMPLETO,
      transportar,
    });

    expect(resultado).toEqual({
      enviado: false,
      status: "falha",
      erro: "credenciais recusadas",
    });
    expect(atualizacoes[0].valores).toEqual({
      status: "falha",
      erro: "credenciais recusadas",
    });
  });

  it("banco indisponível para o registro: ainda tenta enviar sem lançar", async () => {
    const { banco, atualizacoes } = criarBancoFalso({ falharInsert: true });
    const transportar = vi.fn(async () => {});

    const resultado = await enviarEmail(mensagem, banco, {
      env: ENV_COMPLETO,
      transportar,
    });

    expect(resultado).toEqual({ enviado: true, status: "enviado" });
    expect(transportar).toHaveBeenCalledOnce();
    expect(atualizacoes).toHaveLength(0);
  });
});
