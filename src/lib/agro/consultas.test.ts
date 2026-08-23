import { describe, expect, it } from "vitest";
import {
  CLIENTE_PADRAO_AGRO,
  listarAplicacoes,
  listarDestinacoes,
  listarProdutos,
} from "./consultas";
import { ALERTA_PRODUTO_PROIBIDO, ALERTA_SEM_TREINAMENTO } from "./regras";

/**
 * Sem Supabase no ambiente de teste, as consultas servem os dados de
 * demonstração — mesma estrutura devolvida com o banco conectado.
 */

describe("listarProdutos (demo)", () => {
  it("traz 3 produtos, sendo exatamente 1 proibido pela RA", async () => {
    const produtos = await listarProdutos();
    expect(produtos).toHaveLength(3);
    expect(produtos.filter((p) => p.proibidoRa)).toHaveLength(1);
    expect(produtos.find((p) => p.proibidoRa)?.nome).toMatch(/Paraquate/);
  });
});

describe("listarAplicacoes (demo)", () => {
  it("traz 3 aplicações com talhão, imóvel e produto", async () => {
    const aplicacoes = await listarAplicacoes(CLIENTE_PADRAO_AGRO);
    expect(aplicacoes).toHaveLength(3);
    for (const a of aplicacoes) {
      expect(a.talhaoNome).toBeTruthy();
      expect(a.imovelNome).toBeTruthy();
      expect(a.produtoNome).toBeTruthy();
    }
  });

  it("marca o alerta vermelho na aplicação do produto proibido", async () => {
    const aplicacoes = await listarAplicacoes(CLIENTE_PADRAO_AGRO);
    const proibida = aplicacoes.find((a) => a.produtoProibido)!;
    expect(proibida.produtoNome).toMatch(/Paraquate/);
    expect(proibida.alertas).toContain(ALERTA_PRODUTO_PROIBIDO);
  });

  it("calcula a situação do treinamento NR-31 na data de cada aplicação", async () => {
    const aplicacoes = await listarAplicacoes(CLIENTE_PADRAO_AGRO);

    // Ricardo fez a turma de 2026 — válido nas duas aplicações dele.
    const doRicardo = aplicacoes.filter((a) =>
      a.aplicadorNome?.includes("Ricardo"),
    );
    expect(doRicardo.length).toBeGreaterThan(0);
    for (const a of doRicardo) {
      expect(a.treinamentoAplicador).toBe("valido");
    }

    // Rogerio deixou a turma de 2024 vencer — alerta de treinamento.
    const doRogerio = aplicacoes.find((a) =>
      a.aplicadorNome?.includes("Rogerio"),
    )!;
    expect(doRogerio.treinamentoAplicador).toBe("vencido");
    expect(doRogerio.alertas).toContain(ALERTA_SEM_TREINAMENTO);
  });

  it("aplicação regular fica sem alertas", async () => {
    const aplicacoes = await listarAplicacoes(CLIENTE_PADRAO_AGRO);
    const regular = aplicacoes.find((a) => a.produtoNome.includes("Glifosato"))!;
    expect(regular.alertas).toEqual([]);
  });

  it("devolve vazio para cliente sem aplicações de demonstração", async () => {
    expect(await listarAplicacoes("bernardes")).toEqual([]);
  });

  it("ordena da aplicação mais recente para a mais antiga", async () => {
    const aplicacoes = await listarAplicacoes(CLIENTE_PADRAO_AGRO);
    const datas = aplicacoes.map((a) => a.data);
    expect(datas).toEqual([...datas].sort().reverse());
  });
});

describe("listarDestinacoes (demo)", () => {
  it("traz 1 destinação com quantidade e comprovante", async () => {
    const destinacoes = await listarDestinacoes(CLIENTE_PADRAO_AGRO);
    expect(destinacoes).toHaveLength(1);
    expect(destinacoes[0].quantidade).toBe(48);
    expect(destinacoes[0].comprovanteCaminho).toMatch(/^embalagens\//);
  });

  it("devolve vazio para cliente sem registros de demonstração", async () => {
    expect(await listarDestinacoes("bernardes")).toEqual([]);
  });
});
