import { createClient } from "@/lib/supabase/server";
import type { SeveridadeNc, StatusCapa } from "@/lib/certificacao/consultas";
import { ACHADOS_DEMO } from "./dados-demo";
import {
  compararComInterna as compararComInternaPuro,
  type ComparativoInterna,
} from "./regras";

/**
 * Camada de consulta da gestão de auditoria externa (achados da certificadora).
 * Com o Supabase conectado, lê do banco (RLS garante acesso só à equipe);
 * sem conexão (testes/modo demonstração), serve os dados locais.
 */

export type AchadoExterno = {
  id: string;
  clienteId: string;
  cliente: string;
  certificadora: string | null;
  codigo: string | null;
  itemNorma: string | null;
  descricao: string;
  severidade: SeveridadeNc;
  prazo: string | null; // ISO yyyy-mm-dd
  status: StatusCapa;
  capaId: string | null;
  capaNumero: number | null;
  capaStatus: StatusCapa | null;
  encontradoEm: string; // ISO yyyy-mm-dd
};

export async function listarAchados(): Promise<AchadoExterno[]> {
  const supabase = await createClient();
  if (!supabase) {
    return ACHADOS_DEMO.map((achado) => ({
      id: achado.id,
      clienteId: achado.clienteId,
      cliente: achado.cliente,
      certificadora: achado.certificadora,
      codigo: achado.codigo,
      itemNorma: achado.itemNorma,
      descricao: achado.descricao,
      severidade: achado.severidade,
      prazo: achado.prazo,
      status: achado.status,
      capaId: achado.capaNumero !== null ? `capa-${achado.capaNumero}` : null,
      capaNumero: achado.capaNumero,
      capaStatus: achado.capaStatus,
      encontradoEm: achado.encontradoEm,
    }));
  }

  const { data, error } = await supabase
    .from("achados_externos")
    .select(
      "id, certificadora, codigo, item_norma, descricao, severidade, prazo, status, capa_id, encontrado_em, clientes ( id, nome ), capa:capas ( numero, status )",
    )
    .order("encontrado_em", { ascending: false });
  if (error) throw new Error(`Erro ao listar achados externos: ${error.message}`);

  type Linha = {
    id: string;
    certificadora: string | null;
    codigo: string | null;
    item_norma: string | null;
    descricao: string;
    severidade: SeveridadeNc;
    prazo: string | null;
    status: StatusCapa;
    capa_id: string | null;
    encontrado_em: string;
    clientes: { id: string; nome: string } | null;
    capa: { numero: number; status: StatusCapa } | null;
  };

  return (data as unknown as Linha[]).map((linha) => ({
    id: linha.id,
    clienteId: linha.clientes?.id ?? "",
    cliente: linha.clientes?.nome ?? "Cliente removido",
    certificadora: linha.certificadora,
    codigo: linha.codigo,
    itemNorma: linha.item_norma,
    descricao: linha.descricao,
    severidade: linha.severidade,
    prazo: linha.prazo,
    status: linha.status,
    capaId: linha.capa_id,
    capaNumero: linha.capa?.numero ?? null,
    capaStatus: linha.capa?.status ?? null,
    encontradoEm: linha.encontrado_em,
  }));
}

/**
 * Indicador do comparativo com a auditoria interna: quantos achados a
 * certificadora pegou que a interna não tinha pego (achados sem CAPA vinculada).
 */
export async function compararComInterna(): Promise<ComparativoInterna> {
  const achados = await listarAchados();
  return compararComInternaPuro(achados);
}
