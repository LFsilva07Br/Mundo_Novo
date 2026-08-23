import type { ItemVersao, Resposta } from "@/lib/checklists/tipos";
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

/** Ids dos itens marcados como não conforme. */
export function itensComNaoConformidade(
  respostas: Pick<RespostaLocal, "itemId" | "resposta">[],
): Set<string> {
  return new Set(
    respostas.filter((r) => r.resposta === "nao_conforme").map((r) => r.itemId),
  );
}

/**
 * Fotos que realmente vão ao escritório: só evidenciam NÃO CONFORMIDADES.
 *
 * Se o consultor tirou fotos, mudou a resposta para conforme/N.A. e seguiu
 * em frente, as fotos continuam guardadas no aparelho (para o caso de ele
 * voltar atrás), mas NÃO podem viajar escondidas no envio — do outro lado
 * elas apareceriam sem nenhuma não conformidade que as explique.
 */
export function fotosParaEnvio(
  respostas: Pick<RespostaLocal, "itemId" | "resposta">[],
  fotos: FotoLocal[],
): FotoLocal[] {
  const comNc = itensComNaoConformidade(respostas);
  return fotos.filter((f) => comNc.has(f.itemId));
}

/**
 * Fotos guardadas no aparelho que hoje não seriam enviadas, porque o item
 * deixou de ser não conformidade. A tela avisa o consultor — nada some sem
 * ele saber.
 */
export function fotosGuardadasSemNc(
  respostas: Pick<RespostaLocal, "itemId" | "resposta">[],
  fotos: FotoLocal[],
): FotoLocal[] {
  const comNc = itensComNaoConformidade(respostas);
  return fotos.filter((f) => !comNc.has(f.itemId));
}

/**
 * Troca a resposta de um item PRESERVANDO o que já foi digitado.
 *
 * Ao sair de "não conforme", a descrição não é apagada: ela vai para
 * `descricaoGuardada` e volta inteira se o consultor marcar NC de novo.
 * Debaixo de sol e com luvas, um toque errado não pode custar um laudo.
 */
export function aplicarResposta(
  respostas: RespostaLocal[],
  itemId: string,
  resposta: Resposta,
): RespostaLocal[] {
  const anterior = respostas.find((r) => r.itemId === itemId);
  const guardadaAnterior = anterior?.descricaoGuardada ?? null;

  const nova: RespostaLocal =
    resposta === "nao_conforme"
      ? {
          itemId,
          resposta,
          // Volta o que estava guardado quando o item deixou de ser NC.
          descricao: anterior?.descricao ?? guardadaAnterior ?? "",
          descricaoGuardada: null,
        }
      : {
          itemId,
          resposta,
          descricao: null,
          descricaoGuardada: anterior?.descricao?.trim()
            ? anterior.descricao
            : guardadaAnterior,
        };

  return respostas.map((r) => (r.itemId === itemId ? nova : r)).concat(
    anterior ? [] : [nova],
  );
}

export type DivergenciaVersao = {
  /** O checklist do pacote mudou depois que a visita começou. */
  divergente: boolean;
  /** Respostas já dadas cujo item não existe mais no checklist atual. */
  respostasOrfas: number;
  /** Fotos já tiradas cujo item não existe mais no checklist atual. */
  fotosOrfas: number;
};

/**
 * A visita nasce presa a uma versão publicada do checklist. Se o pacote de
 * dados for atualizado no meio do caminho, os itens da tela passam a ser de
 * outra versão e as respostas já gravadas somem da vista — parecem perdidas.
 * Isto detecta o caso para a tela avisar, em vez de fingir que nada houve.
 */
export function divergenciaDeVersao(
  visita: Pick<VisitaLocal, "versaoChecklistId" | "respostas" | "fotos">,
  versaoAtualId: string | null,
  itens: Pick<ItemVersao, "id">[],
): DivergenciaVersao {
  const idsAtuais = new Set(itens.map((i) => i.id));
  const respostasOrfas = visita.respostas.filter(
    (r) => !idsAtuais.has(r.itemId),
  ).length;
  const fotosOrfas = visita.fotos.filter((f) => !idsAtuais.has(f.itemId)).length;
  const versaoTrocou =
    visita.versaoChecklistId !== null &&
    versaoAtualId !== null &&
    visita.versaoChecklistId !== versaoAtualId;

  return {
    divergente: versaoTrocou || respostasOrfas > 0 || fotosOrfas > 0,
    respostasOrfas,
    fotosOrfas,
  };
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
 * Só visitas concluídas podem ser enviadas. Fotos de itens que deixaram de
 * ser não conformidade ficam no aparelho e NÃO entram no envio.
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
    fotos: fotosParaEnvio(visita.respostas, visita.fotos).map((f) => ({
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
