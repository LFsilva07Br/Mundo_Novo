import type { ComponentType, ReactNode } from "react";
import { Inbox } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type PropsIcone = { className?: string; "aria-hidden"?: boolean };

export type PropsEstadoVazio = {
  /** Frase curta que diz o que está faltando. Ex.: "Nenhum cliente ainda." */
  titulo: string;
  /** Explica o porquê e como sair do vazio — linguagem de negócio. */
  descricao?: ReactNode;
  /** Ícone (lucide). Padrão: caixa de entrada vazia. */
  icone?: ComponentType<PropsIcone>;
  /** Botão ou link que resolve o vazio. */
  acao?: ReactNode;
  /** Sem a moldura tracejada — para vazios dentro de blocos já emoldurados. */
  semMoldura?: boolean;
  className?: string;
};

/**
 * Estado vazio padrão do painel: ícone, o que falta e o que fazer a respeito.
 *
 * Lista vazia sem explicação parece defeito. Aqui a tela sempre diz se está
 * vazia porque ainda não há registro ou porque o filtro escondeu tudo.
 */
export function EstadoVazio({
  titulo,
  descricao,
  icone: Icone = Inbox,
  acao,
  semMoldura = false,
  className,
}: PropsEstadoVazio) {
  return (
    <div
      data-slot="estado-vazio"
      className={cn(
        "flex flex-col items-center gap-2 px-6 py-10 text-center",
        !semMoldura && "rounded-xl border border-dashed border-border",
        className,
      )}
    >
      <Icone className="size-8 text-muted-foreground" aria-hidden />
      <p className="text-sm font-semibold">{titulo}</p>
      {descricao ? (
        <p className="max-w-md text-sm text-muted-foreground">{descricao}</p>
      ) : null}
      {acao ? <div className="mt-1">{acao}</div> : null}
    </div>
  );
}

export type PropsEstadoVazioLinha = PropsEstadoVazio & {
  /** Quantas colunas a linha deve ocupar (total do cabeçalho da tabela). */
  colunas: number;
};

/**
 * Mesmo estado vazio, porém como linha de tabela — mantém o cabeçalho visível
 * para a pessoa entender quais colunas existiriam ali.
 */
export function EstadoVazioLinha({
  colunas,
  className,
  ...props
}: PropsEstadoVazioLinha) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colunas} className="p-0">
        <EstadoVazio {...props} semMoldura className={cn("py-8", className)} />
      </TableCell>
    </TableRow>
  );
}
