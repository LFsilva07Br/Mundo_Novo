import { describe, expect, it } from "vitest";
import {
  normalizarAcao,
  resumoDoRegistro,
  rotuloAcao,
  rotuloTabela,
} from "./registro";

describe("normalizarAcao / rotuloAcao", () => {
  it("aceita a grafia do trigger (lower(tg_op)) e a traduzida", () => {
    expect(normalizarAcao("insert")).toBe("inserir");
    expect(normalizarAcao("UPDATE")).toBe("atualizar");
    expect(normalizarAcao("delete")).toBe("remover");
    expect(normalizarAcao("inserir")).toBe("inserir");
    expect(normalizarAcao("qualquer-coisa")).toBeNull();
  });

  it("traduz a ação para linguagem de negócio", () => {
    expect(rotuloAcao("insert")).toBe("Criação");
    expect(rotuloAcao("atualizar")).toBe("Alteração");
    expect(rotuloAcao("delete")).toBe("Remoção");
  });
});

describe("rotuloTabela", () => {
  it("traduz as tabelas monitoradas", () => {
    expect(rotuloTabela("capas")).toBe("CAPAs");
    expect(rotuloTabela("checklist_versoes")).toBe("Versões de checklist");
    expect(rotuloTabela("perfis")).toBe("Perfis de usuário");
  });

  it("devolve o nome cru para tabela desconhecida", () => {
    expect(rotuloTabela("tabela_nova")).toBe("tabela_nova");
  });
});

describe("resumoDoRegistro — extração do jsonb", () => {
  it("usa o nome quando existe", () => {
    expect(resumoDoRegistro({ nome: "Fazenda Alto da Serra", uf: "MG" })).toBe(
      "Fazenda Alto da Serra",
    );
  });

  it("usa o título quando não há nome", () => {
    expect(resumoDoRegistro({ titulo: "Visita de pré-auditoria" })).toBe(
      "Visita de pré-auditoria",
    );
  });

  it("combina número e descrição (caso das CAPAs)", () => {
    expect(
      resumoDoRegistro({ numero: 131, descricao: "Depósito sem sinalização" }),
    ).toBe("nº 131 — Depósito sem sinalização");
  });

  it("usa código/identificação textuais", () => {
    expect(resumoDoRegistro({ codigo: "CTR-2026-018" })).toBe("CTR-2026-018");
    expect(resumoDoRegistro({ identificacao: "AS-2526-003" })).toBe(
      "AS-2526-003",
    );
  });

  it("trunca resumos longos", () => {
    const resumo = resumoDoRegistro({ descricao: "x".repeat(200) });
    expect(resumo).toHaveLength(90);
    expect(resumo?.endsWith("…")).toBe(true);
  });

  it("devolve null sem campos reconhecíveis ou com dados inválidos", () => {
    expect(resumoDoRegistro({ id: "abc", ativo: true })).toBeNull();
    expect(resumoDoRegistro(null)).toBeNull();
    expect(resumoDoRegistro("texto")).toBeNull();
    expect(resumoDoRegistro([1, 2])).toBeNull();
  });
});
