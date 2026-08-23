import { describe, expect, it } from "vitest";
import {
  criarLimitadorTaxa,
  esquemaAtualizarStatusCaso,
  esquemaPlanoGestao,
  esquemaQueixaPublica,
  podeTratarQueixa,
  primeiraMensagem,
} from "./validacao";

const CASO_ID = "11111111-0000-4000-8000-000000000001";
const CLIENTE_ID = "22222222-0000-4000-8000-000000000001";

describe("encerramento de caso (cap. 5.1)", () => {
  it("recusa encerrar sem a remediação registrada", () => {
    const resultado = esquemaAtualizarStatusCaso.safeParse({
      id: CASO_ID,
      status: "encerrado",
    });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(primeiraMensagem(resultado.error)).toMatch(/remediação/);
    }
  });

  it("aceita encerrar com a remediação descrita", () => {
    const resultado = esquemaAtualizarStatusCaso.safeParse({
      id: CASO_ID,
      status: "encerrado",
      remediacao: "Escala refeita e acompanhamento quinzenal do ponto.",
    });
    expect(resultado.success).toBe(true);
  });

  it("permite mover para em remediação sem remediação preenchida", () => {
    const resultado = esquemaAtualizarStatusCaso.safeParse({
      id: CASO_ID,
      status: "em_remediacao",
    });
    expect(resultado.success).toBe(true);
  });
});

describe("tratamento de queixa (canal 1.5.1)", () => {
  it("recusa tratar queixa com caso vinculado ainda aberto", () => {
    const regra = podeTratarQueixa({ statusCasoVinculado: "aberto" });
    expect(regra.ok).toBe(false);
    if (!regra.ok) expect(regra.erro).toMatch(/encerrado/);
  });

  it("recusa tratar queixa sem caso e sem justificativa", () => {
    const regra = podeTratarQueixa({});
    expect(regra.ok).toBe(false);
    if (!regra.ok) expect(regra.erro).toMatch(/justificativa/);
  });

  it("aceita tratar quando o caso vinculado foi encerrado", () => {
    expect(podeTratarQueixa({ statusCasoVinculado: "encerrado" }).ok).toBe(
      true,
    );
  });

  it("aceita tratar sem caso quando há justificativa", () => {
    expect(
      podeTratarQueixa({ justificativa: "Chuveiro consertado em 20/08." }).ok,
    ).toBe(true);
  });

  it("queixa pública nasce anônima por padrão e exige mensagem", () => {
    const semMensagem = esquemaQueixaPublica.safeParse({
      clienteId: CLIENTE_ID,
      mensagem: "curta",
    });
    expect(semMensagem.success).toBe(false);

    const valida = esquemaQueixaPublica.safeParse({
      clienteId: CLIENTE_ID,
      mensagem: "O alojamento está sem água quente há duas semanas.",
    });
    expect(valida.success).toBe(true);
    if (valida.success) expect(valida.data.anonima).toBe(true);
  });
});

describe("plano de gestão (cap. 1.3)", () => {
  it("aceita plano com riscos e metas válidos", () => {
    const resultado = esquemaPlanoGestao.safeParse({
      clienteId: CLIENTE_ID,
      ano: "2026",
      riscos: [
        {
          area: "Social",
          risco: "Jornada excessiva na colheita.",
          probabilidade: "medio",
          impacto: "alto",
          mitigacao: "Escala com folga semanal.",
        },
      ],
      metas: [
        {
          meta: "Divulgar o canal de queixas.",
          prazo: "2026-09-30",
          responsavel: "Ana",
          concluida: false,
        },
      ],
    });
    expect(resultado.success).toBe(true);
    if (resultado.success) expect(resultado.data.ano).toBe(2026);
  });

  it("recusa risco sem mitigação ou com nível inválido", () => {
    const semMitigacao = esquemaPlanoGestao.safeParse({
      clienteId: CLIENTE_ID,
      ano: 2026,
      riscos: [
        {
          area: "Social",
          risco: "Jornada excessiva.",
          probabilidade: "medio",
          impacto: "alto",
          mitigacao: "",
        },
      ],
      metas: [],
    });
    expect(semMitigacao.success).toBe(false);

    const nivelInvalido = esquemaPlanoGestao.safeParse({
      clienteId: CLIENTE_ID,
      ano: 2026,
      riscos: [
        {
          area: "Social",
          risco: "Jornada excessiva.",
          probabilidade: "altíssimo",
          impacto: "alto",
          mitigacao: "Escala revista.",
        },
      ],
      metas: [],
    });
    expect(nivelInvalido.success).toBe(false);
  });
});

describe("limitador de taxa do canal público", () => {
  it("permite até o máximo na janela e bloqueia o excedente", () => {
    const limitador = criarLimitadorTaxa(5, 60 * 60 * 1000);
    const agora = 1_000_000;
    for (let i = 0; i < 5; i += 1) {
      expect(limitador.permitir("ip-1", agora + i)).toBe(true);
    }
    expect(limitador.permitir("ip-1", agora + 10)).toBe(false);
  });

  it("conta cada IP separadamente", () => {
    const limitador = criarLimitadorTaxa(1, 1000);
    expect(limitador.permitir("ip-1", 0)).toBe(true);
    expect(limitador.permitir("ip-2", 0)).toBe(true);
    expect(limitador.permitir("ip-1", 1)).toBe(false);
  });

  it("libera de novo depois que a janela passa", () => {
    const limitador = criarLimitadorTaxa(2, 1000);
    expect(limitador.permitir("ip-1", 0)).toBe(true);
    expect(limitador.permitir("ip-1", 1)).toBe(true);
    expect(limitador.permitir("ip-1", 2)).toBe(false);
    expect(limitador.permitir("ip-1", 1500)).toBe(true);
  });
});
