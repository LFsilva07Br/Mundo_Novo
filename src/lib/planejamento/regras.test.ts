import { describe, expect, it } from "vitest";
import {
  calcularCobertura,
  encontrarVisitaRealizada,
  vincularRealizadas,
} from "./regras";
import type { PlanejamentoVisita, VisitaConcluida } from "./tipos";
import { esquemaPlanejamento } from "./validacao";

function plano(sobrescrever: Partial<PlanejamentoVisita>): PlanejamentoVisita {
  return {
    id: "p1",
    clienteId: "alto-da-serra",
    ano: 2026,
    mesPrevisto: 8,
    tipo: "auditoria_interna",
    visitaId: null,
    observacao: null,
    ...sobrescrever,
  };
}

const visita = (
  id: string,
  clienteId: string,
  concluidaEm: string,
): VisitaConcluida => ({ id, clienteId, concluidaEm });

describe("encontrarVisitaRealizada", () => {
  it("vincula visita concluída no mês previsto", () => {
    const visitas = [visita("v1", "alto-da-serra", "2026-08-22T13:10:00Z")];
    expect(encontrarVisitaRealizada(plano({}), visitas)).toBe("v1");
  });

  it("aceita a tolerância de um mês antes ou depois", () => {
    const visitas = [visita("v1", "alto-da-serra", "2026-07-30T10:00:00Z")];
    expect(encontrarVisitaRealizada(plano({ mesPrevisto: 8 }), visitas)).toBe("v1");
    expect(encontrarVisitaRealizada(plano({ mesPrevisto: 6 }), visitas)).toBe("v1");
  });

  it("rejeita visita fora da tolerância, de outro ano ou de outro cliente", () => {
    expect(
      encontrarVisitaRealizada(plano({ mesPrevisto: 3 }), [
        visita("v1", "alto-da-serra", "2026-08-22T13:10:00Z"),
      ]),
    ).toBeNull();
    expect(
      encontrarVisitaRealizada(plano({}), [
        visita("v1", "alto-da-serra", "2025-08-22T13:10:00Z"),
      ]),
    ).toBeNull();
    expect(
      encontrarVisitaRealizada(plano({}), [
        visita("v1", "guatambu", "2026-08-22T13:10:00Z"),
      ]),
    ).toBeNull();
  });
});

describe("vincularRealizadas", () => {
  it("preenche o vínculo automático e preserva vínculos existentes", () => {
    const planejamentos = [
      plano({ id: "p1" }),
      plano({ id: "p2", clienteId: "guatambu", mesPrevisto: 2, visitaId: "v-antiga" }),
      plano({ id: "p3", clienteId: "cedro", mesPrevisto: 10 }),
    ];
    const visitas = [visita("v1", "alto-da-serra", "2026-08-22T13:10:00Z")];

    const resultado = vincularRealizadas(planejamentos, visitas);
    expect(resultado[0]).toMatchObject({ visitaId: "v1", realizado: true });
    expect(resultado[1]).toMatchObject({ visitaId: "v-antiga", realizado: true });
    expect(resultado[2]).toMatchObject({ visitaId: null, realizado: false });
  });
});

describe("calcularCobertura", () => {
  const clientes = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("conta planejados, realizados e aponta quem ficou de fora", () => {
    const planejamentos = vincularRealizadas(
      [
        plano({ id: "p1", clienteId: "a", mesPrevisto: 8 }),
        plano({ id: "p2", clienteId: "b", mesPrevisto: 3 }),
      ],
      [visita("v1", "a", "2026-08-10T09:00:00Z")],
    );
    const cobertura = calcularCobertura(clientes, planejamentos);
    expect(cobertura).toEqual({
      total: 3,
      planejados: 2,
      realizados: 1,
      semPlanejamento: ["c"],
    });
  });

  it("cliente com dois tipos de visita conta uma vez na cobertura", () => {
    const planejamentos = vincularRealizadas(
      [
        plano({ id: "p1", clienteId: "a", tipo: "auditoria_interna" }),
        plano({ id: "p2", clienteId: "a", tipo: "visita_tecnica", mesPrevisto: 3 }),
      ],
      [],
    );
    const cobertura = calcularCobertura(clientes, planejamentos);
    expect(cobertura.planejados).toBe(1);
    expect(cobertura.semPlanejamento).toEqual(["b", "c"]);
  });
});

describe("esquemaPlanejamento", () => {
  it("aceita planejamento válido e converte números", () => {
    const analise = esquemaPlanejamento.safeParse({
      clienteId: "alto-da-serra",
      ano: "2026",
      mesPrevisto: "8",
      tipo: "auditoria_interna",
    });
    expect(analise.success).toBe(true);
    if (analise.success) {
      expect(analise.data.ano).toBe(2026);
      expect(analise.data.mesPrevisto).toBe(8);
    }
  });

  it("rejeita mês fora de 1 a 12 e tipo desconhecido", () => {
    expect(
      esquemaPlanejamento.safeParse({
        clienteId: "x",
        ano: 2026,
        mesPrevisto: 13,
        tipo: "auditoria_interna",
      }).success,
    ).toBe(false);
    expect(
      esquemaPlanejamento.safeParse({
        clienteId: "x",
        ano: 2026,
        mesPrevisto: 5,
        tipo: "ferias",
      }).success,
    ).toBe(false);
  });
});
