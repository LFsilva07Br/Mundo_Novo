import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { VisaoEmails, type EnvioEmailLinha } from "./visao-emails";

export const metadata: Metadata = {
  title: "E-mails enviados",
};

/** Últimos 50 registros de envios_email (mais recentes primeiro). */
async function listarEnvios(): Promise<EnvioEmailLinha[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("envios_email")
    .select("id, criado_em, destinatario, assunto, origem, status, erro")
    .order("criado_em", { ascending: false })
    .limit(50);

  return (data ?? []) as EnvioEmailLinha[];
}

export default async function PaginaEmails() {
  const modoDemo = !hasSupabaseEnv();
  const envios = await listarEnvios();

  return <VisaoEmails envios={envios} modoDemo={modoDemo} />;
}
