import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarClock,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  List,
  RefreshCw,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { agendaDaSemana } from "@/lib/agenda/consultas";
import {
  chaveDia,
  dataDeChave,
  rotuloIntervalo,
  rotuloMes,
  segundaDaSemana,
  somarDias,
} from "@/lib/agenda/semana";
import { ROTULO_TIPO_PLANEJAMENTO } from "@/lib/planejamento/tipos";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";
import { executarMotorAgora } from "./acoes";
import { CartaoCompromisso } from "./cartao-compromisso";
import { GradeSemana } from "./grade-semana";
import { ListaTarefas } from "./lista-tarefas";

export const metadata: Metadata = {
  title: "Agenda",
};

type Visao = "semana" | "lista";

function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

/** Endereço compartilhável: a visão e a semana viajam na URL. */
function linkAgenda(visao: Visao, segunda: Date): string {
  return visao === "lista"
    ? "/painel/agenda?visao=lista"
    : `/painel/agenda?visao=semana&semana=${chaveDia(segunda)}`;
}

export default async function PaginaAgenda({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parametros = await searchParams;
  const visao: Visao = primeiro(parametros.visao) === "lista" ? "lista" : "semana";

  const hoje = new Date();
  const escolhida = dataDeChave(primeiro(parametros.semana));
  const segunda = segundaDaSemana(escolhida ?? hoje);

  const agenda = await agendaDaSemana(segunda, hoje);
  const intervalo = rotuloIntervalo(agenda.segunda);
  const semanaVazia = agenda.compromissos.length === 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Motor de gatilhos
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">Agenda</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Toda tarefa nasce de um dos dois motores — por{" "}
            <CalendarClock className="inline size-3.5" /> data ou por{" "}
            <Zap className="inline size-3.5" /> evento — e persiste até ser
            concluída. A visão de semana junta essas tarefas às visitas
            agendadas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AlternadorVisao visao={visao} segunda={agenda.segunda} />
          <form action={executarMotorAgora}>
            <Button variant="outline" size="sm" type="submit" className="gap-2">
              <RefreshCw className="size-3.5" />
              Rodar motor agora
            </Button>
          </form>
        </div>
      </div>

      {visao === "lista" ? (
        <ListaTarefas tarefas={agenda.tarefas} conectado={hasSupabaseEnv()} />
      ) : (
        <>
          <Card>
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Semana de {intervalo}</CardTitle>
                  <CardDescription>
                    Tarefas que vencem na semana e visitas iniciadas nela, dia
                    a dia.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Semana anterior"
                    render={
                      <Link
                        href={linkAgenda("semana", somarDias(agenda.segunda, -7))}
                      />
                    }
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    render={
                      <Link href={linkAgenda("semana", segundaDaSemana(hoje))} />
                    }
                  >
                    Hoje
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Próxima semana"
                    render={
                      <Link
                        href={linkAgenda("semana", somarDias(agenda.segunda, 7))}
                      />
                    }
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
              {semanaVazia ? (
                <p className="rounded-xl border border-dashed p-3 text-sm font-semibold text-muted-foreground">
                  Nenhum compromisso nesta semana — navegue para outra semana ou
                  veja o{" "}
                  <Link
                    href="/painel/planejamento"
                    className="text-primary underline underline-offset-4"
                  >
                    planejamento anual
                  </Link>
                  .
                </p>
              ) : null}
            </CardHeader>
            <CardContent>
              <GradeSemana
                dias={agenda.dias}
                compromissos={agenda.compromissos}
                hoje={hoje}
                intervalo={intervalo}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">
                  Sem data definida
                  {agenda.semData.length ? ` (${agenda.semData.length})` : ""}
                </CardTitle>
                <CardDescription>
                  Tarefas pendentes que ainda não têm prazo — ficam aqui para
                  não desaparecerem da agenda.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {agenda.semData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Toda tarefa pendente tem data definida.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {agenda.semData.map((tarefa) => (
                      <CartaoCompromisso key={tarefa.id} compromisso={tarefa} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Previsto para {rotuloMes(agenda.segunda)}
                </CardTitle>
                <CardDescription>
                  Planejamento anual: previsto para o mês, sem dia marcado.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {agenda.previstos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma visita prevista neste mês.
                  </p>
                ) : (
                  agenda.previstos.map((previsto) => (
                    <div
                      key={previsto.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/painel/clientes/${previsto.clienteId}`}
                          className="block truncate text-sm font-bold hover:underline"
                        >
                          {previsto.clienteNome}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {ROTULO_TIPO_PLANEJAMENTO[previsto.tipo]}
                        </p>
                      </div>
                      <Badge
                        variant={previsto.realizado ? "secondary" : "outline"}
                      >
                        {previsto.realizado ? "realizada" : "prevista"}
                      </Badge>
                    </div>
                  ))
                )}
                <Link
                  href="/painel/planejamento"
                  className="inline-block pt-1 text-xs font-bold text-primary underline underline-offset-4"
                >
                  Ver planejamento anual
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

/** Alternador Semana × Lista — a escolha fica na URL, então é compartilhável. */
function AlternadorVisao({ visao, segunda }: { visao: Visao; segunda: Date }) {
  const opcoes = [
    { chave: "semana" as const, rotulo: "Semana", Icone: CalendarRange },
    { chave: "lista" as const, rotulo: "Lista", Icone: List },
  ];

  return (
    <div
      role="group"
      aria-label="Visualização da agenda"
      className="inline-flex items-center gap-0.5 rounded-xl border bg-card p-0.5"
    >
      {opcoes.map(({ chave, rotulo, Icone }) => {
        const ativa = visao === chave;
        return (
          <Button
            key={chave}
            size="sm"
            variant={ativa ? "secondary" : "ghost"}
            aria-current={ativa ? "page" : undefined}
            className={cn("gap-1.5", ativa && "font-bold")}
            render={<Link href={linkAgenda(chave, segunda)} />}
          >
            <Icone className="size-3.5" />
            {rotulo}
          </Button>
        );
      })}
    </div>
  );
}
