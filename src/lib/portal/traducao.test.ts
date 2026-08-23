import { describe, expect, it } from "vitest";
import {
  jargaoEncontrado,
  situacaoDaFazenda,
  traduzirJargao,
  urgenciaDaPendencia,
} from "./traducao";

const HOJE = new Date("2026-08-22T12:00:00");

describe("Tradução de jargão", () => {
  it("usa o padrão do projeto: frase humana (termo técnico)", () => {
    expect(traduzirJargao("Instalar sinalização NR-31 no depósito")).toBe(
      "Instalar sinalização regras de segurança do trabalho no campo (NR-31) no depósito",
    );
  });

  it("traduz APP, CAPA e EPI", () => {
    expect(traduzirJargao("área de APP")).toContain("(APP)");
    expect(traduzirJargao("área de APP")).toContain(
      "faixa de mata que protege rios e nascentes",
    );
    expect(traduzirJargao("abrir CAPA")).toContain("plano de correção (CAPA)");
    expect(traduzirJargao("usar EPI")).toContain("(EPI)");
  });

  it("não mexe em palavras que só contêm o termo", () => {
    expect(traduzirJargao("APPARATO e RATO")).toBe("APPARATO e RATO");
    expect(traduzirJargao("CAPACETE novo")).toBe("CAPACETE novo");
  });

  it("traduz só a primeira aparição, para não virar ladainha", () => {
    const texto = traduzirJargao("EPI vencido, comprar EPI novo");
    expect(texto.match(/\(EPI\)/g)).toHaveLength(1);
  });

  it("deixa texto sem jargão exatamente como está", () => {
    const texto = "Consertar o chuveiro do alojamento";
    expect(traduzirJargao(texto)).toBe(texto);
  });

  it("sabe listar os termos técnicos presentes", () => {
    expect(jargaoEncontrado("Sinalização NR-31 e uso de EPI")).toEqual(
      expect.arrayContaining(["NR-31", "EPI"]),
    );
    expect(jargaoEncontrado("Trocar a lâmpada")).toEqual([]);
  });
});

describe("Urgência única da pendência", () => {
  const base = { severidade: "maior", status: "em_correcao" } as const;

  it("mostra UMA etiqueta só, nunca rótulos concorrentes", () => {
    const urgencia = urgenciaDaPendencia(
      { ...base, prazo: "2026-09-15" },
      HOJE,
    );
    expect(typeof urgencia.rotulo).toBe("string");
    // O status vira frase explicativa, não uma segunda etiqueta.
    expect(urgencia.situacao).toBe("Já está sendo corrigido.");
  });

  it("prazo passado manda no recado", () => {
    const urgencia = urgenciaDaPendencia(
      { ...base, prazo: "2026-08-12" },
      HOJE,
    );
    expect(urgencia.nivel).toBe("atrasada");
    expect(urgencia.rotulo).toBe("Atrasada há 10 dias");
  });

  it("crítica é para resolver agora, mesmo com prazo longe", () => {
    const urgencia = urgenciaDaPendencia(
      { severidade: "critica", status: "aberta", prazo: "2026-12-31" },
      HOJE,
    );
    expect(urgencia.nivel).toBe("urgente");
    expect(urgencia.rotulo).toContain("Resolver agora");
  });

  it("prazo perto vira 'resolver logo' com os dias contados", () => {
    const urgencia = urgenciaDaPendencia(
      { ...base, prazo: "2026-08-30" },
      HOJE,
    );
    expect(urgencia.nivel).toBe("esta_semana");
    expect(urgencia.rotulo).toBe("Resolver logo · faltam 8 dias");
  });

  it("prazo longe pode ser planejado", () => {
    const urgencia = urgenciaDaPendencia(
      { ...base, prazo: "2026-11-30" },
      HOJE,
    );
    expect(urgencia.nivel).toBe("planejada");
  });

  it("sempre diz a consequência de não cumprir", () => {
    for (const severidade of ["menor", "maior", "critica"] as const) {
      const urgencia = urgenciaDaPendencia(
        { severidade, status: "aberta", prazo: null },
        HOJE,
      );
      expect(urgencia.consequencia.length).toBeGreaterThan(30);
      expect(urgencia.consequencia).toMatch(/^Se não for resolvido/);
    }
  });

  it("a consequência da crítica fala em perder o certificado", () => {
    const urgencia = urgenciaDaPendencia(
      { severidade: "critica", status: "aberta", prazo: null },
      HOJE,
    );
    expect(urgencia.consequencia).toContain("perder o certificado");
  });

  it("explica que falta a foto quando é isso que trava", () => {
    const urgencia = urgenciaDaPendencia(
      { ...base, status: "aguardando_evidencia", prazo: null },
      HOJE,
    );
    expect(urgencia.situacao).toContain("foto");
  });
});

