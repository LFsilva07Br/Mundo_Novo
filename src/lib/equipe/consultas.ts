import { createClient } from "@/lib/supabase/server";
import { EQUIPE_DEMO } from "./dados-demo";
import { mapearPapelDemo, type PapelUsuario, type Perfil } from "./validacao";

/**
 * Camada de consulta da equipe (tabela `perfis`).
 * Com o Supabase conectado, lê do banco (RLS: cada um vê o próprio perfil;
 * gestor/diretoria veem todos). Sem conexão, serve a equipe de demonstração.
 */

type LinhaPerfil = {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  alcada_aprovacao: boolean;
  ativo: boolean;
};

function paraPerfil(linha: LinhaPerfil): Perfil {
  return {
    id: linha.id,
    nome: linha.nome,
    email: linha.email,
    papel: linha.papel,
    alcadaAprovacao: linha.alcada_aprovacao,
    ativo: linha.ativo,
  };
}

/** Equipe de demonstração no formato de `perfis` (somente leitura). */
export function perfisDemo(): Perfil[] {
  return EQUIPE_DEMO.map((membro) => ({
    id: membro.id,
    nome: membro.nome,
    email: membro.email ?? `${membro.id}@mundonovo.agr.br`,
    papel: mapearPapelDemo(membro.papel),
    alcadaAprovacao: membro.alcadaAprovacao,
    ativo: true,
  }));
}

export async function listarPerfis(): Promise<Perfil[]> {
  const supabase = await createClient();
  if (!supabase) return perfisDemo();

  const { data, error } = await supabase
    .from("perfis")
    .select("id, nome, email, papel, alcada_aprovacao, ativo")
    .order("nome");
  if (error) throw new Error(`Erro ao listar perfis: ${error.message}`);

  return (data as LinhaPerfil[]).map(paraPerfil);
}
