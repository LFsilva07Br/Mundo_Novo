import { describe, expect, it } from "vitest";
import { montarExportacao, nomeArquivoExportacao } from "./dados";

/** Sem Supabase no ambiente de teste, a exportação usa os dados de demonstração. */
describe("montarExportacao", () => {
  it("carteira inteira: um bloco por cliente, com todas as seções", async () => {
    const exportacao = await montarExportacao();
    expect(exportacao).not.toBeNull();
    expect(exportacao!.escopo).toBe("carteira");
    expect(exportacao!.totalClientes).toBeGreaterThan(1);
    expect(exportacao!.clientes).toHaveLength(exportacao!.totalClientes);

    for (const cliente of exportacao!.clientes) {
      expect(cliente.cadastro.id).toBeTruthy();
      expect(Array.isArray(cliente.imoveis)).toBe(true);
      expect(Array.isArray(cliente.talhoesESafras.talhoes)).toBe(true);
      expect(Array.isArray(cliente.visitas)).toBe(true);
      expect(Array.isArray(cliente.capas)).toBe(true);
      expect(Array.isArray(cliente.social.trabalhadores)).toBe(true);
      expect(Array.isArray(cliente.lotesENegociacoes)).toBe(true);
      expect(Array.isArray(cliente.tarefas)).toBe(true);
    }
  });

  it("por cliente: escopo restrito e visitas com respostas completas", async () => {
    const exportacao = await montarExportacao("alto-da-serra");
    expect(exportacao).not.toBeNull();
    expect(exportacao!.escopo).toBe("cliente");
    expect(exportacao!.totalClientes).toBe(1);

    const [cliente] = exportacao!.clientes;
    expect(cliente.cadastro.nome).toContain("Alto da Serra");
    // Backup de verdade: a visita vai com itens e respostas, não só o resumo.
    expect(cliente.visitas.length).toBeGreaterThan(0);
    expect(cliente.visitas[0].respostas.length).toBeGreaterThan(0);
    // CAPAs juntadas pelo nome do cliente.
    for (const capa of cliente.capas) {
      expect(capa.cliente).toBe(cliente.cadastro.nome);
    }
  });

  it("cliente inexistente devolve null", async () => {
    await expect(montarExportacao("nao-existe")).resolves.toBeNull();
  });

  it("declara a finalidade LGPD e a data de geração", async () => {
    const exportacao = await montarExportacao("alto-da-serra");
    expect(exportacao!.finalidade).toMatch(/LGPD/);
    expect(exportacao!.geradoEm).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe("nomeArquivoExportacao", () => {
  const data = new Date(2026, 7, 23); // 23/08/2026

  it("carteira completa com a data no nome", () => {
    expect(nomeArquivoExportacao(data)).toBe(
      "exportacao-mundo-novo-carteira-completa-2026-08-23.json",
    );
  });

  it("por cliente inclui o id", () => {
    expect(nomeArquivoExportacao(data, "alto-da-serra")).toBe(
      "exportacao-mundo-novo-cliente-alto-da-serra-2026-08-23.json",
    );
  });
});
