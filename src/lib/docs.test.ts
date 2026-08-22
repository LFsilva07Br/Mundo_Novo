import { describe, expect, it } from "vitest";
import { ABAS_DOCS, carregarDoc } from "./docs";

describe("documentação interativa", () => {
  it("possui as duas abas exigidas: funcional e técnica", () => {
    expect(ABAS_DOCS.map((a) => a.id)).toEqual(["funcional", "tecnica"]);
  });

  it("renderiza a documentação funcional em HTML", async () => {
    const html = await carregarDoc("funcional");
    expect(html).toContain("<h1>");
    expect(html).toContain("Documentação Funcional");
    expect(html).toContain("plano de ação");
  });

  it("renderiza a documentação técnica em HTML", async () => {
    const html = await carregarDoc("tecnica");
    expect(html).toContain("Documentação Técnica");
    expect(html).toContain("Supabase");
  });
});
