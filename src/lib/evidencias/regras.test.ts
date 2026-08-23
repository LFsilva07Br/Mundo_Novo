import { describe, expect, it } from "vitest";
import {
  extensaoDoTipo,
  montarCaminhoEvidencia,
  TAMANHO_MAXIMO_BYTES,
  validarArquivoEvidencia,
} from "./regras";

describe("validarArquivoEvidencia — tipo e tamanho", () => {
  it("aceita JPEG, PNG e WebP dentro do limite", () => {
    for (const tipo of ["image/jpeg", "image/png", "image/webp"]) {
      expect(validarArquivoEvidencia({ type: tipo, size: 1024 })).toEqual({
        ok: true,
      });
    }
  });

  it("recusa formatos que não são foto (GIF, PDF, vídeo)", () => {
    for (const tipo of ["image/gif", "application/pdf", "video/mp4", ""]) {
      const resultado = validarArquivoEvidencia({ type: tipo, size: 1024 });
      expect(resultado.ok).toBe(false);
      if (!resultado.ok) expect(resultado.erro).toMatch(/JPEG, PNG ou WebP/);
    }
  });

  it("recusa arquivo acima de 8 MB, aceitando exatamente o limite", () => {
    expect(
      validarArquivoEvidencia({ type: "image/jpeg", size: TAMANHO_MAXIMO_BYTES }),
    ).toEqual({ ok: true });

    const resultado = validarArquivoEvidencia({
      type: "image/jpeg",
      size: TAMANHO_MAXIMO_BYTES + 1,
    });
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.erro).toMatch(/8 MB/);
  });

  it("recusa arquivo vazio", () => {
    const resultado = validarArquivoEvidencia({ type: "image/png", size: 0 });
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.erro).toMatch(/vazio/);
  });
});

describe("montarCaminhoEvidencia — caminho no bucket", () => {
  it("monta visitas/<id>/<instante>-<sufixo>.<ext>", () => {
    expect(
      montarCaminhoEvidencia("visitas", "abc-123", "image/jpeg", 1700000000000, "x1y2z3"),
    ).toBe("visitas/abc-123/1700000000000-x1y2z3.jpg");
  });

  it("monta capas/<id>/... respeitando a extensão do tipo", () => {
    expect(
      montarCaminhoEvidencia("capas", "capa-9", "image/webp", 1, "abc"),
    ).toBe("capas/capa-9/1-abc.webp");
    expect(
      montarCaminhoEvidencia("capas", "capa-9", "image/png", 1, "abc"),
    ).toBe("capas/capa-9/1-abc.png");
  });

  it("usa jpg como extensão reserva para tipo desconhecido", () => {
    expect(extensaoDoTipo("image/desconhecido")).toBe("jpg");
  });

  it("gera caminhos diferentes em uploads simultâneos (sufixo aleatório)", () => {
    const a = montarCaminhoEvidencia("visitas", "v1", "image/jpeg");
    const b = montarCaminhoEvidencia("visitas", "v1", "image/jpeg");
    expect(a).not.toBe(b);
  });
});
