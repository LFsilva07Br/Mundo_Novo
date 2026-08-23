import { describe, expect, it } from "vitest";
import {
  agruparPorDia,
  chaveDia,
  dataDeChave,
  diasDaSemana,
  ehFimDeSemana,
  mesmoDia,
  rotuloDiaCompleto,
  rotuloIntervalo,
  rotuloMes,
  segundaDaSemana,
  somarDias,
} from "./semana";

/** Datas locais à meia-noite — o mês entra 1-based para facilitar a leitura. */
function data(ano: number, mes: number, dia: number): Date {
  return new Date(ano, mes - 1, dia);
}

describe("segundaDaSemana", () => {
  it("devolve a mesma segunda para qualquer dia da semana", () => {
    // 17/08/2026 é segunda-feira; 23/08/2026 é domingo.
    const esperada = chaveDia(data(2026, 8, 17));
    for (let dia = 17; dia <= 23; dia += 1) {
      expect(chaveDia(segundaDaSemana(data(2026, 8, dia)))).toBe(esperada);
    }
  });

  it("trata o domingo como fim da semana, não como início", () => {
    const domingo = data(2026, 8, 23);
    expect(domingo.getDay()).toBe(0);
    expect(chaveDia(segundaDaSemana(domingo))).toBe("2026-08-17");
  });

  it("é idempotente — a segunda de uma segunda é ela mesma", () => {
    const segunda = segundaDaSemana(data(2026, 8, 20));
    expect(chaveDia(segundaDaSemana(segunda))).toBe(chaveDia(segunda));
  });

  it("volta para o mês anterior na virada de mês", () => {
    // 02/09/2026 é quarta; a semana começou em 31/08/2026.
    expect(chaveDia(segundaDaSemana(data(2026, 9, 2)))).toBe("2026-08-31");
  });

  it("volta para o ano anterior na virada de ano", () => {
    // 01/01/2027 é sexta; a semana começou em 28/12/2026.
    expect(chaveDia(segundaDaSemana(data(2027, 1, 1)))).toBe("2026-12-28");
  });

  it("ignora o horário da data recebida", () => {
    const comHora = new Date(2026, 7, 21, 23, 45, 30);
    expect(chaveDia(segundaDaSemana(comHora))).toBe("2026-08-17");
  });
});

describe("diasDaSemana", () => {
  it("devolve sete dias, de segunda a domingo", () => {
    const dias = diasDaSemana(data(2026, 8, 17));
    expect(dias).toHaveLength(7);
    expect(dias.map(chaveDia)).toEqual([
      "2026-08-17",
      "2026-08-18",
      "2026-08-19",
      "2026-08-20",
      "2026-08-21",
      "2026-08-22",
      "2026-08-23",
    ]);
    expect(dias[0].getDay()).toBe(1);
    expect(dias[6].getDay()).toBe(0);
  });

  it("atravessa a virada de mês", () => {
    expect(diasDaSemana(data(2026, 8, 31)).map(chaveDia)).toEqual([
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
      "2026-09-05",
      "2026-09-06",
    ]);
  });

  it("atravessa a virada de ano", () => {
    const dias = diasDaSemana(data(2026, 12, 28));
    expect(chaveDia(dias[0])).toBe("2026-12-28");
    expect(chaveDia(dias[6])).toBe("2027-01-03");
  });

  it("atravessa 29 de fevereiro em ano bissexto", () => {
    // 24/02/2028 é quinta → semana de 21/02 a 27/02; a seguinte pega o dia 29.
    const dias = diasDaSemana(segundaDaSemana(data(2028, 3, 1)));
    expect(dias.map(chaveDia)).toContain("2028-02-29");
  });
});

describe("chaveDia e dataDeChave", () => {
  it("faz ida e volta sem escorregar de dia", () => {
    const original = data(2026, 1, 5);
    expect(chaveDia(dataDeChave(chaveDia(original))!)).toBe("2026-01-05");
  });

  it("preenche mês e dia com zero à esquerda", () => {
    expect(chaveDia(data(2026, 3, 7))).toBe("2026-03-07");
  });

  it("recusa texto que não é data válida", () => {
    expect(dataDeChave("")).toBeNull();
    expect(dataDeChave(null)).toBeNull();
    expect(dataDeChave(undefined)).toBeNull();
    expect(dataDeChave("hoje")).toBeNull();
    expect(dataDeChave("2026-8-1")).toBeNull();
    expect(dataDeChave("2026-13-01")).toBeNull();
    expect(dataDeChave("2026-02-30")).toBeNull();
  });
});

