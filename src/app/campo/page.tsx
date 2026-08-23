"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  CalendarClock,
  ClipboardList,
  Download,
  Settings,
  Users,
  Zap,
} from "lucide-react";
import { BadgeVencimento } from "@/components/badge-vencimento";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listarVisitasLocais } from "@/lib/campo/banco-local";
import { baixarPacote, obterOuBaixarPacote } from "@/lib/campo/pacote";
import { saudacaoDoDia, visitasNaFila } from "@/lib/campo/regras";
import type { PacoteCampo, VisitaLocal } from "@/lib/campo/tipos";

/** Início do App de Campo: saudação, fila de envio, contadores e alertas. */
export default function PaginaInicioCampo() {
  const [pacote, setPacote] = useState<PacoteCampo | null>(null);
  const [visitas, setVisitas] = useState<VisitaLocal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [baixando, setBaixando] = useState(false);

  const carregar = useCallback(
    () =>
      Promise.all([obterOuBaixarPacote(), listarVisitasLocais()]).then(
        ([pacoteLocal, visitasLocais]) => {
          setPacote(pacoteLocal);
          setVisitas(visitasLocais);
          setCarregando(false);
        },
      ),
    [],
  );

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function baixarAgora() {
    setBaixando(true);
    try {
      await baixarPacote();
      await carregar();
    } finally {
      setBaixando(false);
    }
  }

  const naFila = visitasNaFila(visitas).length;
  const emAndamento = visitas.filter((v) => !v.concluidaEm).length;
  const alertas = (pacote?.tarefas ?? [])
    .filter((t) => t.venceEm)
    .sort((a, b) => (a.venceEm ?? "").localeCompare(b.venceEm ?? ""));

  if (carregando) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Abrindo os dados do aparelho…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {saudacaoDoDia(new Date().getHours())},{" "}
            {pacote?.usuarioNome.split(" ")[0] ?? "consultor(a)"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {pacote
              ? `Pacote de dados de ${new Date(pacote.baixadoEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}.`
              : "Nenhum pacote de dados no aparelho ainda."}
          </p>
        </div>
        <Link
          href="/campo/ajustes"
          aria-label="Ajustes"
          className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-foreground"
        >
          <Settings className="size-4" />
        </Link>
      </div>

      {!pacote ? (
        <Card className="rounded-3xl">
          <CardContent className="space-y-3 p-5 text-center">
            <p className="text-sm text-muted-foreground">
              Conecte-se à internet uma vez para baixar clientes, checklist e
              alertas — depois disso, tudo funciona offline.
            </p>
            <Button onClick={baixarAgora} disabled={baixando} className="w-full gap-2">
              <Download className="size-4" />
              {baixando ? "Baixando…" : "Baixar pacote de dados"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {naFila > 0 || emAndamento > 0 ? (
        <Link href="/campo/sync" className="block">
          <Card className="rounded-3xl border-warning/40 bg-warning/10">
            <CardContent className="p-4 text-sm font-semibold text-warning">
              {naFila > 0
                ? `${naFila} visita${naFila === 1 ? "" : "s"} aguardando envio ao escritório.`
                : `${emAndamento} visita${emAndamento === 1 ? "" : "s"} em andamento no aparelho.`}
            </CardContent>
          </Card>
        </Link>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <Card className="rounded-3xl">
          <CardContent className="p-4">
            <Users className="size-4 text-primary" />
            <p className="mt-2 text-2xl font-extrabold">
              {pacote?.clientes.length ?? 0}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              Clientes na carteira
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl">
          <CardContent className="p-4">
            <CalendarClock className="size-4 text-warning" />
            <p className="mt-2 text-2xl font-extrabold">{alertas.length}</p>
            <p className="text-xs font-semibold text-muted-foreground">
              Alertas de vencimento
            </p>
          </CardContent>
        </Card>
      </div>

      <Button
        size="lg"
        nativeButton={false}
        className="h-14 w-full gap-2 rounded-2xl text-base font-bold"
        render={<Link href="/campo/visita/nova" />}
      >
        <ClipboardList className="size-5" />
        Nova visita
      </Button>

      {alertas.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">
            Próximos vencimentos
          </h2>
          {alertas.slice(0, 3).map((tarefa) => (
            <Card key={tarefa.id} className="rounded-2xl">
              <CardContent className="space-y-1.5 p-4">
                <p className="text-sm font-bold leading-snug">
                  {tarefa.origem === "evento" ? (
                    <Zap className="mr-1 inline size-3.5 text-warning" />
                  ) : (
                    <CalendarClock className="mr-1 inline size-3.5 text-muted-foreground" />
                  )}
                  {tarefa.titulo}
                </p>
                {tarefa.clienteNome ? (
                  <p className="text-xs text-muted-foreground">{tarefa.clienteNome}</p>
                ) : null}
                <BadgeVencimento venceEm={tarefa.venceEm ?? undefined} />
              </CardContent>
            </Card>
          ))}
          {alertas.length > 3 ? (
            <Link
              href="/campo/alertas"
              className="block text-center text-sm font-semibold text-primary underline-offset-2 hover:underline"
            >
              Ver todos os {alertas.length} alertas
            </Link>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
