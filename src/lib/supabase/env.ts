/**
 * O projeto sobe na Vercel antes de o Supabase ser conectado.
 * Enquanto as variáveis de ambiente não existirem, o app roda em
 * "modo demonstração": telas visíveis, autenticação desligada.
 */
export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function supabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL!;
}

export function supabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
}
