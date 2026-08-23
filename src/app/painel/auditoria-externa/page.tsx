import type { Metadata } from "next";
import { listarAchados } from "@/lib/auditoria-externa/consultas";
import { listarClientes } from "@/lib/carteira/consultas";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { VisaoAuditoriaExterna } from "./visao-auditoria-externa";

export const metadata: Metadata = {
  title: "Auditoria externa",
};

export default async function PaginaAuditoriaExterna() {
  const modoDemo = !hasSupabaseEnv();
  const [achados, clientes] = await Promise.all([
    listarAchados(),
    listarClientes(),
  ]);

  return (
    <VisaoAuditoriaExterna
      achados={achados}
      clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))}
      modoDemo={modoDemo}
    />
  );
}
