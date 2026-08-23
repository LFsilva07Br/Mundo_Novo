import { describe, expect, it } from "vitest";
import { agruparConformidadePorMes, rotuloMes } from "./historico";

describe("agruparConformidadePorMes", () => {
  it("agrupa visitas concluídas por mês, com média por mês", () => {
    const pontos = agruparConformidadePorMes([
      { status: "concluida", concluidaEm: "2026-06-10T10:00:00Z", conformidade: 80 },
      { status: "concluida", concluidaEm: "2026-06-25T10:00:00Z", conformidade: 90 },
      { status: "concluida", concluidaEm: "2026-08-22T10:00:00Z", conformidade: 88 },
    ]);

    expect(pontos).toHaveLength(2);
    expect(pontos[0]).toMatchObject({
      mes: "2026-06",
      rotulo: "jun/26",
      conformidade: 85,
      visitas: 2,
    });
    expect(pontos[1]).toMatchObject({ mes: "2026-08", conformidade: 88 });
  });

  it("ignora visitas em andamento e sem conformidade apurada", () => {
    const pontos = agruparConformidadePorMes([
      { status: "em_andamento", concluidaEm: null, conformidade: null },
      { status: "concluida", concluidaEm: "2026-07-01T09:00:00Z", conformidade: null },
    ]);
    expect(pontos).toHaveLength(0);
  });
});

describe("rotuloMes", () => {
  it("formata yyyy-mm em rótulo curto pt-BR", () => {
    expect(rotuloMes("2026-02")).toBe("fev/26");
    expect(rotuloMes("2025-12")).toBe("dez/25");
  });
});
