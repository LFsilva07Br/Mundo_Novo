import { describe, expect, it } from "vitest";
import {
  COOKIE_CLIENTE_SELECIONADO,
  lerCookie,
  montarCookie,
  resolverClienteSelecionado,
} from "./cliente-selecionado";

const CLIENTES = [
  { id: "cedro", nome: "Fazenda Cedro" },
  { id: "tecoara", nome: "Fazenda Tecoara" },
];

describe("lerCookie", () => {
  it("acha o cookie no meio dos outros", () => {
    expect(
      lerCookie(`tema=escuro; ${COOKIE_CLIENTE_SELECIONADO}=cedro; sb=xyz`),
    ).toBe("cedro");
  });

  it("devolve null quando o cookie não existe", () => {
    expect(lerCookie("tema=escuro")).toBeNull();
    expect(lerCookie("")).toBeNull();
  });

  it("decodifica ids com caracteres especiais", () => {
    expect(lerCookie(montarCookie("fazenda são josé").split(";")[0])).toBe(
      "fazenda são josé",
    );
  });

  it("não confunde com um cookie de nome parecido", () => {
    expect(lerCookie(`${COOKIE_CLIENTE_SELECIONADO}-antigo=tecoara`)).toBeNull();
  });
});

describe("montarCookie", () => {
  it("escapa o id e fixa caminho, validade e samesite", () => {
    const cookie = montarCookie("cedro/1");
    expect(cookie).toContain(`${COOKIE_CLIENTE_SELECIONADO}=cedro%2F1`);
    expect(cookie).toContain("path=/");
    expect(cookie).toContain("samesite=lax");
    expect(cookie).toContain("max-age=15552000");
  });
});

describe("resolverClienteSelecionado", () => {
  it("usa o cliente salvo no cookie", () => {
    expect(resolverClienteSelecionado("tecoara", CLIENTES)?.id).toBe("tecoara");
  });

  it("prioriza o cliente pedido na URL sobre o cookie", () => {
    expect(resolverClienteSelecionado("tecoara", CLIENTES, "cedro")?.id).toBe(
      "cedro",
    );
  });

  it("ignora id que não está mais na carteira e cai no primeiro", () => {
    expect(resolverClienteSelecionado("sumiu", CLIENTES)?.id).toBe("cedro");
    expect(resolverClienteSelecionado(null, CLIENTES, "sumiu")?.id).toBe("cedro");
  });

  it("devolve null com a carteira vazia", () => {
    expect(resolverClienteSelecionado("cedro", [])).toBeNull();
  });
});
