/**
 * Funções puras da trilha de auditoria: tradução de tabelas e ações e a
 * montagem do resumo legível a partir do jsonb gravado pelo trigger.
 */

export type AcaoTrilha = "inserir" | "atualizar" | "remover";

/** O trigger grava lower(tg_op) — aceita as duas grafias por segurança. */
const ACAO_NORMALIZADA: Record<string, AcaoTrilha> = {
  insert: "inserir",
  inserir: "inserir",
  update: "atualizar",
  atualizar: "atualizar",
  delete: "remover",
  remover: "remover",
};

export function normalizarAcao(acao: string): AcaoTrilha | null {
  return ACAO_NORMALIZADA[acao.toLowerCase()] ?? null;
}

export const ROTULO_ACAO_TRILHA: Record<AcaoTrilha, string> = {
  inserir: "Criação",
  atualizar: "Alteração",
  remover: "Remoção",
};

export function rotuloAcao(acao: string): string {
  const normalizada = normalizarAcao(acao);
  return normalizada ? ROTULO_ACAO_TRILHA[normalizada] : acao;
}

/** Tabelas monitoradas pelo trigger `registrar_trilha` (migration 0011). */
export const ROTULO_TABELA_TRILHA: Record<string, string> = {
  clientes: "Clientes",
  certificacoes: "Certificações",
  contratos: "Contratos",
  capas: "CAPAs",
  checklist_versoes: "Versões de checklist",
  perfis: "Perfis de usuário",
  lotes: "Lotes",
  negociacoes: "Negociações",
  aplicacoes_defensivos: "Aplicações de defensivos",
  casos_sociais: "Casos sociais",
};

export function rotuloTabela(tabela: string): string {
  return ROTULO_TABELA_TRILHA[tabela] ?? tabela;
}

const LIMITE_RESUMO = 90;

/**
 * Resumo legível do registro: procura os campos mais identificadores do
 * jsonb (nome, título, número…) e devolve um texto curto — ou null quando
 * não há nada reconhecível.
 */
export function resumoDoRegistro(dados: unknown): string | null {
  if (dados === null || typeof dados !== "object" || Array.isArray(dados)) {
    return null;
  }
  const registro = dados as Record<string, unknown>;

  const pedacos: string[] = [];

  const numero = registro.numero ?? registro.codigo ?? registro.identificacao;
  if (typeof numero === "number") pedacos.push(`nº ${numero}`);
  else if (typeof numero === "string" && numero.trim()) pedacos.push(numero.trim());

  const texto = registro.nome ?? registro.titulo ?? registro.descricao;
  if (typeof texto === "string" && texto.trim()) pedacos.push(texto.trim());

  if (pedacos.length === 0) return null;

  const resumo = pedacos.join(" — ");
  return resumo.length > LIMITE_RESUMO
    ? `${resumo.slice(0, LIMITE_RESUMO - 1)}…`
    : resumo;
}
