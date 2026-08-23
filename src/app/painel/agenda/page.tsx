import type { Metadata } from "next";
import { CalendarClock, RefreshCw, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatarData } from "@/lib/vencimentos";
import { concluirTarefa, executarMotorAgora } from "./acoes";

export const metadata: Metadata = {
  title: "Agenda",
};

type Tarefa = {
  id: string;
  titulo: string;
  detalhe: string | null;
  origem: "data" | "evento" | "manual";
  regra: string | null;
  vence_em: string | null;
  status: string;
  clientes: { nome: string } | null;
};

const ROTULO_ORIGEM = {
  data: { texto: "⏱ gatilho por data", classe: "bg-secondary text-secondary-foreground" },
  evento: { texto: "⚡ gatilho por evento", classe: "bg-warning/10 text-warning" },
  manual: { texto: "✍️ manual", classe: "bg-muted text-muted-foreground" },
} as const;

export default async function PaginaAgenda() {
  const supabase = await createClient();

  let tarefas: Tarefa[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("tarefas")
      .select("id, titulo, detalhe, origem, regra, vence_em, status, clientes ( nome )")
      .eq("status", "pendente")
      .order("vence_em", { ascending: true, nullsFirst: false });
    tarefas = (data as unknown as Tarefa[]) ?? [];
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Motor de gatilhos
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">Agenda</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Toda tarefa nasce de um dos dois motores — por{" "}
            <CalendarClock className="inline size-3.5" /> data ou por{" "}
            <Zap className="inline size-3.5" /> evento — e persiste até ser
            concluída.
          </p>
        </div>
        <form action={executarMotorAgora}>
          <Button variant="outline" size="sm" type="submit" className="gap-2">
            <RefreshCw className="size-3.5" />
            Rodar motor agora
          </Button>
        </form>
      </div>

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
              {supabase
                ? "Nenhuma tarefa pendente — use “Rodar motor agora” para varrer os vencimentos."
                : "Banco não conectado — as tarefas aparecem no ambiente publicado."}
            </p>
          ) : (
            tarefas.map((tarefa) => {
              const origem = ROTULO_ORIGEM[tarefa.origem] ?? ROTULO_ORIGEM.manual;
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
                        {origem.texto}
                      </span>
                      {tarefa.clientes?.nome ? (
                        <Badge variant="outline">{tarefa.clientes.nome}</Badge>
                      ) : null}
                      {tarefa.vence_em ? (
                        <span className="text-xs font-semibold text-muted-foreground">
                          vencimento{" "}
                          {formatarData(new Date(`${tarefa.vence_em}T12:00:00`))}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <form
                    action={concluirTarefa.bind(null, tarefa.id)}
                  >
                    <Button size="sm" variant="secondary" type="submit">
                      Concluir
                    </Button>
                  </form>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
