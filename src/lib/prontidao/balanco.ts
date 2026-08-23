import { listarClientes } from "@/lib/carteira/consultas";
import { listarTalhoes, SAFRA_ATUAL } from "@/lib/carteira/imoveis-consultas";
import { createClient } from "@/lib/supabase/server";
import { LOTES_DEMO, PREVISOES_DEMO } from "./dados-demo";

/**
 * Balanço de volume certificado por cliente na safra atual.
 *
 * Regra de rastreabilidade (RA 1.4, cap. 2): não se pode comercializar
 * mais café certificado do que a fazenda produz. O balanço confronta a
 * previsão de safra (talhao_safras da safra atual) com as sacas já
 * registradas em lotes (status ≠ cancelado) e alerta quando estoura.
 */

export type BalancoVolume = {
  /** Previsão − lotes (negativo quando estourou). */
  saldoSacas: number;
  /** true quando os lotes superam a previsão da safra. */
  estouro: boolean;
  /** % da previsão já comprometida em lotes (null sem previsão). */
  percentualComprometido: number | null;
};

/** Função pura do balanço: previsão × sacas em lotes. */
export function calcularBalanco(
  previsaoSacas: number,
  sacasLotes: number,
): BalancoVolume {
  const saldo = previsaoSacas - sacasLotes;
  return {
    saldoSacas: Math.round(saldo * 100) / 100,
    estouro: sacasLotes > previsaoSacas,
    percentualComprometido:
      previsaoSacas > 0
        ? Math.round((sacasLotes / previsaoSacas) * 100)
        : null,
  };
}

export type BalancoCliente = BalancoVolume & {
  clienteId: string;
  clienteNome: string;
  safra: string;
  previsaoSacas: number;
  sacasLotes: number;
  totalLotes: number;
};

type LinhaLote = {
  cliente_id: string;
  sacas: number;
  status: string;
};

/** Sacas e quantidade de lotes válidos (status ≠ cancelado) por cliente. */
async function lotesPorCliente(): Promise<
  Map<string, { sacas: number; lotes: number }>
> {
  const supabase = await createClient();
  const acumulado = new Map<string, { sacas: number; lotes: number }>();

  const somar = (clienteId: string, sacas: number) => {
    const atual = acumulado.get(clienteId) ?? { sacas: 0, lotes: 0 };
    atual.sacas += sacas;
    atual.lotes += 1;
    acumulado.set(clienteId, atual);
  };

  if (!supabase) {
    for (const lote of LOTES_DEMO) {
      if (lote.status === "cancelado") continue;
      somar(lote.clienteId, lote.sacas);
    }
    return acumulado;
  }

  const { data, error } = await supabase
    .from("lotes")
    .select("cliente_id, sacas, status");
  if (error) throw new Error(`Erro ao listar lotes: ${error.message}`);

  for (const lote of data as LinhaLote[]) {
    if (lote.status === "cancelado") continue;
    somar(lote.cliente_id, Number(lote.sacas));
  }
  return acumulado;
}

/**
 * Balanço da carteira na safra atual — só clientes com previsão ou lotes.
 * Clientes em estouro vêm primeiro (alerta de rastreabilidade).
 */
export async function balancoDaCarteira(): Promise<BalancoCliente[]> {
  const supabase = await createClient();
  const [clientes, lotes] = await Promise.all([
    listarClientes(),
    lotesPorCliente(),
  ]);

  const resultados = await Promise.all(
    clientes.map(async (cliente) => {
      const panorama = await listarTalhoes(cliente.id);
      let previsao = panorama.talhoes.reduce(
        (soma, t) => soma + (t.previsaoAtualSacas ?? 0),
        0,
      );
      // Sem talhões no modo demonstração, usa a previsão demo do cliente.
      if (!supabase && previsao === 0) {
        previsao = PREVISOES_DEMO[cliente.id] ?? 0;
      }

      const doCliente = lotes.get(cliente.id) ?? { sacas: 0, lotes: 0 };
      return {
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        safra: SAFRA_ATUAL,
        previsaoSacas: Math.round(previsao * 100) / 100,
        sacasLotes: Math.round(doCliente.sacas * 100) / 100,
        totalLotes: doCliente.lotes,
        ...calcularBalanco(previsao, doCliente.sacas),
      };
    }),
  );

  return resultados
    .filter((b) => b.previsaoSacas > 0 || b.sacasLotes > 0)
    .sort((a, b) => {
      if (a.estouro !== b.estouro) return a.estouro ? -1 : 1;
      return a.clienteNome.localeCompare(b.clienteNome, "pt-BR");
    });
}
