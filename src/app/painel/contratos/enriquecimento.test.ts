import { describe, expect, it } from "vitest";
import type { ContratoAlcada } from "@/lib/certificacao/consultas";
import type { ContratoFinanceiro } from "@/lib/financeiro/regras";
import {
  casarContratoFinanceiro,
  descreverVigencia,
  enriquecerContratos,
  extrairLinkDocumento,
  montarContexto,
  normalizarNomeCliente,
} from "./enriquecimento";

const FINANCEIRO: ContratoFinanceiro[] = [
  {
    id: "f-bernardes",
    clienteId: "bernardes",
    clienteNome: "Fazenda Bernardes",
    descricao: "Gestão ambiental e certificações (RA + 4C)",
    valorMensal: 3500,
    diaVencimento: 10,
    inicio: "2025-08-01",
    ativo: true,
  },
  {
    id: "f-bernardes-antigo",
    clienteId: "bernardes",
    clienteNome: "Fazenda Bernardes",
    descricao: "Contrato anterior encerrado",
    valorMensal: 1900,
    diaVencimento: 10,
    inicio: "2023-01-01",
    fim: "2025-07-31",
    ativo: false,
  },
  {
    id: "f-tecoara",
    clienteId: "tecoara",
    clienteNome: "Fazenda Tecoara",
    descricao: "Consultoria de certificação Rainforest Alliance",
    valorMensal: 2100,
    diaVencimento: 5,
    inicio: "2026-01-15",
    fim: "2027-01-14",
    ativo: true,
  },
];

function contrato(campos: Partial<ContratoAlcada> = {}): ContratoAlcada {
  return {
    id: "c1",
    codigo: "2026-044",
    clienteNome: "Fazenda Bernardes",
    clienteId: "bernardes",
    tipo: "fazenda",
    status: "aguardando_alcada",
    solicitadoPor: "Adriano Carvalho",
    solicitadoEm: "2026-08-18",
    diasParado: 5,
    decididoPor: null,
    decididoEm: null,
    observacao: null,
    ...campos,
  };
}

describe("normalizarNomeCliente", () => {
  it("ignora acento, caixa, pontuação e anotação entre parênteses", () => {
    expect(normalizarNomeCliente("Fazenda Rio Verde (novo cadastro)")).toBe(
      "fazenda rio verde",
    );
    expect(normalizarNomeCliente("FAZENDA CHAPADÃO DE FERRO")).toBe(
      "fazenda chapadao de ferro",
    );
    expect(normalizarNomeCliente("Sítio Boa-Vista")).toBe("sitio boa vista");
  });
});

describe("casarContratoFinanceiro", () => {
  it("casa pelo vínculo de cadastro e prefere o contrato ativo", () => {
    const achado = casarContratoFinanceiro(contrato(), FINANCEIRO);
    expect(achado?.id).toBe("f-bernardes");
  });

  it("sem vínculo de cadastro, casa pelo nome normalizado", () => {
    const achado = casarContratoFinanceiro(
      contrato({ clienteId: null, clienteNome: "fazenda tecoara" }),
      FINANCEIRO,
    );
    expect(achado?.id).toBe("f-tecoara");
  });

  it("cliente novo, sem contrato no financeiro, não casa com ninguém", () => {
    const achado = casarContratoFinanceiro(
      contrato({
        clienteId: null,
        clienteNome: "Fazenda Rio Verde (novo cadastro)",
      }),
      FINANCEIRO,
    );
    expect(achado).toBeNull();
  });

  it("não inventa vínculo quando o financeiro está vazio", () => {
    expect(casarContratoFinanceiro(contrato(), [])).toBeNull();
  });
});

describe("extrairLinkDocumento", () => {
  it("acha o link no meio do texto livre e descarta a pontuação final", () => {
    expect(
      extrairLinkDocumento(
        "Renovação anual. Minuta em https://arquivos.exemplo/contratos/2026-044.pdf.",
      ),
    ).toBe("https://arquivos.exemplo/contratos/2026-044.pdf");
  });

  it("devolve null quando não há link nenhum", () => {
    expect(extrairLinkDocumento("Aguardando assinatura do produtor")).toBeNull();
    expect(extrairLinkDocumento(null)).toBeNull();
    expect(extrairLinkDocumento("")).toBeNull();
  });
});

describe("descreverVigencia", () => {
  it("descreve contrato com prazo e sem prazo", () => {
    expect(descreverVigencia(FINANCEIRO[0])).toBe(
      "Desde 01/08/2025, sem prazo de término",
    );
    expect(descreverVigencia(FINANCEIRO[2])).toBe("De 15/01/2026 a 14/01/2027");
  });

  it("sem contrato financeiro, não há vigência a mostrar", () => {
    expect(descreverVigencia(null)).toBeNull();
  });
});

describe("montarContexto", () => {
  it("traz valor, vigência, escopo e documento quando existem", () => {
    const contexto = montarContexto(
      contrato({
        observacao: "Minuta em https://arquivos.exemplo/2026-044.pdf",
      }),
      FINANCEIRO,
    );

    expect(contexto.valorMensal).toBe(3500);
    expect(contexto.valorFormatado).toMatch(/3\.500,00\/mês$/);
    expect(contexto.vigencia).toBe("Desde 01/08/2025, sem prazo de término");
    expect(contexto.escopo).toBe("Gestão ambiental e certificações (RA + 4C)");
    expect(contexto.documentoUrl).toBe("https://arquivos.exemplo/2026-044.pdf");
  });

  it("sem contrato no financeiro, o contexto fica vazio (a tela avisa)", () => {
    const contexto = montarContexto(
      contrato({ clienteId: null, clienteNome: "Sítio Boa Vista" }),
      FINANCEIRO,
    );

    expect(contexto).toEqual({
      valorMensal: null,
      valorFormatado: null,
      vigencia: null,
      escopo: null,
      documentoUrl: null,
    });
  });
});

describe("enriquecerContratos", () => {
  it("mantém os campos do contrato e acrescenta o contexto comercial", () => {
    const [enriquecido] = enriquecerContratos([contrato()], FINANCEIRO);

    expect(enriquecido.codigo).toBe("2026-044");
    expect(enriquecido.contexto.valorMensal).toBe(3500);
  });
});
