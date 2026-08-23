import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CLIENTES_DEMO } from "@/lib/carteira/dados-demo";
import {
  PRAZO_RESPOSTA_DIAS,
  faixaUuidDoProtocolo,
  protocoloDaQueixa,
} from "./protocolo";

/**
 * Regras do canal público de queixas (RA 1.5.1) que valem tanto para a
 * página quanto para a API. Ficam juntas aqui para não existir o buraco que
 * havia antes: a página aceitava qualquer endereço e a API respondia
 * "recebido" no modo demonstração — o relato do trabalhador sumia.
 */

/** Cliente do banco em produção; sem env, a lista de demonstração. */
export function servicoSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return null;
  return createServiceClient(url, service, { auth: { persistSession: false } });
}

export type ClienteDoCanal = { id: string; nome: string };

/**
 * Confere se o endereço do canal existe de verdade.
 * `null` = endereço inválido: a tela NÃO pode mostrar o formulário e a API
 * NÃO pode responder "recebido" (o relato iria para o vazio).
 */
export async function clienteDoCanal(
  clienteId: string,
): Promise<ClienteDoCanal | null> {
  const supabase = servicoSupabase();
  if (!supabase) {
    const demo = CLIENTES_DEMO.find((c) => c.id === clienteId);
    return demo ? { id: demo.id, nome: demo.nome } : null;
  }

  const { data, error } = await supabase
    .from("clientes")
    .select("id, nome")
    .eq("id", clienteId)
    .maybeSingle();
  if (error || !data) return null;
  return { id: String(data.id), nome: String(data.nome) };
}

// ------------------------------------------------------------------
// Consulta anônima por protocolo
// ------------------------------------------------------------------

export type SituacaoQueixa = "recebida" | "em_analise" | "tratada";

export type ConsultaProtocolo = {
  protocolo: string;
  situacao: SituacaoQueixa;
  rotulo: string;
  explicacao: string;
  recebidoEm: string | null; // ISO
};

const ROTULO_SITUACAO: Record<SituacaoQueixa, { rotulo: string; explicacao: string }> =
  {
    recebida: {
      rotulo: "Recebido",
      explicacao:
        "Seu relato chegou à equipe de certificação e entrou na fila de análise. Ninguém da fazenda tem acesso a ele.",
    },
    em_analise: {
      rotulo: "Em apuração",
      explicacao:
        "A equipe de certificação está apurando o que você contou. Isso pode incluir uma visita à fazenda — sem dizer quem falou.",
    },
    tratada: {
      rotulo: "Resolvido",
      explicacao:
        "A equipe de certificação concluiu a apuração e registrou o que foi feito. Se o problema continuar, faça um novo relato.",
    },
  };

/**
 * Busca a situação do relato pelo código anotado no papel.
 *
 * De propósito NÃO devolve o texto do relato nem o contato: se o código cair
 * na mão errada (o patrão acha o papel no bolso), a pessoa vê apenas
 * "recebido/em apuração/resolvido" — nada que identifique quem falou nem o
 * que foi dito.
 */
export async function consultarPorProtocolo(
  codigo: string,
): Promise<ConsultaProtocolo | null> {
  const faixa = faixaUuidDoProtocolo(codigo);
  if (!faixa) return null;

  const supabase = servicoSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("queixas")
    .select("id, status, criado_em")
    .gte("id", faixa.de)
    .lte("id", faixa.ate)
    .limit(1);
  if (error || !data || data.length === 0) return null;

  const linha = data[0] as { id: string; status: SituacaoQueixa; criado_em: string };
  const textos = ROTULO_SITUACAO[linha.status] ?? ROTULO_SITUACAO.recebida;
  return {
    protocolo: protocoloDaQueixa(linha.id),
    situacao: linha.status,
    rotulo: textos.rotulo,
    explicacao: textos.explicacao,
    recebidoEm: linha.criado_em ?? null,
  };
}

/** Rótulo/explicação de uma situação, para a tela montar o texto. */
export function textosDaSituacao(situacao: SituacaoQueixa) {
  return ROTULO_SITUACAO[situacao] ?? ROTULO_SITUACAO.recebida;
}

export { PRAZO_RESPOSTA_DIAS };
