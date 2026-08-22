"use client";

import { createBrowserClient } from "@supabase/ssr";
import { hasSupabaseEnv, supabaseAnonKey, supabaseUrl } from "./env";

/** Cliente Supabase para componentes de navegador. Null em modo demonstração. */
export function createClient() {
  if (!hasSupabaseEnv()) return null;
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}
