import { describe, expect, it } from "vitest";
import {
  esquemaAtualizarImovel,
  esquemaCaptacao,
  esquemaDocumentoImovel,
  esquemaImovel,
  esquemaLancamentoSafra,
  esquemaTalhao,
} from "./imoveis-esquemas";

const imovelValido = {
  clienteId: "cliente-1",
  nome: "Sítio Alto da Serra (Garagem)",
  proprietarios: "Silvio Dutra",
  cidade: "São Sebastião do Paraíso",
  uf: "mg",
  car: "MG-3164704-6E05",
  matriculas: "37.624 / 40.734",
  areaTotalHa: "24,5757",
  areaCafeHa: "13,47",
  areaAppHa: "",
  areaReservaHa: "6,7477",
  possuiCaptacaoAgua: "on",
};

describe("esquemaImovel", () => {
  it("aceita a ficha completa e converte áreas com vírgula decimal", () => {
    const resultado = esquemaImovel.safeParse(imovelValido);
    expect(resultado.success).toBe(true);
    if (!resultado.success) return;
    expect(resultado.data.areaTotalHa).toBeCloseTo(24.5757, 4);
    expect(resultado.data.areaCafeHa).toBeCloseTo(13.47, 2);
    expect(resultado.data.areaAppHa).toBeUndefined();
    expect(resultado.data.uf).toBe("MG");
    expect(resultado.data.possuiCaptacaoAgua).toBe(true);
  });

  it("aceita milhar com ponto e decimal com vírgula (1.234,56)", () => {
    const resultado = esquemaImovel.safeParse({
      ...imovelValido,
      areaTotalHa: "1.234,56",
    });
    expect(resultado.success).toBe(true);
    if (!resultado.success) return;
    expect(resultado.data.areaTotalHa).toBeCloseTo(1234.56, 2);
  });

  it("recusa imóvel sem nome", () => {
    const resultado = esquemaImovel.safeParse({ ...imovelValido, nome: " " });
    expect(resultado.success).toBe(false);
  });

  it("recusa área total zerada ou não numérica", () => {
    expect(
      esquemaImovel.safeParse({ ...imovelValido, areaTotalHa: "0" }).success,
    ).toBe(false);
    expect(
      esquemaImovel.safeParse({ ...imovelValido, areaTotalHa: "abc" }).success,
    ).toBe(false);
  });

  it("recusa UF com tamanho diferente de 2 letras", () => {
    const resultado = esquemaImovel.safeParse({ ...imovelValido, uf: "Minas" });
    expect(resultado.success).toBe(false);
  });

  it("sem marcar captação, o campo vira false", () => {
    const semCaptacao: Partial<typeof imovelValido> = { ...imovelValido };
    delete semCaptacao.possuiCaptacaoAgua;
    const resultado = esquemaImovel.safeParse(semCaptacao);
    expect(resultado.success).toBe(true);
    if (!resultado.success) return;
    expect(resultado.data.possuiCaptacaoAgua).toBe(false);
  });

  it("na edição, exige o identificador do imóvel", () => {
    expect(esquemaAtualizarImovel.safeParse(imovelValido).success).toBe(false);
    expect(
      esquemaAtualizarImovel.safeParse({ ...imovelValido, id: "imovel-1" })
        .success,
    ).toBe(true);
  });
});

const talhaoValido = {
  clienteId: "cliente-1",
  imovelId: "imovel-1",
  nome: "Garagem",
  areaHa: "5,34",
  plantasPorHa: "4081",
  espacamento: "3,50 x 0,70",
  variedade: "M. Novo 376-4",
  anoPlantio: "2010",
  areaIrrigadaHa: "",
};

describe("esquemaTalhao", () => {
  it("aceita a ficha completa do talhão da planilha", () => {
    const resultado = esquemaTalhao.safeParse(talhaoValido);
    expect(resultado.success).toBe(true);
    if (!resultado.success) return;
    expect(resultado.data.areaHa).toBeCloseTo(5.34, 2);
    expect(resultado.data.plantasPorHa).toBe(4081);
    expect(resultado.data.anoPlantio).toBe(2010);
  });

  it("exige imóvel, variedade e ano de plantio", () => {
    expect(
      esquemaTalhao.safeParse({ ...talhaoValido, imovelId: "" }).success,
    ).toBe(false);
    expect(
      esquemaTalhao.safeParse({ ...talhaoValido, variedade: "" }).success,
    ).toBe(false);
    expect(
      esquemaTalhao.safeParse({ ...talhaoValido, anoPlantio: "" }).success,
    ).toBe(false);
  });

  it("recusa ano de plantio fora do intervalo plausível", () => {
    expect(
      esquemaTalhao.safeParse({ ...talhaoValido, anoPlantio: "1800" }).success,
    ).toBe(false);
    expect(
      esquemaTalhao.safeParse({ ...talhaoValido, anoPlantio: "2999" }).success,
    ).toBe(false);
  });

  it("recusa plantas/ha fracionado", () => {
    expect(
      esquemaTalhao.safeParse({ ...talhaoValido, plantasPorHa: "4081,5" })
        .success,
    ).toBe(false);
  });
});

