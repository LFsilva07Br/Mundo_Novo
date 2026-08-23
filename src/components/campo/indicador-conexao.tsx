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
 *
 * Fundo SÓLIDO com texto branco (≥ 4,5:1 de contraste): sob sol forte, o
 * antigo texto colorido sobre fundo translúcido ficava ilegível. E o estado
 * OFFLINE — o que muda o comportamento do app — é o mais proeminente dos dois.
 */
export function IndicadorConexao() {
  const online = useSyncExternalStore(
    assinarConexao,
    lerConexao,
    lerConexaoNoServidor,
  );

  if (online) {
    return (
      <span
        aria-label="Conectado à internet — as visitas concluídas são enviadas na hora"
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-1",
          "text-[11px] font-semibold text-white",
        )}
      >
        <Wifi className="size-3" aria-hidden />
        online
      </span>
    );
  }

  return (
    <span
      role="status"
      aria-label="Sem internet — os dados ficam guardados no aparelho até a próxima sincronização"
      className={cn(
        "inline-flex items-center gap-2 rounded-xl bg-destructive px-3 py-1.5",
        "text-white shadow-sm",
      )}
    >
      <WifiOff className="size-5 shrink-0" aria-hidden />
      <span className="leading-tight">
        <span className="block text-sm font-extrabold uppercase tracking-wide">
          Offline
        </span>
        <span className="block text-[10px] font-semibold">
          salvo no aparelho
        </span>
      </span>
    </span>
  );
}
