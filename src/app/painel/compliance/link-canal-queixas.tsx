"use client";

import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { SelectNativo } from "@/components/select-nativo";

export type OpcaoClienteCanal = { id: string; nome: string };

/**
 * Cartaz do canal de queixas: cada cliente tem um link público próprio
 * (/queixa/[clienteId]) para imprimir no quadro de avisos da fazenda.
 * O botão copia o link pronto para divulgar.
 */
export function LinkCanalQueixas({
  clientes,
  clienteInicial,
}: {
  clientes: OpcaoClienteCanal[];
  clienteInicial: string;
}) {
  const [clienteId, setClienteId] = useState(clienteInicial);
  const [copiado, setCopiado] = useState(false);

  function linkDoCanal(): string {
    const origem = typeof window !== "undefined" ? window.location.origin : "";
    return `${origem}/queixa/${clienteId}`;
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(linkDoCanal());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Navegador sem permissão de clipboard — o link segue visível abaixo.
    }
  }

  return (
    <div className="space-y-3">
      <SelectNativo
        aria-label="Cliente do canal de queixas"
        value={clienteId}
        onChange={(evento) => setClienteId(evento.target.value)}
      >
        {clientes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </SelectNativo>

      <p className="break-all rounded-lg bg-muted px-2.5 py-1.5 font-mono text-xs text-muted-foreground">
        /queixa/{clienteId}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={copiar}>
          <Copy className="size-4" />
          {copiado ? "Link copiado!" : "Copiar link do canal de queixas"}
        </Button>
        <a
          href={`/queixa/${clienteId}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ExternalLink className="size-4" />
          Abrir página
        </a>
      </div>
      {copiado ? (
        <p role="status" className="text-xs font-medium text-primary">
          Link copiado — cole no cartaz, no grupo da fazenda ou no quadro de
          avisos.
        </p>
      ) : null}
    </div>
  );
}
