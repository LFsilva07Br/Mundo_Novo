"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MESES_LONGOS } from "./tipos";
import {
  esquemaPlanejamento,
  esquemaRemocaoPlanejamento,
  primeiroErro,
} from "./validacao";

/**
 * Ações de escrita do planejamento anual (Server Actions).
 * Sem o Supabase conectado (modo demonstração), as ações retornam um
 * aviso amigável — nada é gravado.
 */

export type EstadoAcao =
  | { ok: true; mensagem: string }
  | { ok: false; erro: string };

const ERRO_DEMO = {
  ok: false,
  erro: "O banco de dados ainda não foi conectado — no modo demonstração as alterações não são salvas.",
} as const;

/** Define (ou altera) o mês previsto do cliente no ano, por tipo de visita. */
export async function definirPlanejamento(dados: {
  clienteId: string;
  ano: number;
  mesPrevisto: number;
  tipo: string;
  observacao?: string;
}): Promise<EstadoAcao> {
  const analise = esquemaPlanejamento.safeParse(dados);
  if (!analise.success) return { ok: false, erro: primeiroErro(analise.error) };

  const supabase = await createClient();
  if (!supabase) return ERRO_DEMO;

  const plano = analise.data;
  const { error } = await supabase.from("planejamento_visitas").upsert(
    {
      cliente_id: plano.clienteId,
      ano: plano.ano,
      mes_previsto: plano.mesPrevisto,
      tipo: plano.tipo,
      observacao: plano.observacao ?? null,
    },
    { onConflict: "cliente_id,ano,tipo" },
  );
  if (error) {
    return {
      ok: false,
      erro: "Não foi possível salvar o planejamento. Tente novamente em instantes.",
    };
  }

  revalidatePath("/painel/planejamento");
  return {
    ok: true,
    mensagem: `Visita planejada para ${MESES_LONGOS[plano.mesPrevisto - 1]} de ${plano.ano}.`,
  };
}

/** Remove o planejamento do cliente no ano (por tipo de visita). */
export async function removerPlanejamento(dados: {
  clienteId: string;
  ano: number;
  tipo: string;
}): Promise<EstadoAcao> {
  const analise = esquemaRemocaoPlanejamento.safeParse(dados);
  if (!analise.success) return { ok: false, erro: primeiroErro(analise.error) };

  const supabase = await createClient();
  if (!supabase) return ERRO_DEMO;

  const plano = analise.data;
  const { error } = await supabase
    .from("planejamento_visitas")
    .delete()
    .eq("cliente_id", plano.clienteId)
    .eq("ano", plano.ano)
    .eq("tipo", plano.tipo);
  if (error) {
    return {
      ok: false,
      erro: "Não foi possível remover o planejamento. Tente novamente em instantes.",
    };
  }

  revalidatePath("/painel/planejamento");
  return { ok: true, mensagem: "Planejamento removido." };
}
