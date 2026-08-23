import { createClient } from "@/lib/supabase/server";
import type { RegistroContato } from "./tipos";

/**
 * Consulta dos registros de contato (histórico de ligações, visitas etc.).
 * Com o Supabase conectado lê do banco; sem conexão, serve dados demo.
 */

export const REGISTROS_CONTATO_DEMO: RegistroContato[] = [
  {
    id: "reg-alto-1",
    clienteId: "alto-da-serra",
    tipo: "visita",
    assunto: "Visita de acompanhamento do plano ambiental",
    detalhes:
      "Conferência das APPs e da captação de água do Sítio Alto da Serra (Garagem).",
    duracaoMinutos: 150,
    autor: "Equipe Mundo Novo",
    ocorridoEm: "2026-08-11T09:00:00-03:00",
  },
  {
    id: "reg-alto-2",
    clienteId: "alto-da-serra",
    tipo: "whatsapp",
    assunto: "Envio da lista de documentos pendentes",
    autor: "Equipe Mundo Novo",
    ocorridoEm: "2026-08-14T15:30:00-03:00",
  },
  {
    id: "reg-bernardes-1",
    clienteId: "bernardes",
    tipo: "ligacao",
    assunto: "Agendamento da auditoria interna",
    duracaoMinutos: 20,
    autor: "Equipe Mundo Novo",
    ocorridoEm: "2026-08-05T10:00:00-03:00",
  },
];

type LinhaRegistro = {
  id: string;
  cliente_id: string;
  tipo: RegistroContato["tipo"];
  assunto: string;
  detalhes: string | null;
  duracao_minutos: number | null;
  ocorrido_em: string;
  autor: { nome: string } | null;
};

/** Registros de contato do cliente, do mais recente para o mais antigo. */
export async function listarRegistrosContato(
  clienteId: string,
): Promise<RegistroContato[]> {
  const supabase = await createClient();
  if (!supabase) {
    return REGISTROS_CONTATO_DEMO.filter(
      (registro) => registro.clienteId === clienteId,
    ).sort((a, b) => b.ocorridoEm.localeCompare(a.ocorridoEm));
  }

  const { data, error } = await supabase
    .from("registros_contato")
    .select(
      "id, cliente_id, tipo, assunto, detalhes, duracao_minutos, ocorrido_em, autor:perfis ( nome )",
    )
    .eq("cliente_id", clienteId)
    .order("ocorrido_em", { ascending: false });
  if (error) {
    throw new Error(`Erro ao listar registros de contato: ${error.message}`);
  }

  return (data as unknown as LinhaRegistro[]).map((linha) => ({
    id: linha.id,
    clienteId: linha.cliente_id,
    tipo: linha.tipo,
    assunto: linha.assunto,
    detalhes: linha.detalhes ?? undefined,
    duracaoMinutos: linha.duracao_minutos ?? undefined,
    autor: linha.autor?.nome || undefined,
    ocorridoEm: linha.ocorrido_em,
  }));
}
