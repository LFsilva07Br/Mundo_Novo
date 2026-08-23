import { describe, expect, it } from "vitest";
import { montarAlertaHtml } from "./modelos";

describe("montarAlertaHtml", () => {
  it("monta o alerta com título, detalhe, vencimento e rodapé do sistema", () => {
    const html = montarAlertaHtml({
      titulo: "Certificado vence em 30 dias — Fazenda Alto da Serra",
      detalhe: "Norma Rainforest · vencimento 2026-09-21",
      vence_em: "2026-09-21",
    });
    expect(html).toContain("Certificado vence em 30 dias — Fazenda Alto da Serra");
    expect(html).toContain("Norma Rainforest · vencimento 2026-09-21");
    expect(html).toContain("Vencimento de referência: 2026-09-21");
    expect(html).toContain("Mundo Novo Café");
  });

  it("escapa HTML vindo dos dados (proteção contra injeção no e-mail)", () => {
    const html = montarAlertaHtml({
      titulo: "<script>alert(1)</script>",
      detalhe: 'a "b" & c',
      vence_em: "2026-01-01",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&quot;b&quot; &amp; c");
  });
});
