import { CLIENTES_DEMO, GRUPOS_DEMO } from "./dados-demo";
import type { Cliente, Grupo } from "./tipos";

/**
 * Camada de consulta da carteira.
 * Hoje serve os dados de demonstração; quando o Supabase conectar,
 * estas funções passam a consultar o banco mantendo a mesma interface.
 */

export async function listarGrupos(): Promise<Grupo[]> {
  return GRUPOS_DEMO;
}

export async function listarClientes(): Promise<Cliente[]> {
  return [...CLIENTES_DEMO].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function obterCliente(id: string): Promise<Cliente | null> {
  return CLIENTES_DEMO.find((c) => c.id === id) ?? null;
}

export async function clientesDoGrupo(grupoId: string): Promise<Cliente[]> {
  return CLIENTES_DEMO.filter((c) => c.grupoId === grupoId);
}

export async function clientesDiretos(): Promise<Cliente[]> {
  return CLIENTES_DEMO.filter((c) => c.grupoId === null);
}
