"use client";

import {
  gravarUltimaSincronizacao,
  listarVisitasLocais,
  salvarVisitaLocal,
} from "./banco-local";
import { montarPayloadSync, visitasNaFila } from "./regras";
import type { ResultadoSyncVisita, VisitaLocal } from "./tipos";

/**
 * Sincronização do campo → servidor: cada visita concluída e ainda não
 * enviada vira um POST /api/campo/sync. Um erro em uma visita NÃO trava
 * a fila — o resultado é reportado por visita e a pendente fica para a
 * próxima tentativa.
 */

async function enviarVisita(visita: VisitaLocal): Promise<ResultadoSyncVisita> {
  try {
    const resposta = await fetch("/api/campo/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(montarPayloadSync(visita)),
    });

    const corpo = (await resposta.json().catch(() => null)) as {
      ok?: boolean;
      mensagem?: string;
      avisos?: string[];
    } | null;

    if (!resposta.ok || !corpo?.ok) {
      const mensagem =
        corpo?.mensagem ??
        (resposta.status === 401
          ? "Sessão expirada — entre novamente."
          : "Falha ao enviar a visita.");
      await salvarVisitaLocal({ ...visita, erroSincronizacao: mensagem });
      return { idLocal: visita.idLocal, titulo: visita.titulo, ok: false, mensagem };
    }

    const quando = new Date().toISOString();
    await salvarVisitaLocal({
      ...visita,
      sincronizadaEm: quando,
      erroSincronizacao: null,
    });
    const avisos = corpo.avisos?.length
      ? ` (${corpo.avisos.length} aviso${corpo.avisos.length === 1 ? "" : "s"})`
      : "";
    return {
      idLocal: visita.idLocal,
      titulo: visita.titulo,
      ok: true,
      mensagem: (corpo.mensagem ?? "Visita enviada.") + avisos,
    };
  } catch {
    const mensagem = "Sem conexão com o servidor — tente novamente.";
    await salvarVisitaLocal({ ...visita, erroSincronizacao: mensagem });
    return { idLocal: visita.idLocal, titulo: visita.titulo, ok: false, mensagem };
  }
}

/** Envia toda a fila; devolve o resultado por visita. */
export async function sincronizar(): Promise<ResultadoSyncVisita[]> {
  const fila = visitasNaFila(await listarVisitasLocais());
  const resultados: ResultadoSyncVisita[] = [];

  for (const visita of fila) {
    resultados.push(await enviarVisita(visita));
  }

  if (resultados.some((r) => r.ok)) {
    await gravarUltimaSincronizacao(new Date().toISOString());
  }
  return resultados;
}
