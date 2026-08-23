import type {
  Cliente,
  StatusCertificacao,
} from "@/lib/carteira/tipos";
import { ROTULO_FASE, ROTULO_NORMA } from "@/lib/carteira/tipos";
import type {
  PanoramaTalhoes,
  SafraComparada,
} from "@/lib/carteira/imoveis-consultas";
import type {
  Capa,
  SeveridadeNc,
  StatusCapa,
} from "@/lib/certificacao/consultas";
import type { TreinamentoResumo } from "@/lib/social/consultas";
import { statusVencimento, type StatusVencimento } from "@/lib/vencimentos";

/**
 * Preparação de dados dos relatórios exportáveis (Excel/PDF).
 * Funções puras: recebem os dados das camadas de consulta e devolvem
 * estruturas prontas para renderizar — testáveis sem exceljs/react-pdf.
 */

// ---------------------------------------------------------------- utilidades

/** Converte um texto livre em slug de arquivo (sem acentos/espaços). */
export function slugArquivo(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Nome de arquivo claro para o download, ex.: estimativa-safra-alto-da-serra.xlsx */
export function nomeArquivo(
  base: string,
  formato: "xlsx" | "pdf",
  complemento?: string,
): string {
  const partes = [base];
  if (complemento) partes.push(slugArquivo(complemento));
  return `${partes.join("-")}.${formato}`;
}

/** Data ISO (yyyy-mm-dd) → dd/mm/aaaa; vazio vira travessão. */
export function formatarDataBr(iso?: string | null): string {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  if (!ano || !mes || !dia) return "—";
  return `${dia}/${mes}/${ano}`;
}

const formatadorNumero = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

export function formatarNumeroBr(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  return formatadorNumero.format(valor);
}

export const ROTULO_STATUS_CERTIFICACAO: Record<StatusCertificacao, string> = {
  em_implantacao: "Em implantação",
  ativa: "Ativa",
  em_renovacao: "Em renovação",
  vencida: "Vencida",
  suspensa: "Suspensa",
};

export const ROTULO_SEVERIDADE: Record<SeveridadeNc, string> = {
  menor: "Menor",
  maior: "Maior",
  critica: "Crítica",
};

export const ROTULO_STATUS_CAPA: Record<StatusCapa, string> = {
  aberta: "Aberta",
  em_correcao: "Em correção",
  aguardando_evidencia: "Aguardando evidência",
  fechada: "Fechada",
};

function dataMeioDia(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T12:00:00`);
}

// --------------------------------------------------------- estimativa de safra

export type LinhaSafra = {
  produtor: string;
  imovel: string;
  talhao: string;
  areaHa: number;
  variedade: string;
  anoPlantio: number | null;
  estadoLavoura: string;
  previsaoSacas: number;
  colheitaAnteriorSacas: number | null;
};

export type TotalSafraProdutor = {
  produtor: string;
  talhoes: number;
  areaHa: number;
  previsaoSacas: number;
  colheitaAnteriorSacas: number;
};

export type RelatorioSafra = {
  clienteNome: string;
  safraAtual: string;
  safraAnterior: string;
  linhas: LinhaSafra[];
  totaisPorProdutor: TotalSafraProdutor[];
  totalGeral: TotalSafraProdutor;
  comparativo: SafraComparada[];
};

export function montarRelatorioSafra(
  clienteNome: string,
  panorama: PanoramaTalhoes,
  safraAtual = "2025/26",
  safraAnterior = "2024/25",
): RelatorioSafra {
  const linhas: LinhaSafra[] = panorama.talhoes.map((talhao) => ({
    produtor: talhao.produtor ?? "Sem produtor",
    imovel: talhao.imovelNome,
    talhao: talhao.nome,
    areaHa: talhao.areaHa,
    variedade: talhao.variedade ?? "—",
    anoPlantio: talhao.anoPlantio ?? null,
    estadoLavoura: talhao.estadoLavoura ?? "—",
    previsaoSacas: talhao.previsaoAtualSacas ?? 0,
    colheitaAnteriorSacas: talhao.colheitaAnteriorSacas ?? null,
  }));

  const porProdutor = new Map<string, TotalSafraProdutor>();
  for (const linha of linhas) {
    const acumulado = porProdutor.get(linha.produtor) ?? {
      produtor: linha.produtor,
      talhoes: 0,
      areaHa: 0,
      previsaoSacas: 0,
      colheitaAnteriorSacas: 0,
    };
    acumulado.talhoes += 1;
    acumulado.areaHa += linha.areaHa;
    acumulado.previsaoSacas += linha.previsaoSacas;
    acumulado.colheitaAnteriorSacas += linha.colheitaAnteriorSacas ?? 0;
    porProdutor.set(linha.produtor, acumulado);
  }

  const totaisPorProdutor = [...porProdutor.values()];
  const totalGeral: TotalSafraProdutor = {
    produtor: "Total geral",
    talhoes: linhas.length,
    areaHa: totaisPorProdutor.reduce((s, t) => s + t.areaHa, 0),
    previsaoSacas: totaisPorProdutor.reduce((s, t) => s + t.previsaoSacas, 0),
    colheitaAnteriorSacas: totaisPorProdutor.reduce(
      (s, t) => s + t.colheitaAnteriorSacas,
      0,
    ),
  };

  return {
    clienteNome,
    safraAtual,
    safraAnterior,
    linhas,
    totaisPorProdutor,
    totalGeral,
    comparativo: panorama.comparativo,
  };
}

// ------------------------------------------------- conformidade da carteira

export type LinhaConformidade = {
  cliente: string;
  cidadeUf: string;
  fase: string;
  conformidade: number | null;
  norma: string;
  certificadora: string;
  statusCertificacao: string;
  venceEm: string | null;
  statusVencimento: StatusVencimento | null;
};

export function montarRelatorioConformidade(
  clientes: Cliente[],
  hoje: Date = new Date(),
): LinhaConformidade[] {
  const linhas: LinhaConformidade[] = [];

  for (const cliente of [...clientes].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR"),
  )) {
    const base = {
      cliente: cliente.nome,
      cidadeUf: [cliente.cidade, cliente.uf].filter(Boolean).join("/"),
      fase: ROTULO_FASE[cliente.fase],
      conformidade: cliente.conformidade ?? null,
    };

    if (cliente.certificacoes.length === 0) {
      linhas.push({
        ...base,
        norma: "—",
        certificadora: "—",
        statusCertificacao: "—",
        venceEm: null,
        statusVencimento: null,
      });
      continue;
    }

    for (const cert of cliente.certificacoes) {
      linhas.push({
        ...base,
        norma: ROTULO_NORMA[cert.norma],
        certificadora: cert.certificadora ?? "—",
        statusCertificacao: ROTULO_STATUS_CERTIFICACAO[cert.status],
        venceEm: cert.venceEm ?? null,
        statusVencimento: cert.venceEm
          ? statusVencimento(dataMeioDia(cert.venceEm), hoje)
          : null,
      });
    }
  }

  return linhas;
}

// -------------------------------------------------------------------- CAPAs

export type LinhaCapaRelatorio = {
  numero: number;
  cliente: string;
  itemCodigo: string | null;
  descricao: string;
  origem: string;
  severidade: string;
  severidadeBruta: SeveridadeNc;
  responsavel: string;
  prazo: string | null;
  status: string;
  statusBruto: StatusCapa;
  acoesConcluidas: number;
  acoesTotal: number;
};

export type RelatorioCapas = {
  linhas: LinhaCapaRelatorio[];
  totalAbertas: number;
  totalFechadas: number;
  ocultarFechadas: boolean;
};

/**
 * Monta o pacote de CAPAs. Com `ocultarFechadas` (pacote de auditoria
 * externa), o auditor recebe apenas o que ainda está em tratamento.
 */
export function montarRelatorioCapas(
  capas: Capa[],
  ocultarFechadas: boolean,
): RelatorioCapas {
  const ordenadas = [...capas].sort((a, b) => b.numero - a.numero);
  const totalFechadas = ordenadas.filter((c) => c.status === "fechada").length;
  const visiveis = ocultarFechadas
    ? ordenadas.filter((c) => c.status !== "fechada")
    : ordenadas;

  const linhas: LinhaCapaRelatorio[] = visiveis.map((capa) => ({
    numero: capa.numero,
    cliente: capa.cliente,
    itemCodigo: capa.itemCodigo,
    descricao: capa.descricao,
    origem: capa.origem === "campo" ? "Campo" : "Escritório",
    severidade: ROTULO_SEVERIDADE[capa.severidade],
    severidadeBruta: capa.severidade,
    responsavel: capa.responsavel,
    prazo: capa.prazo,
    status: ROTULO_STATUS_CAPA[capa.status],
    statusBruto: capa.status,
    acoesConcluidas: capa.acoes.filter((a) => a.concluida).length,
    acoesTotal: capa.acoes.length,
  }));

  return {
    linhas,
    totalAbertas: ordenadas.length - totalFechadas,
    totalFechadas,
    ocultarFechadas,
  };
}

// -------------------------------------------------- relatório mensal do cliente

export type CertificacaoResumo = {
  norma: string;
  certificadora: string;
  status: string;
  venceEm: string | null;
  statusVencimento: StatusVencimento | null;
};

export type TreinamentoVencendo = {
  nome: string;
  proximoVencimento: string;
  status: StatusVencimento;
};

export type RelatorioMensal = {
  clienteNome: string;
  produtor: string | null;
  cidadeUf: string;
  fase: string;
  conformidade: number | null;
  areas: {
    imoveis: number;
    totalHa: number;
    cafeHa: number;
    appHa: number;
    reservaHa: number;
  };
  certificacoes: CertificacaoResumo[];
  safra: RelatorioSafra;
  capasAbertas: LinhaCapaRelatorio[];
  capasFechadas: LinhaCapaRelatorio[];
  treinamentosVencendo: TreinamentoVencendo[];
};

/** Consolida o relatório mensal enviado ao produtor pela consultoria. */
export function montarRelatorioMensal(entrada: {
  cliente: Cliente;
  panorama: PanoramaTalhoes;
  capas: Capa[];
  treinamentos: TreinamentoResumo[];
  hoje?: Date;
  safraAtual?: string;
  safraAnterior?: string;
}): RelatorioMensal {
  const {
    cliente,
    panorama,
    capas,
    treinamentos,
    hoje = new Date(),
    safraAtual,
    safraAnterior,
  } = entrada;

  const imoveis = cliente.imoveis ?? [];
  const areas = {
    imoveis: imoveis.length,
    totalHa: imoveis.reduce((s, i) => s + i.areaTotalHa, 0),
    cafeHa: imoveis.reduce((s, i) => s + i.areaCafeHa, 0),
    appHa: imoveis.reduce((s, i) => s + (i.areaAppHa ?? 0), 0),
    reservaHa: imoveis.reduce((s, i) => s + (i.areaReservaHa ?? 0), 0),
  };

  const certificacoes: CertificacaoResumo[] = cliente.certificacoes.map(
    (cert) => ({
      norma: ROTULO_NORMA[cert.norma],
      certificadora: cert.certificadora ?? "—",
      status: ROTULO_STATUS_CERTIFICACAO[cert.status],
      venceEm: cert.venceEm ?? null,
      statusVencimento: cert.venceEm
        ? statusVencimento(dataMeioDia(cert.venceEm), hoje)
        : null,
    }),
  );

  const capasDoCliente = montarRelatorioCapas(
    capas.filter((capa) => capa.cliente === cliente.nome),
    false,
  );

  const treinamentosVencendo: TreinamentoVencendo[] = treinamentos
    .filter((t): t is TreinamentoResumo & { proximoVencimento: string } =>
      Boolean(t.proximoVencimento),
    )
    .map((t) => ({
      nome: t.nome,
      proximoVencimento: t.proximoVencimento,
      status: statusVencimento(dataMeioDia(t.proximoVencimento), hoje),
    }))
    .filter((t) => t.status !== "ok")
    .sort((a, b) => a.proximoVencimento.localeCompare(b.proximoVencimento));

  return {
    clienteNome: cliente.nome,
    produtor: cliente.produtor ?? null,
    cidadeUf: [cliente.cidade, cliente.uf].filter(Boolean).join("/"),
    fase: ROTULO_FASE[cliente.fase],
    conformidade: cliente.conformidade ?? null,
    areas,
    certificacoes,
    safra: montarRelatorioSafra(
      cliente.nome,
      panorama,
      safraAtual,
      safraAnterior,
    ),
    capasAbertas: capasDoCliente.linhas.filter(
      (l) => l.statusBruto !== "fechada",
    ),
    capasFechadas: capasDoCliente.linhas.filter(
      (l) => l.statusBruto === "fechada",
    ),
    treinamentosVencendo,
  };
}
