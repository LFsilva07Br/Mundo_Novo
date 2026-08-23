import type { SeveridadeNc, StatusCapa } from "@/lib/certificacao/consultas";

/**
 * Regras puras da gestão de auditoria externa (achados da certificadora):
 * - Prazo sugerido: a certificadora costuma dar ~10 semanas (70 dias);
 * - Achado com CAPA vinculada só fecha quando a CAPA estiver fechada;
 * - Comparativo com a auditoria interna: achado sem CAPA vinculada
 *   conta como "pego só pela externa".
 */

/** Certificadora padrão do sistema (a maioria dos clientes audita pela ALAICE). */
export const CERTIFICADORA_PADRAO = "ALAICE";

/** Prazo usual concedido pela certificadora: ~10 semanas. */
export const PRAZO_PADRAO_DIAS = 70;

export const ROTULO_STATUS_ACHADO: Record<StatusCapa, string> = {
  aberta: "Aberto",
  em_correcao: "Em correção",
  aguardando_evidencia: "Aguardando evidência",
  fechada: "✓ Fechado",
};

export const ROTULO_SEVERIDADE_ACHADO: Record<SeveridadeNc, string> = {
  menor: "Menor",
  maior: "Maior",
  critica: "Crítica",
};

/**
 * Sugere o prazo de correção: data do achado + ~10 semanas (70 dias),
 * no formato ISO (yyyy-mm-dd) usado pelos campos de data.
 */
export function sugerirPrazo(
  encontradoEm: string,
  dias: number = PRAZO_PADRAO_DIAS,
): string {
  const data = new Date(`${encontradoEm}T12:00:00`);
  data.setDate(data.getDate() + dias);
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export type ResultadoRegra = { ok: true } | { ok: false; erro: string };

/**
 * Achado com CAPA interna vinculada só fecha quando a CAPA estiver fechada —
 * fechar o achado antes do plano de ação esconderia pendência da certificadora.
 */
export function podeFecharAchado(
  capaVinculada: { status: StatusCapa } | null,
): ResultadoRegra {
  if (capaVinculada && capaVinculada.status !== "fechada") {
    return {
      ok: false,
      erro:
        "O achado só fecha quando a CAPA vinculada estiver fechada — conclua o plano de ação primeiro.",
    };
  }
  return { ok: true };
}

export type ComparativoInterna = {
  total: number;
  /** Achados vinculados a uma CAPA interna — a auditoria interna já tinha pego. */
  pegosInternamente: number;
  /** Achados sem CAPA vinculada — a certificadora achou o que a interna não pegou. */
  pegosSoPelaExterna: number;
  /** % dos achados que a auditoria interna já tinha pego antes (0–100). */
  percentualPegoInternamente: number;
};

/**
 * Indicador "o que a certificadora achou que a auditoria interna não pegou":
 * achado sem CAPA vinculada a uma NC pré-existente conta como pego só pela
 * auditoria externa.
 */
export function compararComInterna(
  achados: { capaId: string | null }[],
): ComparativoInterna {
  const total = achados.length;
  const pegosInternamente = achados.filter((a) => a.capaId !== null).length;
  const pegosSoPelaExterna = total - pegosInternamente;
  return {
    total,
    pegosInternamente,
    pegosSoPelaExterna,
    percentualPegoInternamente:
      total === 0 ? 100 : Math.round((pegosInternamente / total) * 100),
  };
}

export type ResumoPrazos = {
  abertos: number;
  noPrazo: number;
  estourados: number;
};

/** Conta, entre os achados ainda abertos, quantos estão no prazo e quantos estouraram. */
export function contarPrazos(
  achados: { status: StatusCapa; prazo: string | null }[],
  hoje: Date = new Date(),
): ResumoPrazos {
  const hojeIso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
  const abertos = achados.filter((a) => a.status !== "fechada");
  const estourados = abertos.filter(
    (a) => a.prazo !== null && a.prazo < hojeIso,
  ).length;
  return {
    abertos: abertos.length,
    noPrazo: abertos.length - estourados,
    estourados,
  };
}
