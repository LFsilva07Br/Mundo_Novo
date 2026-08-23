import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Peças de carregamento do painel.
 *
 * A tela em branco durante o carregamento parece travamento. Estas peças
 * desenham a forma da tela que está vindo — cabeçalho, indicadores, tabela —
 * para a pessoa reconhecer onde está antes mesmo dos dados chegarem.
 */

export function EsqueletoCabecalho({ comAcao = true }: { comAcao?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-7 w-64" />
      </div>
      {comAcao ? <Skeleton className="h-8 w-36 rounded-lg" /> : null}
    </div>
  );
}

export function EsqueletoIndicadores({
  quantidade = 4,
  className,
}: {
  quantidade?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-4 sm:grid-cols-4", className)}>
      {Array.from({ length: quantidade }, (_, i) => (
        <Card key={i}>
          <CardContent className="space-y-2 py-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function EsqueletoTabela({
  linhas = 6,
  colunas = 4,
}: {
  linhas?: number;
  colunas?: number;
}) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-full max-w-xl" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: colunas }, (_, i) => (
            <Skeleton key={i} className="h-3 w-20" />
          ))}
        </div>
        {Array.from({ length: linhas }, (_, linha) => (
          <div
            key={linha}
            className="grid gap-3 border-t pt-3"
            style={{ gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: colunas }, (_, coluna) => (
              <Skeleton key={coluna} className="h-4 w-full max-w-32" />
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function EsqueletoCartoes({
  quantidade = 6,
  colunas = "sm:grid-cols-2 lg:grid-cols-3",
}: {
  quantidade?: number;
  colunas?: string;
}) {
  return (
    <div className={cn("grid gap-4", colunas)}>
      {Array.from({ length: quantidade }, (_, i) => (
        <Card key={i}>
          <CardContent className="space-y-3 py-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-36" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Envelope comum: avisa leitores de tela que a tela está carregando. */
export function EsqueletoTela({
  children,
  rotulo,
  className,
}: {
  children: React.ReactNode;
  /** O que está carregando, em linguagem de negócio. */
  rotulo: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={rotulo}
      className={cn("mx-auto max-w-6xl space-y-6", className)}
    >
      <span className="sr-only">{rotulo}</span>
      {children}
    </div>
  );
}
