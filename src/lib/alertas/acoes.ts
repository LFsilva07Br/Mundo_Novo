"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  esquemaConfigAlerta,
  normalizarRegua,
  primeiroErro,
} from "./validacao";

/**
 * Ações de escrita dos overrides de régua de alertas (Server Actions).
 * Sem o Supabase conectado (modo demonstração), retornam um aviso
 * amigável — nada é gravado.
 */

export type EstadoAcao =
  | { ok: true; mensagem: string }
  | { ok: false; erro: string }
  | null;

const ERRO_DEMO = {
  ok: false,
  erro: "O banco de dados ainda não foi conectado — no modo demonstração as alterações não são salvas.",
} as const;

export async function salvarConfiguracaoCliente(
  clienteId: string,
  dias: number[],
  copiaAdminGrupo: boolean,
): Promise<EstadoAcao> {
  const analise = esquemaConfigAlerta.safeParse({
    clienteId,
    dias,
    copiaAdminGrupo,
  });
  if (!analise.success) return { ok: false, erro: primeiroErro(analise.error) };

  const supabase = await createClient();
  if (!supabase) return ERRO_DEMO;

  const dados = analise.data;
  const { error } = await supabase.from("config_alertas_cliente").upsert(
    {
      cliente_id: dados.clienteId,
      dias: normalizarRegua(dados.dias),
      copia_admin_grupo: dados.copiaAdminGrupo,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "cliente_id" },
  );
  if (error) {
    return {
      ok: false,
      erro: "Não foi possível salvar a régua do cliente. Tente novamente em instantes.",
    };
  }

  revalidatePath("/painel/automacao");
  return { ok: true, mensagem: "Régua do cliente salva." };
}

export async function removerConfiguracao(
  clienteId: string,
): Promise<EstadoAcao> {
  if (!clienteId?.trim()) return { ok: false, erro: "Cliente não identificado." };

  const supabase = await createClient();
  if (!supabase) return ERRO_DEMO;

  const { error } = await supabase
    .from("config_alertas_cliente")
    .delete()
    .eq("cliente_id", clienteId);
  if (error) {
    return {
      ok: false,
      erro: "Não foi possível remover o override. Tente novamente em instantes.",
    };
  }

  revalidatePath("/painel/automacao");
  return {
    ok: true,
    mensagem: "Override removido — o cliente volta à régua padrão.",
  };
}
