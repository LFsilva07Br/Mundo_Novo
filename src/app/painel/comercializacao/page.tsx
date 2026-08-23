import type { Metadata } from "next";
import { listarClientes } from "@/lib/carteira/consultas";
import { listarLotes, listarSafras } from "@/lib/comercializacao/consultas";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { VisaoComercializacao } from "./visao-comercializacao";

export const metadata: Metadata = {
  title: "Comercialização",
};

export default async function PaginaComercializacao() {
  const modoDemo = !hasSupabaseEnv();
  const [lotes, clientes, safras] = await Promise.all([
    listarLotes(),
    listarClientes(),
    listarSafras(),
  ]);

  return (
    <VisaoComercializacao
      lotes={lotes}
      clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))}
      safras={safras}
      modoDemo={modoDemo}
    />
  );
}
