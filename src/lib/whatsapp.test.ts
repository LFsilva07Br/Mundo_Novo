import { describe, expect, it } from "vitest";
import {
  linkWhatsApp,
  mensagemCobrancaCapa,
  mensagemContatoPadrao,
  mensagemLembreteVisita,
  mensagemVencimentoCertificado,
  normalizarTelefoneBr,
} from "./whatsapp";

describe("normalizarTelefoneBr", () => {
  it("remove máscara e acrescenta o DDI 55", () => {
    expect(normalizarTelefoneBr("(34) 99999-0000")).toBe("5534999990000");
    expect(normalizarTelefoneBr("34 3333-0000")).toBe("553433330000");
  });

  it("não duplica o DDI quando o número já tem 55", () => {
    expect(normalizarTelefoneBr("+55 34 99999-0000")).toBe("5534999990000");
    expect(normalizarTelefoneBr("5534999990000")).toBe("5534999990000");
  });

  it("descarta o zero de discagem à esquerda", () => {
    expect(normalizarTelefoneBr("034 99999-0000")).toBe("5534999990000");
  });

  it("devolve null para números incompletos ou vazios", () => {
    expect(normalizarTelefoneBr("")).toBeNull();
    expect(normalizarTelefoneBr("9999-0000")).toBeNull();
    expect(normalizarTelefoneBr("abc")).toBeNull();
  });
});

describe("linkWhatsApp", () => {
  it("monta o link wa.me com telefone normalizado e mensagem codificada", () => {
    const link = linkWhatsApp("(34) 99999-0000", "Olá, tudo bem? Café & prosa");
    expect(link).toBe(
      "https://wa.me/5534999990000?text=Ol%C3%A1%2C%20tudo%20bem%3F%20Caf%C3%A9%20%26%20prosa",
    );
  });

  it("devolve null quando o telefone é inválido", () => {
    expect(linkWhatsApp("123", "Olá")).toBeNull();
  });
});

describe("modelos de mensagem", () => {
  it("cobrança de CAPA cita cliente, descrição e prazo", () => {
    const texto = mensagemCobrancaCapa({
      cliente: "Fazenda Alto da Serra",
      descricao: "Sinalização de agroquímicos ausente",
      prazo: "2026-09-15",
    });
    expect(texto).toContain("Fazenda Alto da Serra");
    expect(texto).toContain("Sinalização de agroquímicos ausente");
    expect(texto).toContain("15 de set. de 2026");
  });

  it("cobrança de CAPA sem prazo não menciona prazo", () => {
    const texto = mensagemCobrancaCapa({
      cliente: "Fazenda Guatambu",
      descricao: "EPI incompleto",
      prazo: null,
    });
    expect(texto).not.toContain("prazo combinado");
  });

  it("aviso de vencimento cita a norma e a data", () => {
    const texto = mensagemVencimentoCertificado({
      cliente: "Fazenda Guatambu",
      norma: "Rainforest Alliance",
      venceEm: "2026-08-14",
    });
    expect(texto).toContain("Rainforest Alliance");
    expect(texto).toContain("14 de ago. de 2026");
  });

  it("lembrete de visita cita o cliente e o período", () => {
    const texto = mensagemLembreteVisita({
      cliente: "Fazenda Alto da Serra",
      quando: "outubro de 2026",
    });
    expect(texto).toContain("outubro de 2026");
  });

  it("mensagem padrão do contato cumprimenta pelo nome", () => {
    const texto = mensagemContatoPadrao({
      contato: "Silvio Dutra",
      cliente: "Fazenda Alto da Serra",
    });
    expect(texto).toContain("Olá, Silvio Dutra!");
  });
});
