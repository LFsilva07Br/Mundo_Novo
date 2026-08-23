import { describe, expect, it } from "vitest";
import {
  faixaUuidDoProtocolo,
  formatarProtocolo,
  normalizarProtocolo,
  protocoloDaQueixa,
  protocoloVisivel,
} from "./protocolo";

const UUID = "8f3a2c91-4b7d-4e2a-9c11-6d5f0a3b7e42";

describe("Protocolo do canal de queixas", () => {
  it("gera um código curto de 8 caracteres a partir do id da queixa", () => {
    const codigo = protocoloDaQueixa(UUID);
    expect(codigo).toHaveLength(8);
    expect(codigo).toMatch(/^[0-9A-Z]{8}$/);
  });

  it("é sempre o mesmo código para a mesma queixa", () => {
    expect(protocoloDaQueixa(UUID)).toBe(protocoloDaQueixa(UUID));
  });

  it("dá códigos diferentes para queixas diferentes", () => {
    expect(protocoloDaQueixa(UUID)).not.toBe(
      protocoloDaQueixa("11111111-2222-3333-4444-555555555555"),
    );
  });

  it("não usa letras que se confundem à mão (I, L, O e U)", () => {
    for (let i = 0; i < 400; i += 1) {
      const hex = i.toString(16).padStart(12, "0");
      const codigo = protocoloDaQueixa(`${hex.slice(0, 8)}-${hex.slice(8)}-4000-8000-000000000000`);
      expect(codigo).not.toMatch(/[ILOU]/);
    }
  });

  it("não carrega nenhum dado pessoal — só os bytes do id", () => {
    // O mesmo id gera o mesmo código independentemente de contato, data ou
    // texto do relato: não há nada além do uuid entrando na conta.
    const codigo = protocoloDaQueixa(UUID);
    expect(codigo).toBe(protocoloDaQueixa(UUID.toUpperCase()));
  });

  it("mostra em dois blocos de quatro, fácil de copiar no papel", () => {
    expect(protocoloVisivel(UUID)).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    expect(formatarProtocolo("K7QM3XZ2")).toBe("K7QM-3XZ2");
  });

  it("recusa id que não é uuid", () => {
    expect(() => protocoloDaQueixa("nao-e-uuid")).toThrow();
  });
});

describe("Leitura do que a pessoa digitou", () => {
  it("aceita minúsculas, espaços e traços", () => {
    const codigo = protocoloDaQueixa(UUID);
    const comoFoiDigitado = ` ${formatarProtocolo(codigo).toLowerCase()} `;
    expect(normalizarProtocolo(comoFoiDigitado)).toBe(codigo);
  });

  it("corrige as confusões clássicas de escrita à mão", () => {
    // O->0, I->1, L->1, U->V
    expect(normalizarProtocolo("OIL0UABC")).toBe("0110VABC");
  });

  it("devolve null quando não tem 8 caracteres", () => {
    expect(normalizarProtocolo("K7QM")).toBeNull();
    expect(normalizarProtocolo("K7QM3XZ2A")).toBeNull();
    expect(normalizarProtocolo("")).toBeNull();
  });
});

describe("Busca da queixa a partir do protocolo", () => {
  it("devolve a faixa de uuids que gera aquele código", () => {
    const faixa = faixaUuidDoProtocolo(protocoloDaQueixa(UUID));
    expect(faixa).not.toBeNull();
    expect(faixa!.de <= UUID).toBe(true);
    expect(faixa!.ate >= UUID).toBe(true);
  });

  it("a faixa é estreita: prende os 5 primeiros bytes do uuid", () => {
    const faixa = faixaUuidDoProtocolo(protocoloDaQueixa(UUID))!;
    expect(faixa.de.slice(0, 10)).toBe(UUID.slice(0, 10));
    expect(faixa.ate.slice(0, 10)).toBe(UUID.slice(0, 10));
    expect(faixa.de).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("não deixa um uuid de outra queixa cair na faixa", () => {
    const faixa = faixaUuidDoProtocolo(protocoloDaQueixa(UUID))!;
    const outro = "11111111-2222-3333-4444-555555555555";
    expect(outro >= faixa.de && outro <= faixa.ate).toBe(false);
  });

  it("devolve null para código malformado", () => {
    expect(faixaUuidDoProtocolo("abc")).toBeNull();
  });
});
