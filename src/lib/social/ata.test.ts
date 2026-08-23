import { describe, expect, it } from "vitest";
import { formatarDataAta, montarDadosAta, nomeArquivoAta } from "./ata";

describe("montagem da ata de treinamento", () => {
  const treinamento = { nome: "Defensivos (NR-31)", norma: "NR-31" };

  it("ordena os participantes por nome e conta as assinaturas", () => {
    const ata = montarDadosAta(treinamento, "2026-03-06", [
      { nome: "Ricardo Aparecido de Abreu", assinaturaUrl: "https://x/1.png" },
      { nome: "Antonio Sales Ferreira" },
      { nome: "Delorme de Abreu", assinaturaUrl: null },
    ]);

    expect(ata.participantes.map((p) => p.nome)).toEqual([
      "Antonio Sales Ferreira",
      "Delorme de Abreu",
      "Ricardo Aparecido de Abreu",
    ]);
    expect(ata.totalAssinaturas).toBe(1);
    expect(ata.participantes[0].assinaturaUrl).toBeNull();
    expect(ata.participantes[2].assinaturaUrl).toBe("https://x/1.png");
  });

  it("guarda o treinamento, a norma e a data em formato brasileiro", () => {
    const ata = montarDadosAta(treinamento, "2026-03-06", []);
    expect(ata.treinamentoNome).toBe("Defensivos (NR-31)");
    expect(ata.norma).toBe("NR-31");
    expect(ata.data).toBe("2026-03-06");
    expect(ata.dataFormatada).toBe("06/03/2026");
    expect(ata.totalAssinaturas).toBe(0);
  });

  it("formata datas ISO no padrão dd/mm/aaaa", () => {
    expect(formatarDataAta("2026-12-01")).toBe("01/12/2026");
  });

  it("monta o nome do arquivo com slug do treinamento e a data", () => {
    expect(nomeArquivoAta("Defensivos (NR-31)", "2026-03-06")).toBe(
      "ata-defensivos-nr-31-2026-03-06.pdf",
    );
  });
});
