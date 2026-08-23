"use client";

import { useEffect } from "react";

/** Registra o service worker do app de campo (casca offline). */
export function RegistrarSw() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Sem service worker (navegador antigo) o app segue funcionando online.
      });
    }
  }, []);
  return null;
}
