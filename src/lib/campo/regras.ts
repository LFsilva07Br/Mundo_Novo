import type { ItemVersao } from "@/lib/checklists/tipos";
import {
  itensObrigatoriosPendentes,
  tamanhoDescricao,
} from "@/lib/checklists/regras";
import type {
  FotoLocal,
  PayloadSync,
  RespostaLocal,
  VisitaLocal,
} from "./tipos";

/**
 * Regras puras do App de Campo — validação de conclusão da visita,
 * cálculo do redimensionamento de fotos e montagem do payload de envio.
 * Sem dependência de navegador: tudo aqui roda em teste e no servidor.
 */

/** Lado máximo (px) das fotos de evidência gravadas no aparelho. */
export const LADO_MAXIMO_FOTO = 1280;

/**
 * Novas dimensões de uma imagem limitada a `maximo` px no maior lado,
 * preservando a proporção. Imagens menores não são ampliadas.
 */
export function calcularDimensoesFoto(
  largura: number,
  altura: number,
  maximo: number = LADO_MAXIMO_FOTO,
): { largura: number; altura: number } {
  if (largura <= 0 || altura <= 0) return { largura: 0, altura: 0 };
  const maiorLado = Math.max(largura, altura);
  if (maiorLado <= maximo) return { largura, altura };

  const fator = maximo / maiorLado;
  return {
    largura: Math.max(1, Math.round(largura * fator)),
    altura: Math.max(1, Math.round(altura * fator)),
  };
}

/** Fotos já anexadas a um item da visita. */
export function fotosDoItem(fotos: FotoLocal[], itemId: string): FotoLocal[] {
  return fotos.filter((f) => f.itemId === itemId);
}

/** Progresso da visita: respondidos / total de itens (0 a 100). */
export function progressoVisita(
  itens: Pick<ItemVersao, "id">[],
  respostas: Pick<RespostaLocal, "itemId">[],
): number {
  if (itens.length === 0) return 0;
  const ids = new Set(itens.map((i) => i.id));
  const respondidos = respostas.filter((r) => ids.has(r.itemId)).length;
  return Math.round((respondidos / itens.length) * 100);
}

export type PendenciaConclusao = {
  codigoItem: string;
  motivo: string;
};

export type ResultadoConclusaoCampo =
  | { ok: true }
  | { ok: false; pendencias: PendenciaConclusao[] };

/**
 * A visita de campo só pode ser concluída quando:
 * - todos os itens obrigatórios foram respondidos;
 * - toda não conformidade tem descrição com o mínimo do item;
 * - toda não conformidade tem o mínimo de fotos exigido pelo item.
 */
export function validarConclusaoCampo(
  itens: ItemVersao[],
  respostas: RespostaLocal[],
  fotos: FotoLocal[],
): ResultadoConclusaoCampo {
  const pendencias: PendenciaConclusao[] = [];

  for (const pendente of itensObrigatoriosPendentes(itens, respostas)) {
    pendencias.push({
      codigoItem: pendente.codigo,
      motivo: "Item obrigatório sem resposta.",
    });
  }

  const porId = new Map(itens.map((i) => [i.id, i]));
  for (const resposta of respostas) {
    if (resposta.resposta !== "nao_conforme") continue;
    const item = porId.get(resposta.itemId);
    if (!item) continue;

    const tamanho = tamanhoDescricao(resposta.descricao);
    if (tamanho < item.descricaoMinima) {
      pendencias.push({
        codigoItem: item.codigo,
        motivo:
          `Descrição da não conformidade com ${tamanho} caracteres — ` +
          `o mínimo é ${item.descricaoMinima}.`,
      });
    }

    const anexadas = fotosDoItem(fotos, item.id).length;
    if (anexadas < item.fotosMinimas) {
      pendencias.push({
        codigoItem: item.codigo,
        motivo:
          `${anexadas} foto${anexadas === 1 ? "" : "s"} anexada${anexadas === 1 ? "" : "s"} — ` +
          `o mínimo é ${item.fotosMinimas}.`,
      });
    }
  }

  if (pendencias.length > 0) return { ok: false, pendencias };
  return { ok: true };
}

/**
 * Monta o corpo do POST /api/campo/sync a partir da visita local.
 * Só visitas concluídas podem ser enviadas.
 */
export function montarPayloadSync(visita: VisitaLocal): PayloadSync {
  if (!visita.concluidaEm) {
    throw new Error("Apenas visitas concluídas podem ser sincronizadas.");
  }
  return {
    idLocal: visita.idLocal,
    clienteId: visita.clienteId,
    titulo: visita.titulo,
    versaoChecklistId: visita.versaoChecklistId,
    iniciadaEm: visita.iniciadaEm,
    concluidaEm: visita.concluidaEm,
    gpsInicio: visita.gpsInicio,
    gpsFim: visita.gpsFim,
    respostas: visita.respostas.map((r) => ({
      itemId: r.itemId,
      resposta: r.resposta,
      descricao: r.descricao,
    })),
    fotos: visita.fotos.map((f) => ({
      itemId: f.itemId,
      dataUrl: f.dataUrl,
      gps: f.gps,
      tiradaEm: f.tiradaEm,
    })),
    assinatura: visita.assinatura
      ? { dataUrl: visita.assinatura.dataUrl, nome: visita.assinatura.nome }
      : null,
  };
}

/** Visitas prontas para envio: concluídas e ainda não sincronizadas. */
export function visitasNaFila(visitas: VisitaLocal[]): VisitaLocal[] {
  return visitas.filter((v) => v.concluidaEm !== null && !v.sincronizadaEm);
}

/** Tamanho em bytes formatado para leitura (ex.: "12,3 MB"). */
export function formatarBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const unidades = ["KB", "MB", "GB", "TB"] as const;
  let valor = bytes;
  let unidade: string = "B";
  for (const proxima of unidades) {
    valor /= 1024;
    unidade = proxima;
    if (valor < 1024) break;
  }
  return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${unidade}`;
}

/** Saudação conforme a hora local do aparelho. */
export function saudacaoDoDia(hora: number): string {
  if (hora >= 5 && hora < 12) return "Bom dia";
  if (hora >= 12 && hora < 18) return "Boa tarde";
  return "Boa noite";
}
