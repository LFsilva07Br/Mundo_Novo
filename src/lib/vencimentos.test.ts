import { describe, expect, it } from "vitest";
import {
  DISPAROS_PADRAO_DIAS,
  diasAte,
  disparosAtingidos,
  formatarArea,
  formatarData,
  rotuloStatusVencimento,
  statusVencimento,
} from "./vencimentos";

const hoje = new Date(2026, 6, 28); // 28 jul 2026, data de referência do protótipo

describe("diasAte", () => {
  it("conta os dias até uma data futura", () => {
    expect(diasAte(new Date(2026, 7, 27), hoje)).toBe(30);
  });

  it("retorna negativo para data passada", () => {
    expect(diasAte(new Date(2026, 6, 20), hoje)).toBe(-8);
  });

  it("retorna zero para hoje, ignorando horário", () => {
    expect(diasAte(new Date(2026, 6, 28, 23, 59), hoje)).toBe(0);
  });
});

describe("statusVencimento", () => {
  it("marca vencido quando a data passou", () => {
    expect(statusVencimento(new Date(2026, 6, 27), hoje)).toBe("vencido");
  });

  it("marca crítico a 30 dias ou menos (caso Faz. Boa Esperança)", () => {
    expect(statusVencimento(new Date(2026, 7, 27), hoje)).toBe("critico");
  });

  it("marca atenção a 90 dias (caso Faz. Santa Rita, vence 26 out)", () => {
    expect(statusVencimento(new Date(2026, 9, 26), hoje)).toBe("atencao");
  });

  it("marca atenção a 120 dias (caso Faz. São Judas, vence 25 nov)", () => {
    expect(statusVencimento(new Date(2026, 10, 25), hoje)).toBe("atencao");
  });

  it("marca ok acima de 120 dias (caso Sítio Alto da Serra, 201 dias)", () => {
    expect(statusVencimento(new Date(2027, 1, 14), hoje)).toBe("ok");
  });
});

describe("rotuloStatusVencimento", () => {
  it("traduz cada status para o rótulo exibido", () => {
    expect(rotuloStatusVencimento("vencido")).toBe("Vencido");
    expect(rotuloStatusVencimento("critico")).toBe("Crítico");
    expect(rotuloStatusVencimento("atencao")).toBe("Atenção");
    expect(rotuloStatusVencimento("ok")).toBe("OK");
  });
});

describe("disparosAtingidos", () => {
  it("com 30 dias restantes, todos os marcos padrão foram cruzados", () => {
    expect(disparosAtingidos(new Date(2026, 7, 27), hoje)).toEqual([
      ...DISPAROS_PADRAO_DIAS,
    ]);
  });

  it("com 90 dias restantes, os marcos de 180 a 90 estão ativos", () => {
    expect(disparosAtingidos(new Date(2026, 9, 26), hoje)).toEqual([
      180, 150, 120, 90,
    ]);
  });

  it("respeita override de disparos por cliente (caso Boa Esperança: 15 e 7 dias)", () => {
    const disparos = [...DISPAROS_PADRAO_DIAS, 15, 7];
    expect(
      disparosAtingidos(new Date(2026, 7, 3), hoje, disparos),
    ).toEqual([180, 150, 120, 90, 60, 30, 15, 7]);
  });

  it("sem marcos cruzados retorna lista vazia", () => {
    expect(disparosAtingidos(new Date(2027, 6, 28), hoje)).toEqual([]);
  });
});

describe("formatação", () => {
  it("formata datas em pt-BR", () => {
    expect(formatarData(new Date(2026, 9, 26))).toMatch(/26 de out/);
  });

  it("formata área em hectares", () => {
    expect(formatarArea(107.2206)).toBe("107,22 ha");
    expect(formatarArea(62.22)).toBe("62,22 ha");
  });
});
