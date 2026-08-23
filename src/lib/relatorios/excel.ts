import ExcelJS from "exceljs";
import type { StatusVencimento } from "@/lib/vencimentos";
import {
  formatarDataBr,
  type LinhaConformidade,
  type RelatorioCapas,
  type RelatorioSafra,
} from "./dados";

/**
 * Geração das pastas Excel dos relatórios (identidade visual Mundo Novo:
 * cabeçalho verde #1B4332 com fonte branca, primeira linha congelada).
 */

const VERDE = "FF1B4332";
const CREME = "FFF7F6F1";
const BRANCO = "FFFFFFFF";

// Cores de status (verde / âmbar / vermelho)
const VERDE_STATUS = "FFB7E4C7";
const AMBAR_STATUS = "FFFDE68A";
const VERMELHO_STATUS = "FFFECACA";

type Coluna = { header: string; key: string; width: number };

function novaPasta(): ExcelJS.Workbook {
  const pasta = new ExcelJS.Workbook();
  pasta.creator = "Mundo Novo Café — Consultoria em Certificação";
  pasta.created = new Date();
  return pasta;
}

function novaPlanilha(
  pasta: ExcelJS.Workbook,
  nome: string,
  colunas: Coluna[],
): ExcelJS.Worksheet {
  const planilha = pasta.addWorksheet(nome, {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  planilha.columns = colunas;

  const cabecalho = planilha.getRow(1);
  cabecalho.height = 22;
  cabecalho.eachCell((celula) => {
    celula.font = { bold: true, color: { argb: BRANCO } };
    celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: VERDE } };
    celula.alignment = { vertical: "middle" };
  });
  return planilha;
}

function destacarLinha(linha: ExcelJS.Row, cor: string = CREME) {
  linha.font = { bold: true };
  linha.eachCell((celula) => {
    celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: cor } };
  });
}

/** Cor de fundo da célula conforme o status de vencimento. */
export function corStatusVencimento(
  status: StatusVencimento | null,
): string | null {
  if (status === "ok") return VERDE_STATUS;
  if (status === "atencao") return AMBAR_STATUS;
  if (status === "critico" || status === "vencido") return VERMELHO_STATUS;
  return null;
}

function pintarCelula(celula: ExcelJS.Cell, cor: string | null) {
  if (!cor) return;
  celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: cor } };
}

async function paraBuffer(pasta: ExcelJS.Workbook): Promise<Uint8Array> {
  const conteudo = await pasta.xlsx.writeBuffer();
  return new Uint8Array(conteudo as ArrayBuffer);
}

// ------------------------------------------------------- estimativa de safra

export async function excelSafra(rel: RelatorioSafra): Promise<Uint8Array> {
  const pasta = novaPasta();

  const talhoes = novaPlanilha(pasta, "Talhões", [
    { header: "Produtor", key: "produtor", width: 18 },
    { header: "Imóvel", key: "imovel", width: 30 },
    { header: "Talhão", key: "talhao", width: 20 },
    { header: "Área (ha)", key: "areaHa", width: 11 },
    { header: "Variedade", key: "variedade", width: 20 },
    { header: "Ano plantio", key: "anoPlantio", width: 12 },
    { header: "Estado da lavoura", key: "estadoLavoura", width: 18 },
    { header: `Previsão ${rel.safraAtual} (sc)`, key: "previsaoSacas", width: 20 },
    {
      header: `Colheita ${rel.safraAnterior} (sc)`,
      key: "colheitaAnteriorSacas",
      width: 20,
    },
  ]);
  for (const linha of rel.linhas) {
    talhoes.addRow({ ...linha, anoPlantio: linha.anoPlantio ?? "—" });
  }
  destacarLinha(
    talhoes.addRow({
      produtor: rel.totalGeral.produtor,
      areaHa: rel.totalGeral.areaHa,
      previsaoSacas: rel.totalGeral.previsaoSacas,
      colheitaAnteriorSacas: rel.totalGeral.colheitaAnteriorSacas,
    }),
  );

  const totais = novaPlanilha(pasta, "Totais por produtor", [
    { header: "Produtor", key: "produtor", width: 22 },
    { header: "Talhões", key: "talhoes", width: 10 },
    { header: "Área (ha)", key: "areaHa", width: 11 },
    { header: `Previsão ${rel.safraAtual} (sc)`, key: "previsaoSacas", width: 20 },
    {
      header: `Colheita ${rel.safraAnterior} (sc)`,
      key: "colheitaAnteriorSacas",
      width: 20,
    },
  ]);
  for (const total of rel.totaisPorProdutor) totais.addRow(total);
  destacarLinha(totais.addRow(rel.totalGeral));

  const comparativo = novaPlanilha(pasta, "Comparativo de safras", [
    { header: "Safra", key: "safra", width: 12 },
    { header: "Previsão (sc)", key: "previsaoSacas", width: 15 },
    { header: "Colheita efetiva (sc)", key: "colheitaEfetivaSacas", width: 20 },
    { header: "Observação", key: "observacao", width: 44 },
  ]);
  for (const safra of rel.comparativo) {
    comparativo.addRow({
      safra: safra.safra,
      previsaoSacas: safra.previsaoSacas ?? "—",
      colheitaEfetivaSacas: safra.colheitaEfetivaSacas ?? "—",
      observacao: safra.observacao ?? "",
    });
  }

  return paraBuffer(pasta);
}

