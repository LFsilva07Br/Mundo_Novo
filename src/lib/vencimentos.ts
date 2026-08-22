/**
 * Regras de vencimento definidas na especificação do produto:
 * - alerta Crítico a 30 dias ou menos do vencimento;
 * - alerta Atenção a 120 dias ou menos;
 * - vencido quando a data já passou;
 * - disparos padrão em 180/150/120/90/60/30 dias (configuráveis pelo gestor).
 */

export type StatusVencimento = "vencido" | "critico" | "atencao" | "ok";

export const DISPAROS_PADRAO_DIAS = [180, 150, 120, 90, 60, 30] as const;

const MS_POR_DIA = 86_400_000;

/** Dias entre hoje e a data (negativo se já passou). Ignora horário. */
export function diasAte(data: Date, hoje: Date = new Date()): number {
  const inicioDia = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((inicioDia(data) - inicioDia(hoje)) / MS_POR_DIA);
}

export function statusVencimento(
  vencimento: Date,
  hoje: Date = new Date(),
): StatusVencimento {
  const dias = diasAte(vencimento, hoje);
  if (dias < 0) return "vencido";
  if (dias <= 30) return "critico";
  if (dias <= 120) return "atencao";
  return "ok";
}

export function rotuloStatusVencimento(status: StatusVencimento): string {
  switch (status) {
    case "vencido":
      return "Vencido";
    case "critico":
      return "Crítico";
    case "atencao":
      return "Atenção";
    case "ok":
      return "OK";
  }
}

/**
 * Marcos de disparo já atingidos para um vencimento — o alerta persiste
 * até a pendência ser resolvida, então todo marco cruzado permanece ativo.
 */
export function disparosAtingidos(
  vencimento: Date,
  hoje: Date = new Date(),
  disparos: readonly number[] = DISPAROS_PADRAO_DIAS,
): number[] {
  const dias = diasAte(vencimento, hoje);
  return disparos.filter((marco) => dias <= marco);
}

export function formatarData(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(data);
}

export function formatarArea(hectares: number): string {
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(hectares)} ha`;
}
