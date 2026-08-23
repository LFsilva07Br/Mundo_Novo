import type { Metadata } from "next";
import { listarClientes } from "@/lib/carteira/consultas";
import { listarCapas } from "@/lib/certificacao/consultas";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { VisaoCapas } from "./visao-capas";

export const metadata: Metadata = {
  title: "Planos de ação — CAPA",
};

export default async function PaginaCapas() {
  const modoDemo = !hasSupabaseEnv();
  const [capas, clientes] = await Promise.all([listarCapas(), listarClientes()]);

  return (
    <VisaoCapas
      capas={capas}
      clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))}
      modoDemo={modoDemo}
    />
  );
}
