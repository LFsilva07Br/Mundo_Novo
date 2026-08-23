import { describe, expect, it } from "vitest";
import type { PanoramaTalhoes } from "@/lib/carteira/imoveis-consultas";
import type { Cliente } from "@/lib/carteira/tipos";
import type { Capa } from "@/lib/certificacao/consultas";
import type { TreinamentoResumo } from "@/lib/social/consultas";
import {
  formatarDataBr,
  formatarNumeroBr,
  montarRelatorioCapas,
  montarRelatorioConformidade,
  montarRelatorioMensal,
  montarRelatorioSafra,
  nomeArquivo,
  slugArquivo,
} from "./dados";

// Data fixa para os testes de vencimento (independe do relógio real).
const HOJE = new Date("2026-08-22T12:00:00");

const PANORAMA: PanoramaTalhoes = {
  talhoes: [
    {
      id: "t1",
      imovelId: "i1",
      imovelNome: "Sítio Alto da Serra",
      produtor: "Sílvio",
      nome: "Garagem",
      areaHa: 5.34,
      variedade: "M. Novo 376-4",
      anoPlantio: 2010,
      estadoLavoura: "Produção",
      previsaoAtualSacas: 373.8,
      colheitaAnteriorSacas: 51,
    },
    {
      id: "t2",
      imovelId: "i1",
      imovelNome: "Sítio Alto da Serra",
      produtor: "Sílvio",
      nome: "João",
      areaHa: 3,
      variedade: "Catuaí 99",
      anoPlantio: 2000,
      estadoLavoura: "Produção",
      previsaoAtualSacas: 240,
      colheitaAnteriorSacas: 0,
    },
    {
      id: "t3",
      imovelId: "i2",
      imovelNome: "Sítio Santa Inês",
      produtor: "Carter",
      nome: "Santa Inês 1",
      areaHa: 3.38,
      variedade: "Catuaí 99",
      anoPlantio: 2014,
      estadoLavoura: "Produção",
      previsaoAtualSacas: 236.6,
    },
  ],
  comparativo: [
    { safra: "2024/25", previsaoSacas: 1080, colheitaEfetivaSacas: 548 },
    {
      safra: "2025/26",
      previsaoSacas: 3430,
      colheitaEfetivaSacas: null,
      observacao: "em andamento",
    },
  ],
};

const CAPAS: Capa[] = [
  {
    id: "131",
    numero: 131,
    cliente: "Fazenda Alto da Serra",
    itemCodigo: "AGQ 4.2",
    descricao: "Depósito de defensivos sem sinalização",
    severidade: "critica",
    responsavel: "Tâmara",
    prazo: "2026-09-10",
    status: "aberta",
    origem: "campo",
    acoes: [
      { id: "a1", ordem: 1, descricao: "Sinalizar", concluida: false, concluidaEm: null },
      { id: "a2", ordem: 2, descricao: "Trancar", concluida: true, concluidaEm: "2026-08-20" },
    ],
  },
  {
    id: "130",
    numero: 130,
    cliente: "Fazenda Alto da Serra",
    itemCodigo: null,
    descricao: "Disjuntores expostos no barracão",
    severidade: "maior",
    responsavel: "Winicius",
    prazo: "2026-08-01",
    status: "fechada",
    origem: "escritorio",
    acoes: [],
  },
  {
    id: "129",
    numero: 129,
    cliente: "Fazenda Cedro",
    itemCodigo: null,
    descricao: "Registro de EPI incompleto",
    severidade: "menor",
    responsavel: "JP",
    prazo: null,
    status: "em_correcao",
    origem: "campo",
    acoes: [],
  },
];

const CLIENTE: Cliente = {
  id: "alto-da-serra",
  grupoId: null,
  nome: "Fazenda Alto da Serra",
  tipo: "fazenda",
  fase: "ativo",
  produtor: "Silvio Dutra",
  cidade: "São Sebastião do Paraíso",
  uf: "MG",
  regiao: "Alta Mogiana",
  conformidade: 88,
  certificacoes: [
    {
      norma: "ra",
      certificadora: "ALAICE",
      principal: true,
      status: "ativa",
      venceEm: "2026-08-14",
    },
  ],
  imoveis: [
    {
      nome: "Sítio Alto da Serra",
      areaTotalHa: 60,
      areaCafeHa: 40,
      areaAppHa: 1.5,
      areaReservaHa: 12,
    },
    {
      nome: "Sítio Santa Luzia",
      areaTotalHa: 47.2,
      areaCafeHa: 22.2,
    },
  ],
};

