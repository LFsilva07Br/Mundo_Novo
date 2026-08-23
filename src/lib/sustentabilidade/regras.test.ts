import { describe, expect, it } from "vitest";
import {
  anoDaData,
  clientesContemplados,
  gerarCsvPagamentos,
  montarCaminhoComprovante,
  totaisPorClienteAno,
  totaisPorTipoAno,
} from "./regras";

const PAGAMENTOS = [
  { clienteId: "a", cliente: "Fazenda A", tipo: "diferencial" as const, valor: 1000, data: "2026-07-01", descricao: "DS safra" },
  { clienteId: "a", cliente: "Fazenda A", tipo: "investimento" as const, valor: 300, data: "2026-05-10", descricao: null },
  { clienteId: "b", cliente: "Fazenda B", tipo: "diferencial" as const, valor: 500, data: "2025-08-20", descricao: "DS 2024/25" },
  { clienteId: "a", cliente: "Fazenda A", tipo: "diferencial" as const, valor: 200, data: "2025-03-15", descricao: null },
];

describe("totaisPorTipoAno", () => {
  it("soma DS e DI por ano, do mais recente para o mais antigo", () => {
    const totais = totaisPorTipoAno(PAGAMENTOS);
    expect(totais).toEqual([
      { ano: 2026, diferencial: 1000, investimento: 300, total: 1300 },
      { ano: 2025, diferencial: 700, investimento: 0, total: 700 },
    ]);
  });

  it("sem pagamentos, devolve lista vazia", () => {
    expect(totaisPorTipoAno([])).toEqual([]);
  });

  it("anoDaData extrai o ano da data ISO", () => {
    expect(anoDaData("2026-07-01")).toBe(2026);
  });
});

describe("totaisPorClienteAno", () => {
  it("agrupa por cliente e ano, ordenando por ano e nome", () => {
    const linhas = totaisPorClienteAno(PAGAMENTOS);
    expect(linhas).toHaveLength(3);
    expect(linhas[0]).toMatchObject({
      cliente: "Fazenda A",
      ano: 2026,
      diferencial: 1000,
      investimento: 300,
      total: 1300,
    });
    expect(linhas[1]).toMatchObject({ cliente: "Fazenda A", ano: 2025, total: 200 });
    expect(linhas[2]).toMatchObject({ cliente: "Fazenda B", ano: 2025, total: 500 });
  });
});

describe("clientesContemplados", () => {
  it("conta clientes distintos", () => {
    expect(clientesContemplados(PAGAMENTOS)).toBe(2);
    expect(clientesContemplados([])).toBe(0);
  });
});

describe("gerarCsvPagamentos", () => {
  it("gera o CSV com cabeçalho e valores com duas casas", () => {
    const csv = gerarCsvPagamentos([PAGAMENTOS[0]]);
    const linhas = csv.split("\n");
    expect(linhas[0]).toBe("cliente;tipo;valor;data;descricao");
    expect(linhas[1]).toBe("Fazenda A;Diferencial (DS);1000.00;2026-07-01;DS safra");
  });

  it("protege campos com ponto e vírgula ou aspas", () => {
    const csv = gerarCsvPagamentos([
      {
        cliente: 'Fazenda "Boa; Vista"',
        tipo: "investimento",
        valor: 10.5,
        data: "2026-01-02",
        descricao: "obra; etapa 1",
      },
    ]);
    expect(csv.split("\n")[1]).toBe(
      '"Fazenda ""Boa; Vista""";Investimento (DI);10.50;2026-01-02;"obra; etapa 1"',
    );
  });
});

describe("montarCaminhoComprovante", () => {
  it("monta o caminho na pasta ds/ do bucket de evidências", () => {
    expect(
      montarCaminhoComprovante("cliente-1", "image/png", 1755800000000, "abc123"),
    ).toBe("ds/cliente-1/1755800000000-abc123.png");
  });
});
