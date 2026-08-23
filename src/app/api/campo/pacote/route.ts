import { NextResponse } from "next/server";
import { TAREFAS_DEMO } from "@/lib/campo/dados-demo";
import type { PacoteCampo, TarefaPacote } from "@/lib/campo/tipos";
import { listarClientes } from "@/lib/carteira/consultas";
import { obterChecklistAtual } from "@/lib/checklists/consultas";
import { perfisDemo } from "@/lib/equipe/consultas";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/campo/pacote — pacote de dados do App de Campo.
 * Devolve clientes, checklist publicado e tarefas pendentes do consultor,
 * para serem gravados no IndexedDB do aparelho antes de ir a campo.
 * Em modo demonstração serve os dados locais (mesmos do painel).
 */

type LinhaTarefa = {
  id: string;
  titulo: string;
  detalhe: string | null;
  origem: TarefaPacote["origem"];
  vence_em: string | null;
  clientes: { nome: string } | null;
};

export async function GET() {
  const supabase = await createClient();

  let usuarioNome = perfisDemo()[0]?.nome ?? "Equipe Mundo Novo";
  let tarefas: TarefaPacote[] = TAREFAS_DEMO;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
    }

    const { data: perfil } = await supabase
      .from("perfis")
      .select("nome")
      .eq("id", user.id)
      .maybeSingle();
    usuarioNome =
      (perfil as { nome: string } | null)?.nome || user.email || "Consultor(a)";

    const { data: linhas, error } = await supabase
      .from("tarefas")
      .select("id, titulo, detalhe, origem, vence_em, clientes ( nome )")
      .eq("status", "pendente")
      .order("vence_em", { ascending: true, nullsFirst: false });
    if (error) {
      return NextResponse.json(
        { erro: `Erro ao listar tarefas: ${error.message}` },
        { status: 500 },
      );
    }
    tarefas = ((linhas as unknown as LinhaTarefa[]) ?? []).map((t) => ({
      id: t.id,
      titulo: t.titulo,
      detalhe: t.detalhe,
      clienteNome: t.clientes?.nome ?? null,
      origem: t.origem,
      venceEm: t.vence_em,
    }));
  }

  const [clientes, checklist] = await Promise.all([
    listarClientes(),
    obterChecklistAtual(),
  ]);

  const pacote: PacoteCampo = {
    usuarioNome,
    clientes,
    checklist,
    tarefas,
    baixadoEm: new Date().toISOString(),
  };

  return NextResponse.json(pacote);
}
