"use client";

import { useEffect, useState } from "react";
import { CalendarClock, PenLine, Zap } from "lucide-react";
import { BadgeVencimento } from "@/components/badge-vencimento";
import { Card, CardContent } from "@/components/ui/card";
import { obterOuBaixarPacote } from "@/lib/campo/pacote";
import type { PacoteCampo, TarefaPacote } from "@/lib/campo/tipos";

const ETIQUETA_ORIGEM: Record<
  TarefaPacote["origem"],
  { texto: string; Icone: typeof Zap; classe: string }
> = {
  data: {
    texto: "⏱ gatilho por data",
    Icone: CalendarClock,
    classe: "bg-secondary text-secondary-foreground",
  },
  evento: {
    texto: "⚡ gatilho por evento",
    Icone: Zap,
    classe: "bg-warning/10 text-warning",
  },
  manual: {
    texto: "manual",
    Icone: PenLine,
    classe: "bg-muted text-muted-foreground",
  },
};

/** Alertas do campo: tarefas pendentes baixadas no pacote de dados. */
export default function PaginaAlertasCampo() {
  const [pacote, setPacote] = useState<PacoteCampo | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    void obterOuBaixarPacote().then((p) => {
      setPacote(p);
      setCarregando(false);
    });
  }, []);

  const tarefas = [...(pacote?.tarefas ?? [])].sort((a, b) =>
    (a.venceEm ?? "9999").localeCompare(b.venceEm ?? "9999"),
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Alertas</h1>
        <p className="text-sm text-muted-foreground">
          Tarefas pendentes da agenda — o alerta persiste até a resolução.
        </p>
      </div>

      {carregando ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Abrindo os dados do aparelho…
        </p>
      ) : tarefas.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {pacote
            ? "Nenhuma tarefa pendente no pacote — carteira em dia."
            : "Sem pacote de dados no aparelho — baixe na tela Início."}
        </p>
      ) : (
        <div className="space-y-2">
          {tarefas.map((tarefa) => {
            const etiqueta = ETIQUETA_ORIGEM[tarefa.origem] ?? ETIQUETA_ORIGEM.manual;
            return (
              <Card key={tarefa.id} className="rounded-2xl">
                <CardContent className="space-y-1.5 p-4">
                  <p className="text-sm font-bold leading-snug">{tarefa.titulo}</p>
                  {tarefa.detalhe ? (
                    <p className="text-xs text-muted-foreground">{tarefa.detalhe}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${etiqueta.classe}`}
                    >
                      {etiqueta.texto}
                    </span>
                    {tarefa.clienteNome ? (
                      <span className="rounded-lg border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {tarefa.clienteNome}
                      </span>
                    ) : null}
                  </div>
                  <BadgeVencimento venceEm={tarefa.venceEm ?? undefined} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
