"use client";

import { useSyncExternalStore } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

function assinarConexao(avisar: () => void) {
  window.addEventListener("online", avisar);
  window.addEventListener("offline", avisar);
  return () => {
    window.removeEventListener("online", avisar);
    window.removeEventListener("offline", avisar);
  };
}

const lerConexao = () => navigator.onLine;
const lerConexaoNoServidor = () => true;

/**
 * Indicador online/offline do App de Campo — ouve os eventos do navegador
 * e mostra ao consultor se as visitas serão enviadas agora ou ficarão na fila.
 */
export function IndicadorConexao() {
  const online = useSyncExternalStore(
    assinarConexao,
    lerConexao,
    lerConexaoNoServidor,
  );

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
        online
          ? "bg-success/15 text-success"
          : "bg-warning/15 text-warning",
      )}
    >
      {online ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
      {online ? "Online" : "Offline — dados ficam no aparelho"}
    </span>
  );
}
