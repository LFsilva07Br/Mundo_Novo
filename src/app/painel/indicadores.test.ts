import { describe, expect, it } from "vitest";
import { resumoCarteira, resumoNormas, resumoVencimentos } from "./indicadores";

const HOJE = new Date("2026-08-22T12:00:00");

describe("resumoVencimentos", () => {
  it("nunca conta um certificado vencido como 'a vencer'", () => {
    const resumo = resumoVencimentos(
      [
        { venceEm: "2026-01-10" }, // vencido
        { venceEm: "2026-07-01" }, // vencido
        { venceEm: "2026-09-10" }, // 19 dias
        { venceEm: "2026-11-10" }, // 80 dias
        { venceEm: "2027-06-01" }, // longe
      ],
      HOJE,
    );

    expect(resumo.vencidas).toBe(2);
    expect(resumo.vencendo90).toBe(2);
    expect(resumo.exigemAcao).toBe(4);
  });

  it("conta o vencimento de hoje como a vencer, não como vencido", () => {
    const resumo = resumoVencimentos([{ venceEm: "2026-08-22" }], HOJE);
    expect(resumo.vencidas).toBe(0);
    expect(resumo.vencendo90).toBe(1);
  });

  it("trata a fronteira dos 90 dias", () => {
    const resumo = resumoVencimentos(
      [{ venceEm: "2026-11-20" }, { venceEm: "2026-11-21" }],
      HOJE,
    );
    expect(resumo.vencendo90).toBe(1);
  });

  it("ignora certificado sem data de vencimento", () => {
    const resumo = resumoVencimentos([{ venceEm: undefined }], HOJE);
    expect(resumo).toEqual({ vencidas: 0, vencendo90: 0, exigemAcao: 0 });
  });
});

describe("resumoCarteira", () => {
  it("conta grupos distintos e clientes sem grupo", () => {
    const resumo = resumoCarteira([
      { grupoId: "a" },
      { grupoId: "a" },
      { grupoId: "b" },
      { grupoId: "c" },
      { grupoId: null },
    ]);

    expect(resumo.clientes).toBe(5);
    expect(resumo.grupos).toBe(3);
    expect(resumo.diretos).toBe(1);
    expect(resumo.detalhe).toBe("3 grupos + 1 cliente direto");
  });

  it("põe o plural certo em cliente direto", () => {
    expect(
      resumoCarteira([{ grupoId: "a" }, { grupoId: null }, { grupoId: null }])
        .detalhe,
    ).toBe("1 grupo + 2 clientes diretos");
  });

  it("omite o trecho de clientes diretos quando não há nenhum", () => {
    expect(resumoCarteira([{ grupoId: "a" }, { grupoId: "b" }]).detalhe).toBe(
      "2 grupos",
    );
  });
});

describe("resumoNormas", () => {
  const rotulos = { ra: "RA", quatro_c: "4C", organico: "Orgânico" };

  it("lista as normas presentes, sem repetir", () => {
    expect(
      resumoNormas(
        [{ norma: "ra" }, { norma: "ra" }, { norma: "quatro_c" }],
        rotulos,
      ),
    ).toBe("RA · 4C");
  });

  it("avisa quando a carteira não tem certificação", () => {
    expect(resumoNormas([], rotulos)).toBe("nenhuma certificação cadastrada");
  });
});
