import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Compromisso, OrigemTarefa } from "@/lib/agenda/tipos";
import { cn } from "@/lib/utils";
import { concluirTarefa } from "./acoes";

/**
 * Cartão compacto de um compromisso — usado tanto nas colunas da grade
 * semanal quanto na faixa "Sem data definida". A cor é sempre acompanhada de
 * texto (a etiqueta de origem), para não depender de enxergar cor.
 */

export const ETIQUETA_ORIGEM: Record<
  OrigemTarefa,
  { curto: string; completo: string; classe: string; barra: string }
> = {
  data: {
    curto: "⏱ data",
    completo: "⏱ gatilho por data",
    classe: "bg-secondary text-secondary-foreground",
    barra: "border-l-primary/60",
  },
  evento: {
    curto: "⚡ evento",
    completo: "⚡ gatilho por evento",
    classe: "bg-warning/10 text-warning",
    barra: "border-l-warning",
  },
  manual: {
    curto: "✍️ manual",
    completo: "✍️ manual",
    classe: "bg-muted text-muted-foreground",
    barra: "border-l-muted-foreground/50",
  },
};

const ETIQUETA_VISITA = {
  curto: "🧭 visita",
  completo: "🧭 visita",
  classe: "bg-coffee/15 text-coffee",
  barra: "border-l-coffee",
};

export function etiquetaDe(compromisso: Compromisso) {
  if (compromisso.tipo === "visita") return ETIQUETA_VISITA;
  return ETIQUETA_ORIGEM[compromisso.origem ?? "manual"];
}

export function CartaoCompromisso({
  compromisso,
}: {
  compromisso: Compromisso;
}) {
  const etiqueta = etiquetaDe(compromisso);
  const podeConcluir = compromisso.tipo === "tarefa" && !compromisso.concluido;

  return (
    <article
      className={cn(
        "rounded-lg border border-l-4 bg-card p-2 shadow-xs",
        etiqueta.barra,
      )}
    >
      <p className="text-sm font-bold leading-snug break-words">
        {compromisso.href ? (
          <Link
            href={compromisso.href}
            className="line-clamp-2 hover:underline"
            title={compromisso.titulo}
          >
            {compromisso.titulo}
          </Link>
        ) : (
          <span className="line-clamp-2">{compromisso.titulo}</span>
        )}
      </p>
      {compromisso.clienteNome ? (
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {compromisso.clienteNome}
        </p>
      ) : null}
      <p className="mt-1.5 flex flex-wrap items-center gap-1">
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[11px] font-bold",
            etiqueta.classe,
          )}
        >
          {etiqueta.curto}
        </span>
        {compromisso.concluido ? (
          <span className="rounded-md bg-success/15 px-1.5 py-0.5 text-[11px] font-bold text-success">
            ✓ concluída
          </span>
        ) : null}
      </p>
      {podeConcluir ? (
        <form
          className="mt-1.5"
          action={concluirTarefa.bind(null, compromisso.id)}
        >
          <Button
            size="xs"
            variant="ghost"
            type="submit"
            aria-label={`Concluir tarefa: ${compromisso.titulo}`}
          >
            Concluir
          </Button>
        </form>
      ) : null}
    </article>
  );
}
