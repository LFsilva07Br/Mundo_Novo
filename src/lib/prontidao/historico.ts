import { listarClientes } from "@/lib/carteira/consultas";
import { listarVisitas } from "@/lib/checklists/consultas";
import { createClient } from "@/lib/supabase/server";
import { HISTORICO_CONFORMIDADE_DEMO } from "./dados-demo";

/**
 * Evolução histórica da conformidade por cliente, agregada por mês a
 * partir das visitas (auditorias internas) concluídas.
 */

export type PontoConformidade = {
  /** yyyy-mm */
  mes: string;
  /** Rótulo curto pt-BR (ex.: "ago/26"). */
  rotulo: string;
  /** Média das conformidades das visitas concluídas no mês (0-100). */
  conformidade: number;
  /** Quantidade de visitas concluídas no mês. */
  visitas: number;
};

export type SerieConformidade = {
  clienteId: string;
  clienteNome: string;
  pontos: PontoConformidade[];
};

const MESES_CURTOS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

export function rotuloMes(mes: string): string {
  const [ano, numeroMes] = mes.split("-");
  const nome = MESES_CURTOS[Number(numeroMes) - 1] ?? numeroMes;
  return `${nome}/${ano.slice(2)}`;
}

type VisitaParaHistorico = {
  status: string;
  concluidaEm: string | null;
  conformidade: number | null;
};

/**
 * Agrupa visitas concluídas por mês de conclusão, com a média da
 * conformidade de cada mês. Ordena do mês mais antigo ao mais recente.
 */
export function agruparConformidadePorMes(
  visitas: VisitaParaHistorico[],
): PontoConformidade[] {
  const porMes = new Map<string, { soma: number; visitas: number }>();

  for (const visita of visitas) {
    if (visita.status !== "concluida") continue;
    if (visita.concluidaEm === null || visita.conformidade === null) continue;
    const mes = visita.concluidaEm.slice(0, 7);
    const atual = porMes.get(mes) ?? { soma: 0, visitas: 0 };
    atual.soma += visita.conformidade;
    atual.visitas += 1;
    porMes.set(mes, atual);
  }

  return [...porMes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, valores]) => ({
      mes,
      rotulo: rotuloMes(mes),
      conformidade: Math.round(valores.soma / valores.visitas),
      visitas: valores.visitas,
    }));
}

/**
 * Séries de evolução da conformidade da carteira, uma por cliente.
 * Sem Supabase, serve o histórico de demonstração; com o banco, agrega
 * as visitas concluídas registradas no app.
 */
export async function evolucaoDaCarteira(): Promise<SerieConformidade[]> {
  const supabase = await createClient();
  const clientes = await listarClientes();

  if (!supabase) {
    return clientes
      .map((cliente) => ({
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        pontos: (HISTORICO_CONFORMIDADE_DEMO[cliente.id] ?? []).map((p) => ({
          mes: p.mes,
          rotulo: rotuloMes(p.mes),
          conformidade: p.conformidade,
          visitas: 1,
        })),
      }))
      .filter((serie) => serie.pontos.length > 0);
  }

  const series = await Promise.all(
    clientes.map(async (cliente) => {
      const visitas = await listarVisitas(cliente.id);
      return {
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        pontos: agruparConformidadePorMes(visitas),
      };
    }),
  );
  return series.filter((serie) => serie.pontos.length > 0);
}