const TREINAMENTOS: TreinamentoResumo[] = [
  {
    id: "defensivos",
    nome: "Defensivos (NR-31)",
    periodicidadeMeses: 12,
    participantes: 2,
    totalTrabalhadores: 6,
    proximoVencimento: "2026-08-01", // já vencido em 22/08/2026
  },
  {
    id: "incendio",
    nome: "Combate a Incêndio",
    periodicidadeMeses: 12,
    participantes: 2,
    totalTrabalhadores: 6,
    proximoVencimento: "2027-06-08", // longe → fora do relatório
  },
  {
    id: "colhedeira",
    nome: "Colhedeira (NR-31)",
    periodicidadeMeses: 24,
    participantes: 0,
    totalTrabalhadores: 6,
    // sem vencimento registrado
  },
];

describe("nomes de arquivo", () => {
  it("gera slug sem acentos e com extensão", () => {
    expect(slugArquivo("Fazenda Alto da Serra")).toBe("fazenda-alto-da-serra");
    expect(nomeArquivo("estimativa-safra", "xlsx", "Fazenda Alto da Serra")).toBe(
      "estimativa-safra-fazenda-alto-da-serra.xlsx",
    );
    expect(nomeArquivo("conformidade-carteira", "pdf")).toBe(
      "conformidade-carteira.pdf",
    );
    expect(nomeArquivo("relatorio-mensal", "pdf", "Sítio São João")).toBe(
      "relatorio-mensal-sitio-sao-joao.pdf",
    );
  });
});

describe("formatação pt-BR", () => {
  it("converte data ISO em dd/mm/aaaa", () => {
    expect(formatarDataBr("2026-08-14")).toBe("14/08/2026");
    expect(formatarDataBr(null)).toBe("—");
    expect(formatarDataBr(undefined)).toBe("—");
  });

  it("formata números com vírgula decimal", () => {
    expect(formatarNumeroBr(1080)).toBe("1.080");
    expect(formatarNumeroBr(null)).toBe("—");
  });
});

describe("relatório de estimativa de safra", () => {
  it("agrupa totais por produtor e calcula o total geral", () => {
    const rel = montarRelatorioSafra("Fazenda Alto da Serra", PANORAMA);

    expect(rel.linhas).toHaveLength(3);
    expect(rel.totaisPorProdutor).toHaveLength(2);

    const silvio = rel.totaisPorProdutor.find((t) => t.produtor === "Sílvio")!;
    expect(silvio.talhoes).toBe(2);
    expect(silvio.areaHa).toBeCloseTo(8.34);
    expect(silvio.previsaoSacas).toBeCloseTo(613.8);
    expect(silvio.colheitaAnteriorSacas).toBe(51);

    expect(rel.totalGeral.talhoes).toBe(3);
    expect(rel.totalGeral.previsaoSacas).toBeCloseTo(850.4);
    expect(rel.comparativo).toHaveLength(2);
    expect(rel.safraAtual).toBe("2025/26");
  });

  it("talhão sem colheita anterior não conta como zero informado", () => {
    const rel = montarRelatorioSafra("Fazenda Alto da Serra", PANORAMA);
    const carter = rel.linhas.find((l) => l.produtor === "Carter")!;
    expect(carter.colheitaAnteriorSacas).toBeNull();
  });
});

