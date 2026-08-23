import { createClient } from "@/lib/supabase/server";
import { normalizarAcao, resumoDoRegistro, type AcaoTrilha } from "./registro";

/**
 * Camada de consulta da trilha de auditoria (tabela `trilha_auditoria`,
 * gravada por trigger e imutável — RLS permite apenas leitura à gestão).
 * Sem Supabase (testes/modo demonstração), serve os dados locais.
 */

export type EventoTrilha = {
  id: string;
  tabela: string;
  registroId: string | null;
  acao: AcaoTrilha;
  /** Nome do autor (juntado em memória com `perfis`) ou null (sistema). */
  autor: string | null;
  /** Resumo extraído do jsonb (nome/título/número) ou null. */
  resumo: string | null;
  ocorridoEm: string; // ISO
};

export async function listarEventosTrilha(limite = 200): Promise<EventoTrilha[]> {
  const supabase = await createClient();
  if (!supabase) {
    const { TRILHA_DEMO } = await import("./dados-demo");
    return TRILHA_DEMO.slice(0, limite);
  }

  const { data, error } = await supabase
    .from("trilha_auditoria")
    .select("id, tabela, registro_id, acao, autor_id, dados, ocorrido_em")
    .order("ocorrido_em", { ascending: false })
    .limit(limite);
  if (error) throw new Error(`Erro ao ler a trilha: ${error.message}`);

  type Linha = {
    id: string;
    tabela: string;
    registro_id: string | null;
    acao: string;
    autor_id: string | null;
    dados: unknown;
    ocorrido_em: string;
  };
  const linhas = data as unknown as Linha[];

  // Segunda consulta + junção em memória: nome dos autores.
  const autorIds = [
    ...new Set(linhas.map((l) => l.autor_id).filter((id): id is string => !!id)),
  ];
  const nomes = new Map<string, string>();
  if (autorIds.length > 0) {
    const { data: perfis } = await supabase
      .from("perfis")
      .select("id, nome")
      .in("id", autorIds);
    for (const p of (perfis ?? []) as { id: string; nome: string }[]) {
      if (p.nome) nomes.set(p.id, p.nome);
    }
  }

  return linhas.map((linha) => ({
    id: linha.id,
    tabela: linha.tabela,
    registroId: linha.registro_id,
    acao: normalizarAcao(linha.acao) ?? "atualizar",
    autor: linha.autor_id ? (nomes.get(linha.autor_id) ?? "Usuário removido") : null,
    resumo: resumoDoRegistro(linha.dados),
    ocorridoEm: linha.ocorrido_em,
  }));
}
