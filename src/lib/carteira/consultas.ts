import { createClient } from "@/lib/supabase/server";
import { CLIENTES_DEMO, GRUPOS_DEMO } from "./dados-demo";
import type {
  Certificacao,
  Cliente,
  ContatoCliente,
  Grupo,
  ImovelRural,
} from "./tipos";

/**
 * Camada de consulta da carteira.
 * Com o Supabase conectado, lê do banco (RLS garante acesso só à equipe);
 * sem conexão (testes/modo demonstração), serve os dados locais.
 */

const SELECT_CLIENTE = `
  id, grupo_id, nome, tipo, fase, produtor, cidade, uf, regiao, conformidade,
  certificacoes ( norma, certificadora, principal, status, vence_em ),
  contatos_cliente ( nome, area, telefone, email ),
  imoveis_rurais (
    nome, proprietarios, car, matriculas,
    area_total_ha, area_cafe_ha, area_app_ha, area_reserva_ha,
    possui_captacao_agua
  )
`;

type LinhaCliente = {
  id: string;
  grupo_id: string | null;
  nome: string;
  tipo: Cliente["tipo"];
  fase: Cliente["fase"];
  produtor: string | null;
  cidade: string | null;
  uf: string | null;
  regiao: string | null;
  conformidade: number | null;
  certificacoes: {
    norma: Certificacao["norma"];
    certificadora: string | null;
    principal: boolean;
    status: Certificacao["status"];
    vence_em: string | null;
  }[];
  contatos_cliente: {
    nome: string;
    area: ContatoCliente["area"];
    telefone: string | null;
    email: string | null;
  }[];
  imoveis_rurais: {
    nome: string;
    proprietarios: string | null;
    car: string | null;
    matriculas: string | null;
    area_total_ha: number;
    area_cafe_ha: number;
    area_app_ha: number;
    area_reserva_ha: number;
    possui_captacao_agua: boolean;
  }[];
};

function paraCliente(linha: LinhaCliente): Cliente {
  const imoveis: ImovelRural[] = linha.imoveis_rurais.map((i) => ({
    nome: i.nome,
    proprietarios: i.proprietarios ?? undefined,
    car: i.car ?? undefined,
    matriculas: i.matriculas ?? undefined,
    areaTotalHa: Number(i.area_total_ha),
    areaCafeHa: Number(i.area_cafe_ha),
    areaAppHa: Number(i.area_app_ha),
    areaReservaHa: Number(i.area_reserva_ha),
    possuiCaptacaoAgua: i.possui_captacao_agua,
  }));

  return {
    id: linha.id,
    grupoId: linha.grupo_id,
    nome: linha.nome,
    tipo: linha.tipo,
    fase: linha.fase,
    produtor: linha.produtor ?? undefined,
    cidade: linha.cidade ?? "",
    uf: linha.uf ?? "",
    regiao: linha.regiao ?? "",
    conformidade: linha.conformidade ?? undefined,
    certificacoes: linha.certificacoes.map((c) => ({
      norma: c.norma,
      certificadora: c.certificadora ?? undefined,
      principal: c.principal,
      status: c.status,
      venceEm: c.vence_em ?? undefined,
    })),
    contatos: linha.contatos_cliente.length
      ? linha.contatos_cliente.map((c) => ({
          nome: c.nome,
          area: c.area,
          telefone: c.telefone ?? undefined,
          email: c.email ?? undefined,
        }))
      : undefined,
    imoveis: imoveis.length ? imoveis : undefined,
  };
}

export async function listarGrupos(): Promise<Grupo[]> {
  const supabase = await createClient();
  if (!supabase) return GRUPOS_DEMO;

  const { data, error } = await supabase
    .from("grupos")
    .select("id, nome, administracao, nome_administrador, cidade, uf")
    .order("nome");
  if (error) throw new Error(`Erro ao listar grupos: ${error.message}`);

  return data.map((g) => ({
    id: g.id,
    nome: g.nome,
    administracao: g.administracao,
    nomeAdministrador: g.nome_administrador ?? undefined,
    cidade: g.cidade ?? undefined,
    uf: g.uf ?? undefined,
  }));
}

export async function listarClientes(): Promise<Cliente[]> {
  const supabase = await createClient();
  if (!supabase) {
    return [...CLIENTES_DEMO].sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    );
  }

  const { data, error } = await supabase
    .from("clientes")
    .select(SELECT_CLIENTE)
    .order("nome");
  if (error) throw new Error(`Erro ao listar clientes: ${error.message}`);

  return (data as unknown as LinhaCliente[]).map(paraCliente);
}

export async function obterCliente(id: string): Promise<Cliente | null> {
  const supabase = await createClient();
  if (!supabase) return CLIENTES_DEMO.find((c) => c.id === id) ?? null;

  const { data, error } = await supabase
    .from("clientes")
    .select(SELECT_CLIENTE)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Erro ao obter cliente: ${error.message}`);

  return data ? paraCliente(data as unknown as LinhaCliente) : null;
}

export async function clientesDoGrupo(grupoId: string): Promise<Cliente[]> {
  const clientes = await listarClientes();
  return clientes.filter((c) => c.grupoId === grupoId);
}

export async function clientesDiretos(): Promise<Cliente[]> {
  const clientes = await listarClientes();
  return clientes.filter((c) => c.grupoId === null);
}
