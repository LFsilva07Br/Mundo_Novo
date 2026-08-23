"use client";

import { useId, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";

/** Seletor de cliente da tela de Imóveis & Talhões (navega via ?cliente=id). */
export function SeletorCliente({
  clientes,
  clienteSelecionadoId,
}: {
  clientes: { id: string; nome: string }[];
  clienteSelecionadoId: string;
}) {
  const id = useId();
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Label
        htmlFor={id}
        className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground"
      >
        Cliente
      </Label>
      <select
        id={id}
        value={clienteSelecionadoId}
        disabled={pendente}
        onChange={(evento) => {
          const clienteId = evento.target.value;
          iniciarTransicao(() => {
            router.push(`/painel/imoveis?cliente=${encodeURIComponent(clienteId)}`);
          });
        }}
        className="h-8 min-w-56 rounded-lg border border-input bg-card px-2.5 text-sm font-semibold transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
      >
        {clientes.map((cliente) => (
          <option key={cliente.id} value={cliente.id}>
            {cliente.nome}
          </option>
        ))}
      </select>
    </div>
  );
}
