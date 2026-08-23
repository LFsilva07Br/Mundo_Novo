import { MESES_LONGOS } from "@/lib/planejamento/tipos";

/**
 * Funções puras da semana da agenda — sem banco, sem React, sem fuso UTC.
 *
 * Toda conta usa a data local à meia-noite e o construtor `new Date(ano, mes,
 * dia)`, que normaliza sozinho a virada de mês e de ano (e sobrevive ao
 * horário de verão, ao contrário de somar milissegundos).
 *
 * A semana da agenda vai de **segunda a domingo** (padrão ISO): o domingo
 * fecha a semana que começou na segunda anterior, e não abre a seguinte.
 */

/** Segunda a domingo, na ordem em que aparecem na grade. */
export const NOMES_DIAS = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
] as const;

export const NOMES_DIAS_CURTOS = [
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
  "Dom",
] as const;

const FORMATO_CHAVE = /^\d{4}-\d{2}-\d{2}$/;

/** Mesma data, zerada à meia-noite local. */
export function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

/** Data deslocada em N dias (aceita negativo), à meia-noite local. */
export function somarDias(data: Date, dias: number): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate() + dias);
}

/** Chave "AAAA-MM-DD" no fuso local — usada na URL e no agrupamento. */
export function chaveDia(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

/**
 * Converte "AAAA-MM-DD" para data local; devolve null se o texto não for uma
 * data de verdade (a URL é digitada pelo usuário, então nada é confiável).
 */
export function dataDeChave(chave: string | null | undefined): Date | null {
  if (!chave || !FORMATO_CHAVE.test(chave)) return null;
  const [ano, mes, dia] = chave.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  const valida =
    data.getFullYear() === ano &&
    data.getMonth() === mes - 1 &&
    data.getDate() === dia;
  return valida ? data : null;
}

/** Segunda-feira da semana a que a data pertence (domingo fecha a semana). */
export function segundaDaSemana(data: Date): Date {
  // getDay(): 0 = domingo … 6 = sábado. Recuo põe a segunda no zero.
  const recuo = (data.getDay() + 6) % 7;
  return somarDias(data, -recuo);
}

/** Os sete dias da semana, de segunda a domingo. */
export function diasDaSemana(segunda: Date): Date[] {
  const inicio = inicioDoDia(segunda);
  return Array.from({ length: 7 }, (_, indice) => somarDias(inicio, indice));
}

export function mesmoDia(a: Date, b: Date): boolean {
  return chaveDia(a) === chaveDia(b);
}

/** Sábado ou domingo — exibidos de forma mais discreta na grade. */
export function ehFimDeSemana(data: Date): boolean {
  const diaSemana = data.getDay();
  return diaSemana === 0 || diaSemana === 6;
}

export type DiaAgenda<T> = {
  data: Date;
  chave: string;
  /** 0 (segunda) a 6 (domingo). */
  indice: number;
  compromissos: T[];
};

/**
 * Distribui os compromissos pelos dias informados, preservando a ordem de
 * entrada dentro de cada dia. Dias sem compromisso continuam na lista (a
 * grade precisa das sete colunas) e itens fora da semana são descartados.
 */
export function agruparPorDia<T extends { dia: string | null }>(
  compromissos: T[],
  dias: Date[],
): DiaAgenda<T>[] {
  const grupos = dias.map((data, indice) => ({
    data,
    chave: chaveDia(data),
    indice,
    compromissos: [] as T[],
  }));
  const porChave = new Map(grupos.map((grupo) => [grupo.chave, grupo]));

  for (const compromisso of compromissos) {
    if (!compromisso.dia) continue;
    porChave.get(compromisso.dia)?.compromissos.push(compromisso);
  }
  return grupos;
}

/**
 * Intervalo da semana em linguagem de negócio:
 * "18 a 24 de agosto de 2026", "31 de agosto a 6 de setembro de 2026",
 * "28 de dezembro de 2026 a 3 de janeiro de 2027".
 */
export function rotuloIntervalo(segunda: Date): string {
  const dias = diasDaSemana(segunda);
  const inicio = dias[0];
  const fim = dias[6];
  const mesInicio = MESES_LONGOS[inicio.getMonth()];
  const mesFim = MESES_LONGOS[fim.getMonth()];

  if (inicio.getFullYear() !== fim.getFullYear()) {
    return `${inicio.getDate()} de ${mesInicio} de ${inicio.getFullYear()} a ${fim.getDate()} de ${mesFim} de ${fim.getFullYear()}`;
  }
  if (inicio.getMonth() !== fim.getMonth()) {
    return `${inicio.getDate()} de ${mesInicio} a ${fim.getDate()} de ${mesFim} de ${fim.getFullYear()}`;
  }
  return `${inicio.getDate()} a ${fim.getDate()} de ${mesInicio} de ${fim.getFullYear()}`;
}

/** "Segunda-feira, 18 de agosto" — cabeçalho de seção na versão estreita. */
export function rotuloDiaCompleto(data: Date): string {
  const indice = (data.getDay() + 6) % 7;
  return `${NOMES_DIAS[indice]}, ${data.getDate()} de ${MESES_LONGOS[data.getMonth()]}`;
}

/** "18/08" — cabeçalho compacto de coluna. */
export function rotuloDiaCurto(data: Date): string {
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}`;
}

/** "agosto de 2026" — usado na faixa do planejamento previsto. */
export function rotuloMes(data: Date): string {
  return `${MESES_LONGOS[data.getMonth()]} de ${data.getFullYear()}`;
}
