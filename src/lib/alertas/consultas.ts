import { createClient } from "@/lib/supabase/server";

/**
 * Camada de consulta dos overrides de régua de alertas por cliente.
 * Com o Supabase conectado, lê de config_alertas_cliente (join com o
 * nome do cliente); sem conexão (modo demonstração), serve um exemplo
 * local somente leitura.
 */

export type ConfigAlertaCliente = {
  clienteId: string;
  clienteNome: string;
  dias: number[];
  copiaAdminGrupo: boolean;
  atualizadoEm: string | null;
};

/** Exemplo exibido no modo demonstração (nada é gravado). */
export const CONFIGS_DEMO: ConfigAlertaCliente[] = [
  {
    clienteId: "expocaccer",
    clienteNome: "Expocaccer",
    dias: [180, 120, 60, 30, 7],
    copiaAdminGrupo: true,
    atualizadoEm: null,
  },
];

type LinhaConfig = {
  cliente_id: string;
  dias: number[];
  copia_admin_grupo: boolean;
  atualizado_em: string | null;
  clientes: { nome: string } | null;
};

export async function listarConfiguracoes(): Promise<ConfigAlertaCliente[]> {
  const supabase = await createClient();
  if (!supabase) return CONFIGS_DEMO;

  const { data, error } = await supabase
    .from("config_alertas_cliente")
    .select("cliente_id, dias, copia_admin_grupo, atualizado_em, clientes ( nome )");
  if (error) {
    throw new Error(`Erro ao listar configurações de alerta: ${error.message}`);
  }

  return (data as unknown as LinhaConfig[])
    .map((linha) => ({
      clienteId: linha.cliente_id,
      clienteNome: linha.clientes?.nome ?? "Cliente sem nome",
      dias: [...linha.dias].sort((a, b) => b - a),
      copiaAdminGrupo: linha.copia_admin_grupo,
      atualizadoEm: linha.atualizado_em,
    }))
    .sort((a, b) => a.clienteNome.localeCompare(b.clienteNome, "pt-BR"));
}
