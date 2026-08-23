import type { Metadata } from "next";
import { listarClientes } from "@/lib/carteira/consultas";
import { planejamentosDoAno } from "@/lib/planejamento/consultas";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { GradePlanejamento } from "./grade-planejamento";

export const metadata: Metadata = {
  title: "Planejamento anual de visitas",
};

export default async function PaginaPlanejamento({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parametros = await searchParams;
  const anoAtual = new Date().getFullYear();
  const anoEscolhido = Number(
    Array.isArray(parametros.ano) ? parametros.ano[0] : parametros.ano,
  );
  const ano =
    Number.isInteger(anoEscolhido) && anoEscolhido >= 2020 && anoEscolhido <= 2100
      ? anoEscolhido
      : anoAtual;

  const modoDemo = !hasSupabaseEnv();
  const [clientes, planejamentos] = await Promise.all([
    listarClientes(),
    planejamentosDoAno(ano),
  ]);

  return (
    <GradePlanejamento
      ano={ano}
      clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))}
      planejamentos={planejamentos}
      modoDemo={modoDemo}
    />
  );
}
