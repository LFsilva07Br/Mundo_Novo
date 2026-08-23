import { extensaoDoTipo } from "@/lib/evidencias/regras";

/**
 * Regras puras do Diferencial de Sustentabilidade / Investimentos (DS/DI):
 * totais por tipo e ano, agrupamento por cliente/ano, CSV do relatório e
 * caminho do comprovante no bucket de evidências.
 */

export type TipoPagamentoDs = "diferencial" | "investimento";

export const ROTULO_TIPO_PAGAMENTO: Record<TipoPagamentoDs, string> = {
  diferencial: "Diferencial (DS)",
  investimento: "Investimento (DI)",
};

export type PagamentoBase = {
  tipo: TipoPagamentoDs;
  valor: number;
  data: string; // ISO yyyy-mm-dd
};

export type TotalAno = {
  ano: number;
  diferencial: number;
  investimento: number;
  total: number;
};

/** Ano (número) de uma data ISO yyyy-mm-dd. */
export function anoDaData(data: string): number {
  return Number(data.slice(0, 4));
}

/** Totais de DS e DI agrupados por ano, do mais recente para o mais antigo. */
export function totaisPorTipoAno(pagamentos: PagamentoBase[]): TotalAno[] {
  const porAno = new Map<number, TotalAno>();
  for (const pagamento of pagamentos) {
    const ano = anoDaData(pagamento.data);
    const grupo = porAno.get(ano) ?? {
      ano,
      diferencial: 0,
      investimento: 0,
      total: 0,
    };
    grupo[pagamento.tipo] += pagamento.valor;
    grupo.total += pagamento.valor;
    porAno.set(ano, grupo);
  }
  return [...porAno.values()].sort((a, b) => b.ano - a.ano);
}

export type TotalClienteAno = TotalAno & {
  clienteId: string;
  cliente: string;
};

/** Totais de DS e DI por cliente e ano (linhas da tabela do painel). */
export function totaisPorClienteAno(
  pagamentos: (PagamentoBase & { clienteId: string; cliente: string })[],
): TotalClienteAno[] {
  const grupos = new Map<string, TotalClienteAno>();
  for (const pagamento of pagamentos) {
    const ano = anoDaData(pagamento.data);
    const chave = `${pagamento.clienteId}|${ano}`;
    const grupo = grupos.get(chave) ?? {
      clienteId: pagamento.clienteId,
      cliente: pagamento.cliente,
      ano,
      diferencial: 0,
      investimento: 0,
      total: 0,
    };
    grupo[pagamento.tipo] += pagamento.valor;
    grupo.total += pagamento.valor;
    grupos.set(chave, grupo);
  }
  return [...grupos.values()].sort(
    (a, b) => b.ano - a.ano || a.cliente.localeCompare(b.cliente, "pt-BR"),
  );
}

/** Quantidade de clientes distintos que já receberam DS ou DI. */
export function clientesContemplados(
  pagamentos: { clienteId: string }[],
): number {
  return new Set(pagamentos.map((p) => p.clienteId)).size;
}

// ------------------------------------------------------------------ CSV

function campoCsv(valor: string): string {
  if (/[";\n]/.test(valor)) return `"${valor.replaceAll('"', '""')}"`;
  return valor;
}

/**
 * CSV simples do relatório de pagamentos (separador ";", padrão do Excel
 * em pt-BR). Valores com ponto decimal para importação sem surpresa.
 */
export function gerarCsvPagamentos(
  pagamentos: (PagamentoBase & {
    cliente: string;
    descricao: string | null;
  })[],
): string {
  const linhas = [
    ["cliente", "tipo", "valor", "data", "descricao"].join(";"),
    ...pagamentos.map((p) =>
      [
        campoCsv(p.cliente),
        ROTULO_TIPO_PAGAMENTO[p.tipo],
        p.valor.toFixed(2),
        p.data,
        campoCsv(p.descricao ?? ""),
      ].join(";"),
    ),
  ];
  return linhas.join("\n");
}

// ---------------------------------------------------------- comprovante

/**
 * Caminho do comprovante no bucket 'evidencias', pasta ds/:
 * `ds/<clienteId>/<instante>-<sufixo>.<ext>`.
 */
export function montarCaminhoComprovante(
  clienteId: string,
  tipoArquivo: string,
  instante: number = Date.now(),
  sufixo: string = Math.random().toString(36).slice(2, 8),
): string {
  return `ds/${clienteId}/${instante}-${sufixo}.${extensaoDoTipo(tipoArquivo)}`;
}