describe("Faixa de situação: 'está tudo certo?'", () => {
  it("certificado vencido manda no recado, mesmo com 88% de conformidade", () => {
    const situacao = situacaoDaFazenda({
      conformidade: 88,
      certificadoVencido: true,
      diasParaVencer: -8,
      pendenciasAbertas: 1,
    });
    expect(situacao.tom).toBe("problema");
    expect(situacao.titulo).toBe("Não. Seu certificado está vencido.");
  });

  it("traduz a conformidade para linguagem de gente", () => {
    const situacao = situacaoDaFazenda({
      conformidade: 88,
      certificadoVencido: true,
      diasParaVencer: -8,
      pendenciasAbertas: 1,
    });
    expect(situacao.conformidadeEmPalavras).toBe(
      "Sua fazenda cumpre 88 de cada 100 exigências da certificação.",
    );
  });

  it("sem conformidade cadastrada, não inventa número", () => {
    const situacao = situacaoDaFazenda({
      conformidade: null,
      certificadoVencido: false,
      diasParaVencer: 400,
      pendenciasAbertas: 0,
    });
    expect(situacao.conformidadeEmPalavras).toBeNull();
  });

  it("vencimento próximo avisa sem susto", () => {
    const situacao = situacaoDaFazenda({
      conformidade: 90,
      certificadoVencido: false,
      diasParaVencer: 45,
      pendenciasAbertas: 0,
    });
    expect(situacao.tom).toBe("atencao");
    expect(situacao.titulo).toContain("vence em 45 dias");
  });

  it("só pendências abertas: quase lá, com botão para elas", () => {
    const situacao = situacaoDaFazenda({
      conformidade: 92,
      certificadoVencido: false,
      diasParaVencer: 300,
      pendenciasAbertas: 3,
    });
    expect(situacao.tom).toBe("atencao");
    expect(situacao.titulo).toBe("Quase. Você tem 3 coisas para resolver.");
    expect(situacao.acao.href).toBe("/portal/pendencias");
  });

  it("tudo em dia responde 'sim' de forma direta", () => {
    const situacao = situacaoDaFazenda({
      conformidade: 97,
      certificadoVencido: false,
      diasParaVencer: 300,
      pendenciasAbertas: 0,
    });
    expect(situacao.tom).toBe("ok");
    expect(situacao.titulo).toBe("Sim, está tudo certo com a sua fazenda.");
  });

  it("sempre oferece um botão de ação", () => {
    const casos = [
      { certificadoVencido: true, diasParaVencer: -1, pendenciasAbertas: 0 },
      { certificadoVencido: false, diasParaVencer: 10, pendenciasAbertas: 2 },
      { certificadoVencido: false, diasParaVencer: 500, pendenciasAbertas: 0 },
    ];
    for (const caso of casos) {
      const situacao = situacaoDaFazenda({ conformidade: 80, ...caso });
      expect(situacao.acao.rotulo.length).toBeGreaterThan(3);
      expect(situacao.acao.href).toBeTruthy();
    }
  });
});
