import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { hasSupabaseEnv, supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Retorna null em modo demonstração (Supabase ainda não conectado).
 */
export async function createClient() {
  if (!hasSupabaseEnv()) return null;

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Chamado a partir de um Server Component — o proxy renova a sessão.
        }
      },
    },
  });
}

export async function getUsuarioAtual() {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
