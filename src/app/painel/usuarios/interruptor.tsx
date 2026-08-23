"use client";

import { cn } from "@/lib/utils";

/**
 * Interruptor (switch) simples e acessível para permissões binárias,
 * como a alçada de aprovação de contrato.
 */
export function Interruptor({
  ligado,
  aoAlternar,
  rotulo,
  desabilitado = false,
}: {
  ligado: boolean;
  aoAlternar: (valor: boolean) => void;
  rotulo: string;
  desabilitado?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      disabled={desabilitado}
      onClick={() => aoAlternar(!ligado)}
      className={cn(
        "inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors outline-none",
        "focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        ligado ? "border-primary bg-primary" : "border-border bg-muted",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "block size-4 rounded-full bg-background shadow-sm transition-transform",
          ligado ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
