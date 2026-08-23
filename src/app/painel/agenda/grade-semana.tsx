import {
  agruparPorDia,
  ehFimDeSemana,
  mesmoDia,
  NOMES_DIAS_CURTOS,
  rotuloDiaCompleto,
  rotuloDiaCurto,
} from "@/lib/agenda/semana";
import type { Compromisso } from "@/lib/agenda/tipos";
import { cn } from "@/lib/utils";
import { CartaoCompromisso } from "./cartao-compromisso";

/**
 * Grade da semana: segunda a domingo.
 *
 * É uma `<table>` de verdade (com `role` explícito), então o leitor de tela
 * anuncia "coluna Quarta-feira" ao caminhar pelos cartões. Em telas estreitas
 * o CSS troca a tabela por blocos empilhados — um dia embaixo do outro, com
 * o dia virando cabeçalho de seção — para nunca haver rolagem horizontal.
 */

type Props = {
  dias: Date[];
  compromissos: Compromisso[];
  hoje: Date;
  intervalo: string;
};

/** Contagem sempre em texto — cor sozinha não informa nada. */
function contador(quantidade: number): string {
  if (quantidade === 0) return "sem compromissos";
  return quantidade === 1 ? "1 compromisso" : `${quantidade} compromissos`;
}

export function GradeSemana({ dias, compromissos, hoje, intervalo }: Props) {
  const grupos = agruparPorDia(compromissos, dias);

  return (
    <table
      role="table"
      className="block w-full border-collapse md:table md:table-fixed"
    >
      <caption className="sr-only">
        Compromissos de {intervalo}, de segunda a domingo.
      </caption>
      <thead role="rowgroup" className="hidden md:table-header-group">
        <tr role="row">
          {grupos.map((grupo) => {
            const ehHoje = mesmoDia(grupo.data, hoje);
            return (
              <th
                role="columnheader"
                scope="col"
                key={grupo.chave}
                className={cn(
                  "w-1/7 border-b px-1.5 pb-2 text-left align-bottom",
                  ehFimDeSemana(grupo.data) && "text-muted-foreground",
                  ehHoje && "border-b-2 border-b-primary",
                )}
              >
                <span className="block text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  {NOMES_DIAS_CURTOS[grupo.indice]}
                </span>
                <span className="flex flex-wrap items-baseline gap-1.5">
                  <span className="text-lg font-extrabold leading-tight">
                    {rotuloDiaCurto(grupo.data)}
                  </span>
                  {ehHoje ? (
                    <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-primary-foreground">
                      hoje
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-[11px] font-semibold text-muted-foreground">
                  {contador(grupo.compromissos.length)}
                </span>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody role="rowgroup" className="block md:table-row-group">
        <tr role="row" className="block md:table-row">
          {grupos.map((grupo) => {
            const ehHoje = mesmoDia(grupo.data, hoje);
            const fimDeSemana = ehFimDeSemana(grupo.data);
            return (
              <td
                role="cell"
                key={grupo.chave}
                className={cn(
                  "mb-4 block rounded-xl p-1.5 align-top last:mb-0 md:mb-0 md:w-1/7 md:table-cell md:rounded-none md:border-r md:last:border-r-0",
                  fimDeSemana && "md:bg-muted/40",
                  ehHoje && "bg-secondary/50 md:bg-secondary/50",
                )}
              >
                <h3
                  className={cn(
                    "mb-2 flex flex-wrap items-baseline gap-2 border-b pb-1 text-sm font-extrabold md:hidden",
                    fimDeSemana && "text-muted-foreground",
                  )}
                >
                  {rotuloDiaCompleto(grupo.data)}
                  {ehHoje ? (
                    <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-primary-foreground">
                      hoje
                    </span>
                  ) : null}
                  <span className="text-xs font-semibold text-muted-foreground">
                    {contador(grupo.compromissos.length)}
                  </span>
                </h3>
                {grupo.compromissos.length === 0 ? (
                  <p className="px-1 py-1.5 text-xs text-muted-foreground/70">
                    Nada agendado.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {grupo.compromissos.map((compromisso) => (
                      <CartaoCompromisso
                        key={`${compromisso.tipo}-${compromisso.id}`}
                        compromisso={compromisso}
                      />
                    ))}
                  </div>
                )}
              </td>
            );
          })}
        </tr>
      </tbody>
    </table>
  );
}
