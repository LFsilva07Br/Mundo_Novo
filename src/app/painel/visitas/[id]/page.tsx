import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { obterVisita } from "@/lib/checklists/consultas";
import { listarFotosVisita } from "@/lib/evidencias/acoes";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { ExecucaoVisita } from "./execucao-visita";

export async function generateMetadata({
  params,
}: PageProps<"/painel/visitas/[id]">): Promise<Metadata> {
  const { id } = await params;
  const visita = await obterVisita(id);
  return { title: visita?.titulo ?? "Visita" };
}

export default async function PaginaVisita({
  params,
}: PageProps<"/painel/visitas/[id]">) {
  const { id } = await params;
  const [visita, fotos] = await Promise.all([
    obterVisita(id),
    listarFotosVisita(id),
  ]);
  if (!visita) notFound();

  return (
    <ExecucaoVisita visita={visita} fotos={fotos} modoDemo={!hasSupabaseEnv()} />
  );
}