describe("relatório de conformidade da carteira", () => {
  it("gera uma linha por certificação com status de vencimento", () => {
    const outro: Cliente = {
      ...CLIENTE,
      id: "cedro",
      nome: "Fazenda Cedro",
      certificacoes: [
        { norma: "quatro_c", status: "ativa", venceEm: "2026-10-01" },
        { norma: "organico", status: "em_implantacao" },
      ],
    };
    const semCert: Cliente = {
      ...CLIENTE,
      id: "novo",
      nome: "Fazenda Nova",
      certificacoes: [],
    };

    const linhas = montarRelatorioConformidade([outro, CLIENTE, semCert], HOJE);

    // Ordenada por nome do cliente.
    expect(linhas.map((l) => l.cliente)).toEqual([
      "Fazenda Alto da Serra",
      "Fazenda Cedro",
      "Fazenda Cedro",
      "Fazenda Nova",
    ]);

    const vencida = linhas[0];
    expect(vencida.norma).toBe("Rainforest Alliance");
    expect(vencida.statusVencimento).toBe("vencido");

    const atencao = linhas.find((l) => l.venceEm === "2026-10-01")!;
    expect(atencao.statusVencimento).toBe("atencao");

    const semData = linhas.find((l) => l.norma === "Orgânico")!;
    expect(semData.statusVencimento).toBeNull();

    const vazia = linhas.at(-1)!;
    expect(vazia.norma).toBe("—");
    expect(vazia.venceEm).toBeNull();
  });
});

describe("relatório de CAPAs", () => {
  it("ordena por número decrescente e traduz os rótulos", () => {
    const rel = montarRelatorioCapas(CAPAS, false);
    expect(rel.linhas.map((l) => l.numero)).toEqual([131, 130, 129]);
    expect(rel.linhas[0].severidade).toBe("Crítica");
    expect(rel.linhas[0].origem).toBe("Campo");
    expect(rel.linhas[0].acoesConcluidas).toBe(1);
    expect(rel.linhas[0].acoesTotal).toBe(2);
    expect(rel.linhas[1].status).toBe("Fechada");
    expect(rel.totalAbertas).toBe(2);
    expect(rel.totalFechadas).toBe(1);
  });

  it("ocultar fechadas remove as fechadas mas mantém a contagem total", () => {
    const rel = montarRelatorioCapas(CAPAS, true);
    expect(rel.linhas.map((l) => l.numero)).toEqual([131, 129]);
    expect(rel.linhas.every((l) => l.statusBruto !== "fechada")).toBe(true);
    expect(rel.totalAbertas).toBe(2);
    expect(rel.totalFechadas).toBe(1);
    expect(rel.ocultarFechadas).toBe(true);
  });
});

describe("relatório mensal do cliente", () => {
  it("consolida áreas, certificações, safra, CAPAs e treinamentos", () => {
    const rel = montarRelatorioMensal({
      cliente: CLIENTE,
      panorama: PANORAMA,
      capas: CAPAS,
      treinamentos: TREINAMENTOS,
      hoje: HOJE,
    });

    expect(rel.clienteNome).toBe("Fazenda Alto da Serra");
    expect(rel.cidadeUf).toBe("São Sebastião do Paraíso/MG");

    // Áreas somadas dos imóveis (APP/reserva ausentes contam como zero).
    expect(rel.areas.imoveis).toBe(2);
    expect(rel.areas.totalHa).toBeCloseTo(107.2);
    expect(rel.areas.cafeHa).toBeCloseTo(62.2);
    expect(rel.areas.appHa).toBeCloseTo(1.5);
    expect(rel.areas.reservaHa).toBeCloseTo(12);

    // Certificação com vencimento já passado aparece como vencida.
    expect(rel.certificacoes).toHaveLength(1);
    expect(rel.certificacoes[0].statusVencimento).toBe("vencido");

    // Só as CAPAs do cliente entram, separadas por situação.
    expect(rel.capasAbertas.map((c) => c.numero)).toEqual([131]);
    expect(rel.capasFechadas.map((c) => c.numero)).toEqual([130]);

    // Treinamentos: só quem vence (vencido/crítico/atenção) entra.
    expect(rel.treinamentosVencendo).toHaveLength(1);
    expect(rel.treinamentosVencendo[0].nome).toBe("Defensivos (NR-31)");
    expect(rel.treinamentosVencendo[0].status).toBe("vencido");

    // Safra herda o consolidado do relatório de safra.
    expect(rel.safra.totalGeral.talhoes).toBe(3);
  });
});
