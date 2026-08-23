import { createClient } from "@/lib/supabase/server";

/**
 * Sessão do Portal do Produtor.
 *
 * Um perfil com `cliente_id` preenchido é um PRODUTOR (usuário do portal):
 * as políticas RLS da migration 0010 restringem tudo o que ele enxerga aos
 * dados do próprio cliente. Perfil sem `cliente_id` é equipe (painel).
 */

export type PerfilPortal = {
  /** Id do cliente ao qual o produtor está vinculado. */
  clienteId: string;
  /** Nome da fazenda/cliente para exibir no topo do portal. */
  nome: string;
};

/** Cliente exibido no modo demonstração (sem Supabase conectado). */
export const PERFIL_PORTAL_DEMO: PerfilPortal = {
  clienteId: "alto-da-serra",
  nome: "Fazenda Alto da Serra",
};

/**
 * Retorna o vínculo de portal do usuário logado, ou null se o perfil for
 * de equipe (sem `cliente_id`) ou não houver sessão. Em modo demonstração
 * devolve a Fazenda Alto da Serra para permitir conhecer as telas.
 */
export async function perfilPortal(): Promise<PerfilPortal | null> {
  const supabase = await createClient();
  if (!supabase) return PERFIL_PORTAL_DEMO;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("perfis")
    .select("cliente_id, cliente:clientes ( nome )")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !data) return null;

  const linha = data as unknown as {
    cliente_id: string | null;
    cliente: { nome: string } | { nome: string }[] | null;
  };
  if (!linha.cliente_id) return null;

  const cliente = Array.isArray(linha.cliente) ? linha.cliente[0] : linha.cliente;
  return {
    clienteId: linha.cliente_id,
    nome: cliente?.nome ?? "Minha fazenda",
  };
}
