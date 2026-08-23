"use client";

import { useRouter } from "next/navigation";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export type OpcaoClienteDossie = { id: string; nome: string };

/** Barra do dossiê: seletor de cliente e botão de imprimir. */
export function BarraDossie({
  clientes,
  clienteId,
}: {
  clientes: OpcaoClienteDossie[];
  clienteId: string;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <label className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-muted-foreground">Cliente</span>
        <select
          aria-label="Selecionar cliente do dossiê"
          value={clienteId}
          onChange={(evento) =>
            router.push(`/painel/dossie?cliente=${evento.target.value}`)
          }
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm font-semibold outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>
      <Button size="sm" variant="outline" onClick={() => window.print()}>
        <Printer aria-hidden />
        Imprimir dossiê
      </Button>
    </div>
  );
}
