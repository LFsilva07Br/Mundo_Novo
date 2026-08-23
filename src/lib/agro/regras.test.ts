import { describe, expect, it } from "vitest";
import {
  ALERTA_PRODUTO_PROIBIDO,
  ALERTA_SEM_TREINAMENTO,
  avaliarAplicacao,
  situacaoTreinamentoNaData,
  treinamentoValidoNaData,
  type ParticipacaoTreinamento,
} from "./regras";

const TURMA_2026: ParticipacaoTreinamento = {
  realizadoEm: "2026-03-06",
  venceEm: "2027-03-06",
};
const TURMA_2024: ParticipacaoTreinamento = {
  realizadoEm: "2024-05-10",
  venceEm: "2025-05-10",
};

describe("situacaoTreinamentoNaData", () => {
  it("é sem-registro quando o aplicador nunca participou", () => {
    expect(situacaoTreinamentoNaData([], "2026-05-20")).toBe("sem-registro");
  });

  it("é válido quando alguma participação cobre a data da aplicação", () => {
    expect(situacaoTreinamentoNaData([TURMA_2026], "2026-05-20")).toBe(
      "valido",
    );
  });

  it("é vencido quando a participação mais recente já expirou na data", () => {
    expect(situacaoTreinamentoNaData([TURMA_2024], "2026-06-02")).toBe(
      "vencido",
    );
  });

  it("é vencido (não válido) quando a turma só aconteceu DEPOIS da aplicação", () => {
    // Reciclagem posterior não regulariza aplicação passada.
    expect(situacaoTreinamentoNaData([TURMA_2026], "2026-01-15")).toBe(
      "vencido",
    );
  });

  it("considera válido nos dias exatos de realização e de vencimento", () => {
    expect(situacaoTreinamentoNaData([TURMA_2026], "2026-03-06")).toBe(
      "valido",
    );
    expect(situacaoTreinamentoNaData([TURMA_2026], "2027-03-06")).toBe(
      "valido",
    );
    expect(situacaoTreinamentoNaData([TURMA_2026], "2027-03-07")).toBe(
      "vencido",
    );
  });

  it("basta uma participação cobrir a data, mesmo com turmas vencidas no histórico", () => {
    expect(
      situacaoTreinamentoNaData([TURMA_2024, TURMA_2026], "2026-05-20"),
    ).toBe("valido");
  });

  it("participação sem vencimento (vence_em nulo) vale para sempre", () => {
    expect(
      situacaoTreinamentoNaData(
        [{ realizadoEm: "2020-01-10", venceEm: null }],
        "2026-05-20",
      ),
    ).toBe("valido");
  });
});

describe("treinamentoValidoNaData", () => {
  it("devolve true só quando a situação é válida", () => {
    expect(treinamentoValidoNaData([TURMA_2026], "2026-05-20")).toBe(true);
    expect(treinamentoValidoNaData([TURMA_2024], "2026-05-20")).toBe(false);
    expect(treinamentoValidoNaData([], "2026-05-20")).toBe(false);
  });
});

describe("avaliarAplicacao", () => {
  it("sem irregularidade não gera alerta", () => {
    expect(
      avaliarAplicacao({ produtoProibido: false, treinamentoValido: true }),
    ).toEqual([]);
  });

  it("produto proibido gera o alerta vermelho da RA", () => {
    expect(
      avaliarAplicacao({ produtoProibido: true, treinamentoValido: true }),
    ).toEqual([ALERTA_PRODUTO_PROIBIDO]);
  });

  it("aplicador sem treinamento válido gera o alerta da NR-31", () => {
    expect(
      avaliarAplicacao({ produtoProibido: false, treinamentoValido: false }),
    ).toEqual([ALERTA_SEM_TREINAMENTO]);
  });

  it("acumula os dois alertas quando tudo está errado", () => {
    expect(
      avaliarAplicacao({ produtoProibido: true, treinamentoValido: false }),
    ).toEqual([ALERTA_PRODUTO_PROIBIDO, ALERTA_SEM_TREINAMENTO]);
  });
});
