"use client";

import { useEffect } from "react";
import { limparVisitasSincronizadas } from "@/lib/campo/banco-local";

/**
 * Manutenção silenciosa do banco local: ao abrir o app, remove visitas já
 * sincronizadas há mais de 30 dias (fotos pesam). Não bloqueia nada —
 * qualquer erro é ignorado e a limpeza fica para a próxima abertura.
 */
export function ManutencaoLocal() {
  useEffect(() => {
    limparVisitasSincronizadas().catch(() => {
      // Sem IndexedDB ou banco ocupado: tenta de novo na próxima abertura.
    });
  }, []);
  return null;
}
