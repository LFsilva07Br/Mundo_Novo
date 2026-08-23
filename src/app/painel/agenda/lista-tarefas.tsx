import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Compromisso } from "@/lib/agenda/tipos";
import { formatarData } from "@/lib/vencimentos";
import { concluirTarefa } from "./acoes";
import { ETIQUETA_ORIGEM } from "./cartao-compromisso";

/**
 * Visualização em lista — a tela original da agenda, mantida como
 * alternativa à grade semanal: todas as tarefas pendentes numa fila só,
 * das mais próximas de vencer às sem prazo.
 */
export function ListaTarefas({
  tarefas,
  conectado,
}: {
  tarefas: Compromisso[];
  conectado: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Tarefas pendentes{tarefas.length ? ` (${tarefas.length})` : ""}
        </CardTitle>
        <CardDescription>
          O motor roda automaticamente todos os dias às 06:00 e cruza os
          vencimentos de certificados, documentos de imóveis, outorgas,
          treinamentos e CAPAs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tarefas.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {conectado
              ? "Nenhuma tarefa pendente — use “Rodar motor agora” para varrer os vencimentos."
              : "Banco não conectado — as tarefas aparecem no ambiente publicado."}
          </p>
        ) : (
          tarefas.map((tarefa) => {
            const origem = ETIQUETA_ORIGEM[tarefa.origem ?? "manual"];
            return (
              <div
                key={tarefa.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-snug">{tarefa.titulo}</p>
                  {tarefa.detalhe ? (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {tarefa.detalhe}
                    </p>
                  ) : null}
                  <p className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${origem.classe}`}
                    >
                      {origem.completo}
                    </span>
                    {tarefa.clienteNome ? (
                      <Badge variant="outline">{tarefa.clienteNome}</Badge>
                    ) : null}
                    {tarefa.dia ? (
                      <span className="text-xs font-semibold text-muted-foreground">
                        vencimento{" "}
                        {formatarData(new Date(`${tarefa.dia}T12:00:00`))}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-muted-foreground">
                        sem data definida
                      </span>
                    )}
                  </p>
                </div>
                <form action={concluirTarefa.bind(null, tarefa.id)}>
                  <Button
                    size="sm"
                    variant="secondary"
                    type="submit"
                    aria-label={`Concluir tarefa: ${tarefa.titulo}`}
                  >
                    Concluir
                  </Button>
                </form>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