describe("esquemaLancamentoSafra", () => {
  const lancamentoValido = {
    clienteId: "cliente-1",
    talhaoId: "talhao-1",
    safra: "2025/26",
    estadoLavoura: "Produção",
    previsaoSacas: "373,8",
    colheitaEfetivaSacas: "",
    previsaoPodaRenovacao: "Poda e esqueletamento",
  };

  it("aceita lançamento com previsão em sacas com vírgula", () => {
    const resultado = esquemaLancamentoSafra.safeParse(lancamentoValido);
    expect(resultado.success).toBe(true);
    if (!resultado.success) return;
    expect(resultado.data.previsaoSacas).toBeCloseTo(373.8, 1);
    expect(resultado.data.colheitaEfetivaSacas).toBeUndefined();
  });

  it("recusa rótulo de safra fora do formato 2025/26", () => {
    expect(
      esquemaLancamentoSafra.safeParse({ ...lancamentoValido, safra: "25/26" })
        .success,
    ).toBe(false);
    expect(
      esquemaLancamentoSafra.safeParse({ ...lancamentoValido, safra: "2025" })
        .success,
    ).toBe(false);
  });

  it("recusa lançamento sem nenhum dado da safra", () => {
    const resultado = esquemaLancamentoSafra.safeParse({
      clienteId: "cliente-1",
      talhaoId: "talhao-1",
      safra: "2025/26",
      estadoLavoura: "",
      previsaoSacas: "",
      colheitaEfetivaSacas: "",
      previsaoPodaRenovacao: "",
    });
    expect(resultado.success).toBe(false);
  });

  it("recusa sacas negativas", () => {
    expect(
      esquemaLancamentoSafra.safeParse({
        ...lancamentoValido,
        previsaoSacas: "-10",
      }).success,
    ).toBe(false);
  });
});

describe("esquemaDocumentoImovel", () => {
  const documentoValido = {
    clienteId: "cliente-1",
    imovelId: "imovel-1",
    tipo: "licenca",
    identificacao: "Licenciamento ambiental",
    venceEm: "2027-01-15",
    status: "ok",
    observacao: "",
  };

  it("aceita documento com vencimento em data ISO", () => {
    const resultado = esquemaDocumentoImovel.safeParse(documentoValido);
    expect(resultado.success).toBe(true);
    if (!resultado.success) return;
    expect(resultado.data.venceEm).toBe("2027-01-15");
    expect(resultado.data.observacao).toBeUndefined();
  });

  it("aceita documento sem vencimento (ex.: dispensa de licença)", () => {
    const resultado = esquemaDocumentoImovel.safeParse({
      ...documentoValido,
      tipo: "dispensa_licenca",
      venceEm: "",
    });
    expect(resultado.success).toBe(true);
    if (!resultado.success) return;
    expect(resultado.data.venceEm).toBeUndefined();
  });

  it("recusa tipo de documento desconhecido e status inválido", () => {
    expect(
      esquemaDocumentoImovel.safeParse({ ...documentoValido, tipo: "alvara" })
        .success,
    ).toBe(false);
    expect(
      esquemaDocumentoImovel.safeParse({
        ...documentoValido,
        status: "atrasado",
      }).success,
    ).toBe(false);
  });

  it("recusa data de vencimento inválida", () => {
    expect(
      esquemaDocumentoImovel.safeParse({
        ...documentoValido,
        venceEm: "15/01/2027",
      }).success,
    ).toBe(false);
  });
});

describe("esquemaCaptacao", () => {
  const captacaoValida = {
    clienteId: "cliente-1",
    imovelId: "imovel-1",
    tipoCaptacao: "Captação de água em surgência (nascente)",
    processo: "Nº 0000001119/2024",
    classificacao: "Uso insignificante",
    venceEm: "2027-01-15",
    status: "ok",
  };

  it("aceita a captação da planilha de usos da água", () => {
    expect(esquemaCaptacao.safeParse(captacaoValida).success).toBe(true);
  });

  it("exige a descrição do tipo de captação", () => {
    expect(
      esquemaCaptacao.safeParse({ ...captacaoValida, tipoCaptacao: "" })
        .success,
    ).toBe(false);
  });
});
