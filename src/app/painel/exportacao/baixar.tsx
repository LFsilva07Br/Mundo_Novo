"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type OpcaoClienteExportacao = { id: string; nome: string };

/** Botões de download da exportação — carteira inteira ou um cliente. */
export function BotoesExportacao({
  clientes,
}: {
  clientes: OpcaoClienteExportacao[];
}) {
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? "");

  return (
    <div className="space-y-4">
      <a
        href="/api/exportacao"
        className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
      >
        <Download aria-hidden />
        Baixar carteira completa (JSON)
      </a>

      <div className="flex flex-wrap items-center gap-2">
        <label
          className="flex items-center gap-2 text-sm font-semibold"
          htmlFor="cliente-exportacao"
        >
          <span className="text-muted-foreground">Por cliente</span>
        </label>
        <select
          id="cliente-exportacao"
          aria-label="Cliente da exportação"
          value={clienteId}
          onChange={(evento) => setClienteId(evento.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm font-semibold outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <a
          href={`/api/exportacao?cliente=${clienteId}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-1.5",
          )}
        >
          <Download aria-hidden />
          Baixar este cliente
        </a>
      </div>
    </div>
  );
}
