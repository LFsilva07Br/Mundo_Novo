"use client";

import { useRouter } from "next/navigation";

export type OpcaoCliente = { id: string; nome: string };

/** Seletor de cliente da página de agroquímicos — troca via ?cliente=id. */
export function SeletorCliente({
  clientes,
  clienteId,
}: {
  clientes: OpcaoCliente[];
  clienteId: string;
}) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm font-semibold">
      <span className="text-muted-foreground">Cliente</span>
      <select
        aria-label="Selecionar cliente"
        value={clienteId}
        onChange={(evento) =>
          router.push(`/painel/agro?cliente=${evento.target.value}`)
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
  );
}