describe("agruparPorDia", () => {
  const dias = diasDaSemana(data(2026, 8, 17));
  const compromissos = [
    { id: "a", dia: "2026-08-17" },
    { id: "b", dia: "2026-08-17" },
    { id: "c", dia: "2026-08-23" },
    { id: "d", dia: null },
    { id: "e", dia: "2026-08-24" },
    { id: "f", dia: "2026-08-16" },
  ];

  it("mantém as sete colunas mesmo com dias vazios", () => {
    const grupos = agruparPorDia(compromissos, dias);
    expect(grupos).toHaveLength(7);
    expect(grupos.map((g) => g.compromissos.length)).toEqual([
      2, 0, 0, 0, 0, 0, 1,
    ]);
  });

  it("agrupa no dia certo e preserva a ordem de entrada", () => {
    const grupos = agruparPorDia(compromissos, dias);
    expect(grupos[0].compromissos.map((c) => c.id)).toEqual(["a", "b"]);
    expect(grupos[6].compromissos.map((c) => c.id)).toEqual(["c"]);
  });

  it("descarta o que está fora da semana e o que não tem dia", () => {
    const grupos = agruparPorDia(compromissos, dias);
    const ids = grupos.flatMap((g) => g.compromissos.map((c) => c.id));
    expect(ids).not.toContain("d");
    expect(ids).not.toContain("e");
    expect(ids).not.toContain("f");
  });

  it("agrupa corretamente numa semana que vira o mês", () => {
    const diasVirada = diasDaSemana(data(2026, 8, 31));
    const grupos = agruparPorDia(
      [{ id: "x", dia: "2026-09-01" }, { id: "y", dia: "2026-08-31" }],
      diasVirada,
    );
    expect(grupos[0].compromissos.map((c) => c.id)).toEqual(["y"]);
    expect(grupos[1].compromissos.map((c) => c.id)).toEqual(["x"]);
  });

  it("informa o índice e a chave de cada dia", () => {
    const grupos = agruparPorDia([], dias);
    expect(grupos[3].indice).toBe(3);
    expect(grupos[3].chave).toBe("2026-08-20");
  });
});

describe("rotuloIntervalo", () => {
  it("resume a semana inteira dentro do mesmo mês", () => {
    expect(rotuloIntervalo(data(2026, 8, 17))).toBe(
      "17 a 23 de agosto de 2026",
    );
  });

  it("nomeia os dois meses na virada de mês", () => {
    expect(rotuloIntervalo(data(2026, 8, 31))).toBe(
      "31 de agosto a 6 de setembro de 2026",
    );
  });

  it("nomeia os dois anos na virada de ano", () => {
    expect(rotuloIntervalo(data(2026, 12, 28))).toBe(
      "28 de dezembro de 2026 a 3 de janeiro de 2027",
    );
  });
});

describe("rótulos auxiliares", () => {
  it("nomeia o dia da semana por extenso", () => {
    expect(rotuloDiaCompleto(data(2026, 8, 17))).toBe(
      "Segunda-feira, 17 de agosto",
    );
    expect(rotuloDiaCompleto(data(2026, 8, 23))).toBe("Domingo, 23 de agosto");
  });

  it("nomeia o mês da semana exibida", () => {
    expect(rotuloMes(data(2026, 8, 17))).toBe("agosto de 2026");
  });
});

describe("mesmoDia, ehFimDeSemana e somarDias", () => {
  it("compara datas ignorando o horário", () => {
    expect(mesmoDia(new Date(2026, 7, 17, 8), new Date(2026, 7, 17, 22))).toBe(
      true,
    );
    expect(mesmoDia(data(2026, 8, 17), data(2026, 8, 18))).toBe(false);
  });

  it("marca sábado e domingo como fim de semana", () => {
    const dias = diasDaSemana(data(2026, 8, 17));
    expect(dias.map(ehFimDeSemana)).toEqual([
      false,
      false,
      false,
      false,
      false,
      true,
      true,
    ]);
  });

  it("soma e subtrai dias atravessando meses", () => {
    expect(chaveDia(somarDias(data(2026, 8, 31), 1))).toBe("2026-09-01");
    expect(chaveDia(somarDias(data(2026, 1, 1), -1))).toBe("2025-12-31");
    expect(chaveDia(somarDias(data(2026, 8, 17), 7))).toBe("2026-08-24");
  });
});
