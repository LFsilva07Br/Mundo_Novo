"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Marca que o usuário logado definiu a própria senha (fim da senha
 * provisória). Usa a service key porque a RLS de perfis restringe
 * atualizações à gestão — aqui o usuário altera apenas o próprio flag.
 */
export async function confirmarTrocaSenha(): Promise<void> {
  const supabase = await createClient();
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return;

  await fetch(`${url}/rest/v1/perfis?id=eq.${user.id}`, {
    method: "PATCH",
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ deve_trocar_senha: false }),
  });
}
