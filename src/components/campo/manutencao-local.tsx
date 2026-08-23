"use client";

import { useEffect } from "react";
import { limparVisitasSincronizadas } from "@/lib/campo/banco-local";
import { garantirArmazenamentoPersistente } from "@/lib/campo/armazenamento";

/**
 * Manutenção silenciosa do banco local, na abertura do app:
 *
 * 1. pede ARMAZENAMENTO PERSISTENTE — sem isso o navegador pode apagar o
 *    IndexedDB sozinho quando o aparelho ficar sem espaço, levando junto
 *    visitas que ainda não foram enviadas ao escritório;
 * 2. remove visitas já sincronizadas há mais de 30 dias (fotos pesam).
 *
 * Nada aqui bloqueia a tela: o resultado da persistência aparece em Ajustes.
 */
export function ManutencaoLocal() {
  useEffect(() => {
    void garantirArmazenamentoPersistente();
    limparVisitasSincronizadas().catch(() => {
      // Sem IndexedDB ou banco ocupado: tenta de novo na próxima abertura.
    });
  }, []);
  return null;
}
