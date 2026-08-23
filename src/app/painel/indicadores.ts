import type { Certificacao, Cliente } from "@/lib/carteira/tipos";
import { diasAte } from "@/lib/vencimentos";

/**
 * Cálculos dos indicadores do dashboard.
 *
 * Ficam separados da tela porque é aqui que mora o risco do painel:
 * um número errado no topo faz a equipe planejar o mês errado.
 */

export type ResumoVencimentos = {
  /** Certificados cuja data já passou. */
  vencidas: number;
  /** Certificados que vencem de hoje até 90 dias (não inclui os vencidos). */
  vencendo90: number;
  /** Vencidos + a vencer em 90 dias: o que exige ação neste trimestre. */
  exigemAcao: number;
};

/**
 * Separa o que já venceu do que está para vencer.
 *
 * Antes, o cartão "Vencendo em 90 dias" contava só o que ainda não venceu
 * e escondia os vencidos numa linha de rodapé — quem batia o olho lia 3
 * quando o trabalho real era 7. Vencido e a vencer são urgências
 * diferentes, então viram dois números.
 */
export function resumoVencimentos(
  certificacoes: readonly Pick<Certificacao, "venceEm">[],
  hoje: Date = new Date(),
): ResumoVencimentos {
  let vencidas = 0;
  let vencendo90 = 0;

  for (const cert of certificacoes) {
    if (!cert.venceEm) continue;
    const dias = diasAte(new Date(`${cert.venceEm}T12:00:00`), hoje);
    if (dias < 0) vencidas += 1;
    else if (dias <= 90) vencendo90 += 1;
  }

  return { vencidas, vencendo90, exigemAcao: vencidas + vencendo90 };
}

export type ResumoCarteira = {
  clientes: number;
  grupos: number;
  diretos: number;
  /** Frase pronta para o cartão, ex.: "3 grupos + 1 cliente direto". */
  detalhe: string;
};

function plural(quantidade: number, singular: string, plural: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

/**
 * Composição da carteira contada a partir dos clientes.
 * O texto era fixo ("3 grupos + cliente direto") e mentiria no dia em que
 * a Mundo Novo ganhasse o quarto grupo.
 */
export function resumoCarteira(
  clientes: readonly Pick<Cliente, "grupoId">[],
): ResumoCarteira {
  const grupos = new Set(
    clientes.map((c) => c.grupoId).filter((id): id is string => Boolean(id)),
  ).size;
  const diretos = clientes.filter((c) => !c.grupoId).length;

  const partes = [plural(grupos, "grupo", "grupos")];
  if (diretos > 0) {
    partes.push(plural(diretos, "cliente direto", "clientes diretos"));
  }

  return {
    clientes: clientes.length,
    grupos,
    diretos,
    detalhe: partes.join(" + "),
  };
}

/**
 * Normas presentes na carteira, em texto ("RA · 4C · Orgânico").
 * O cartão exibia essa lista fixa mesmo quando a carteira tinha outra.
 */
export function resumoNormas(
  certificacoes: readonly Pick<Certificacao, "norma">[],
  rotulos: Record<string, string>,
): string {
  const normas = [...new Set(certificacoes.map((c) => c.norma))];
  if (normas.length === 0) return "nenhuma certificação cadastrada";
  return normas.map((norma) => rotulos[norma] ?? norma).join(" · ");
}
