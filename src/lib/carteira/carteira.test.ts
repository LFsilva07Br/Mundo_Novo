import { describe, expect, it } from "vitest";
import { CLIENTES_DEMO, GRUPOS_DEMO } from "./dados-demo";
import {
  clientesDiretos,
  clientesDoGrupo,
  listarClientes,
  listarGrupos,
  obterCliente,
} from "./consultas";

describe("carteira demo — consistência com a carteira real", () => {
  it("tem os 3 grupos reais e 8 clientes do protótipo validado", () => {
    expect(GRUPOS_DEMO).toHaveLength(3);
    expect(CLIENTES_DEMO).toHaveLength(8);
  });

  it("todo cliente com grupo aponta para um grupo existente", () => {
    const ids = new Set(GRUPOS_DEMO.map((g) => g.id));
    for (const cliente of CLIENTES_DEMO) {
      if (cliente.grupoId !== null) {
        expect(ids.has(cliente.grupoId), cliente.nome).toBe(true);
      }
    }
  });

  it("não há ids duplicados", () => {
    const ids = CLIENTES_DEMO.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("Expocaccer é grupo administrado por terceiro", () => {
    const expocaccer = GRUPOS_DEMO.find((g) => g.id === "expocaccer");
    expect(expocaccer?.administracao).toBe("terceiro");
  });

  it("Fazendas Guatambu é Cadeia de Suprimentos no grupo Expocaccer", async () => {
    const guatambu = await obterCliente("guatambu");
    expect(guatambu?.tipo).toBe("cadeia_suprimentos");
    expect(guatambu?.grupoId).toBe("expocaccer");
  });

  it("Fazenda Tecoara é cliente direto (sem grupo)", async () => {
    const diretos = await clientesDiretos();
    expect(diretos.map((c) => c.id)).toEqual(["tecoara"]);
  });

  it("todo cliente tem certificação principal com norma", () => {
    for (const cliente of CLIENTES_DEMO) {
      expect(cliente.certificacoes.length, cliente.nome).toBeGreaterThan(0);
      expect(
        cliente.certificacoes.some((c) => c.principal),
        cliente.nome,
      ).toBe(true);
    }
  });

  it("Alto da Serra tem os 11 imóveis rurais da planilha, somando 107,22 ha", async () => {
    const cliente = await obterCliente("alto-da-serra");
    expect(cliente?.imoveis).toHaveLength(11);
    const total = cliente!.imoveis!.reduce((s, i) => s + i.areaTotalHa, 0);
    expect(total).toBeCloseTo(107.2206, 2);
    const cafe = cliente!.imoveis!.reduce((s, i) => s + i.areaCafeHa, 0);
    expect(cafe).toBeCloseTo(62.22, 2);
  });

  it("clientes do Cerrado Mineiro são 5", async () => {
    const doCerrado = await clientesDoGrupo("cerrado-mineiro");
    expect(doCerrado).toHaveLength(5);
  });

  it("listarClientes ordena por nome", async () => {
    const clientes = await listarClientes();
    const nomes = clientes.map((c) => c.nome);
    expect(nomes).toEqual([...nomes].sort((a, b) => a.localeCompare(b, "pt-BR")));
  });

  it("listarGrupos retorna os grupos", async () => {
    expect(await listarGrupos()).toHaveLength(3);
  });
});
