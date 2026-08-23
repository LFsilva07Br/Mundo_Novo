import type { Metadata } from "next";
import { listarClientes } from "@/lib/carteira/consultas";
import { listarPagamentos } from "@/lib/sustentabilidade/consultas";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { VisaoSustentabilidade } from "./visao-sustentabilidade";

export const metadata: Metadata = {
  title: "Sustentabilidade — DS/DI",
};

export default async function PaginaSustentabilidade() {
  const modoDemo = !hasSupabaseEnv();
  const [pagamentos, clientes] = await Promise.all([
    listarPagamentos(),
    listarClientes(),
  ]);

  return (
    <VisaoSustentabilidade
      pagamentos={pagamentos}
      clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))}
      modoDemo={modoDemo}
    />
  );
}
