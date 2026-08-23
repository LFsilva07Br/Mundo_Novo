import { describe, expect, it } from "vitest";
import { emailsDosContatos, emailsDosGestores } from "./destinatarios";

describe("emailsDosContatos", () => {
  it("filtra vazios/inválidos, tira espaços e remove duplicados", () => {
    const emails = emailsDosContatos([
      { email: " maria@fazenda.com " },
      { email: "maria@fazenda.com" },
      { email: "MARIA@fazenda.com" },
      { email: "jose@fazenda.com" },
      { email: null },
      { email: "" },
      { email: "sem-arroba" },
    ]);
    expect(emails).toEqual(["maria@fazenda.com", "jose@fazenda.com"]);
  });

  it("devolve lista vazia quando nenhum contato tem e-mail", () => {
    expect(emailsDosContatos([{ email: null }, { email: "  " }])).toEqual([]);
  });
});

describe("emailsDosGestores", () => {
  const perfis = [
    { email: "gestor@mn.br", papel: "gestor", ativo: true },
    { email: "diretora@mn.br", papel: "diretoria", ativo: true },
    { email: "consultor@mn.br", papel: "consultor", ativo: true },
    { email: "inativo@mn.br", papel: "gestor", ativo: false },
    { email: "", papel: "gestor", ativo: true },
    {
      email: "portal@cliente.com",
      papel: "gestor",
      ativo: true,
      cliente_id: "11111111-1111-4111-8111-111111111111",
    },
  ];

  it("seleciona só gestor/diretoria ativos, internos e com e-mail", () => {
    expect(emailsDosGestores(perfis)).toEqual([
      "gestor@mn.br",
      "diretora@mn.br",
    ]);
  });

  it("aceita perfis sem os campos opcionais (ativo/cliente_id ausentes)", () => {
    expect(emailsDosGestores([{ email: "g@mn.br", papel: "gestor" }])).toEqual([
      "g@mn.br",
    ]);
    expect(emailsDosGestores([{ papel: "gestor" }])).toEqual([]);
  });
});
