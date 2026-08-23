"use client";

import { useId, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { gravarClienteSelecionado } from "@/lib/cliente-selecionado";
import { cn } from "@/lib/utils";

export type OpcaoCliente = { id: string; nome: string };

/**
 * Seletor de cliente padrão do painel.
 *
 * Nasceu para acabar com as quatro cópias divergentes do mesmo controle
 * (EUDR, Imóveis, Agroquímicos e Social): duas tinham legenda visível e
 * duas só `aria-label`; duas escapavam o id na URL e duas não; duas
 * avisavam que a troca estava em andamento e duas deixavam a tela travada
 * sem explicação. Aqui vale o melhor comportamento das quatro.
 *
 * Como adotar numa tela que hoje tem a cópia local:
 *
 * ```tsx
 * import { SeletorCliente } from "@/components/seletor-cliente";
 *
 * <SeletorCliente
 *   clientes={clientes}              // [{ id, nome }]
 *   clienteSelecionadoId={clienteId} // id vindo de ?cliente= ou do cookie
 *   rota="/painel/eudr"              // destino da navegação
 * />
 * ```
 *
 * Além de navegar, ele grava o cliente ativo no cookie
 * (`@/lib/cliente-selecionado`), que é o que faz o nome aparecer no
 * cabeçalho do painel e o que permite às outras telas abrirem já no
 * mesmo cliente.
 */
export function SeletorCliente({
  clientes,
  clienteSelecionadoId,
  rota,
  parametro = "cliente",
  legenda = "Cliente",
  className,
}: {
  clientes: OpcaoCliente[];
  clienteSelecionadoId: string;
  /** Rota de destino, sem query string (ex.: "/painel/eudr"). */
  rota: string;
  /** Nome do parâmetro na URL. */
  parametro?: string;
  legenda?: string;
  className?: string;
}) {
  const id = useId();
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Label
        htmlFor={id}
        className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground"
      >
        {legenda}
      </Label>
      <select
        id={id}
        value={clienteSelecionadoId}
        disabled={pendente}
        aria-busy={pendente}
        onChange={(evento) => {
          const clienteId = evento.target.value;
          gravarClienteSelecionado(clienteId);
          iniciarTransicao(() => {
            router.push(
              `${rota}?${parametro}=${encodeURIComponent(clienteId)}`,
            );
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