// ----------------------------------------------------------- conformidade

export async function excelConformidade(
  linhas: LinhaConformidade[],
): Promise<Uint8Array> {
  const pasta = novaPasta();
  const planilha = novaPlanilha(pasta, "Conformidade", [
    { header: "Cliente", key: "cliente", width: 32 },
    { header: "Cidade/UF", key: "cidadeUf", width: 26 },
    { header: "Fase", key: "fase", width: 14 },
    { header: "Conformidade (%)", key: "conformidade", width: 17 },
    { header: "Norma", key: "norma", width: 20 },
    { header: "Certificadora", key: "certificadora", width: 18 },
    { header: "Status", key: "statusCertificacao", width: 16 },
    { header: "Vence em", key: "venceEm", width: 13 },
    { header: "Situação", key: "situacao", width: 12 },
  ]);

  const rotuloSituacao: Record<StatusVencimento, string> = {
    ok: "OK",
    atencao: "Atenção",
    critico: "Crítico",
    vencido: "Vencido",
  };

  for (const linha of linhas) {
    const adicionada = planilha.addRow({
      ...linha,
      conformidade: linha.conformidade ?? "—",
      venceEm: formatarDataBr(linha.venceEm),
      situacao: linha.statusVencimento
        ? rotuloSituacao[linha.statusVencimento]
        : "—",
    });
    pintarCelula(
      adicionada.getCell("situacao"),
      corStatusVencimento(linha.statusVencimento),
    );
    pintarCelula(
      adicionada.getCell("venceEm"),
      corStatusVencimento(linha.statusVencimento),
    );
  }

  return paraBuffer(pasta);
}

// ------------------------------------------------------------------- CAPAs

export async function excelCapas(rel: RelatorioCapas): Promise<Uint8Array> {
  const pasta = novaPasta();
  const nome = rel.ocultarFechadas ? "CAPAs abertas" : "CAPAs";
  const planilha = novaPlanilha(pasta, nome, [
    { header: "Nº", key: "numero", width: 7 },
    { header: "Cliente", key: "cliente", width: 30 },
    { header: "Item do checklist", key: "itemCodigo", width: 17 },
    { header: "Descrição da NC", key: "descricao", width: 52 },
    { header: "Origem", key: "origem", width: 12 },
    { header: "Severidade", key: "severidade", width: 12 },
    { header: "Responsável", key: "responsavel", width: 20 },
    { header: "Prazo", key: "prazo", width: 13 },
    { header: "Status", key: "status", width: 21 },
    { header: "Ações concluídas", key: "acoes", width: 17 },
  ]);

  for (const linha of rel.linhas) {
    const adicionada = planilha.addRow({
      ...linha,
      itemCodigo: linha.itemCodigo ?? "—",
      prazo: formatarDataBr(linha.prazo),
      acoes: linha.acoesTotal
        ? `${linha.acoesConcluidas}/${linha.acoesTotal}`
        : "—",
    });
    const corSeveridade =
      linha.severidadeBruta === "critica"
        ? VERMELHO_STATUS
        : linha.severidadeBruta === "maior"
          ? AMBAR_STATUS
          : VERDE_STATUS;
    pintarCelula(adicionada.getCell("severidade"), corSeveridade);
    pintarCelula(
      adicionada.getCell("status"),
      linha.statusBruto === "fechada" ? VERDE_STATUS : AMBAR_STATUS,
    );
  }

  const resumo = planilha.addRow({
    numero: "",
    cliente: rel.ocultarFechadas
      ? `${rel.totalAbertas} CAPAs abertas (fechadas ocultadas: ${rel.totalFechadas})`
      : `${rel.totalAbertas} abertas · ${rel.totalFechadas} fechadas`,
  });
  destacarLinha(resumo);

  return paraBuffer(pasta);
}
