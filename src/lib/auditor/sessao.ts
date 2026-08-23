import { createClient } from "@/lib/supabase/server";

/**
 * Modo auditor externo (somente leitura).
 *
 * O auditor da certificadora recebe um login com papel `auditor` e sem
 * vínculo com cliente (`cliente_id` nulo — quem tem cliente é produtor e
 * vive no portal). Este módulo identifica esse perfil para a camada de UX;
 * a defesa definitiva continua sendo o RLS do banco.
 */

export type PerfilSessao = {
  papel?: string | null;
  clienteId?: string | null;
};

/** Regra pura: auditor é papel `auditor` sem vínculo com cliente. */
export function perfilEhAuditor(perfil: PerfilSessao | null | undefined): boolean {
  return perfil?.papel === "auditor" && !perfil.clienteId;
}

/** O usuário logado é um auditor externo? (falso em modo demonstração) */
export async function ehAuditor(): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: perfil } = (await supabase
    .from("perfis")
    .select("papel, cliente_id")
    .eq("id", user.id)
    .maybeSingle()) as {
    data: { papel: string; cliente_id: string | null } | null;
  };

  return perfilEhAuditor(
    perfil ? { papel: perfil.papel, clienteId: perfil.cliente_id } : null,
  );
}
