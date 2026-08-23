import type { Cliente } from "@/lib/carteira/tipos";
import type { ChecklistAtual, Resposta } from "@/lib/checklists/tipos";

/**
 * Tipos do App de Campo (PWA offline).
 *
 * O consultor baixa um PACOTE de dados (clientes, checklist publicado e
 * tarefas) antes de ir a campo; as visitas são executadas e gravadas no
 * IndexedDB do aparelho e sincronizadas quando houver internet.
 */

export type TarefaPacote = {
  id: string;
  titulo: string;
  detalhe: string | null;
  clienteNome: string | null;
  origem: "data" | "evento" | "manual";
  /** ISO yyyy-mm-dd. */
  venceEm: string | null;
};

export type PacoteCampo = {
  /** Nome de quem baixou o pacote — exibido na saudação. */
  usuarioNome: string;
  clientes: Cliente[];
  checklist: ChecklistAtual | null;
  tarefas: TarefaPacote[];
  /** ISO — quando o pacote foi baixado do servidor. */
  baixadoEm: string;
};

export type RespostaLocal = {
  itemId: string;
  resposta: Resposta;
  descricao: string | null;
};

export type FotoLocal = {
  itemId: string;
  /** JPEG redimensionado (máx. 1280px) em data URL. */
  dataUrl: string;
  /** "lat,long" ou null quando o GPS não respondeu. */
  gps: string | null;
  /** ISO. */
  tiradaEm: string;
};

export type AssinaturaLocal = {
  /** PNG do canvas de assinatura em data URL. */
  dataUrl: string;
  nome: string;
};

export type VisitaLocal = {
  /** UUID gerado no aparelho — vale até a sincronização. */
  idLocal: string;
  clienteId: string;
  clienteNome: string;
  titulo: string;
  /** Versão publicada do checklist usada na visita. */
  versaoChecklistId: string | null;
  iniciadaEm: string;
  gpsInicio: string | null;
  respostas: RespostaLocal[];
  fotos: FotoLocal[];
  assinatura: AssinaturaLocal | null;
  concluidaEm: string | null;
  gpsFim: string | null;
  /** ISO quando enviada ao servidor; null enquanto estiver na fila. */
  sincronizadaEm: string | null;
  /** Último erro de sincronização — a visita permanece na fila. */
  erroSincronizacao: string | null;
};

/** Corpo enviado ao POST /api/campo/sync (uma visita por chamada). */
export type PayloadSync = {
  idLocal: string;
  clienteId: string;
  titulo: string;
  versaoChecklistId: string | null;
  iniciadaEm: string;
  concluidaEm: string;
  gpsInicio: string | null;
  gpsFim: string | null;
  respostas: RespostaLocal[];
  fotos: FotoLocal[];
  assinatura: AssinaturaLocal | null;
};

export type ResultadoSyncVisita = {
  idLocal: string;
  titulo: string;
  ok: boolean;
  mensagem: string;
};
