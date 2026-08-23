import { Bot, ExternalLink } from "lucide-react";
import { EstadoVazio } from "@/components/estado-vazio";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type Execucao = {
  executado_em: string;
  status: string;
  certificados_consultados: number;
  divergencias: number;
  duracao_segundos: number | null;
  log: string | null;
};

const ROTULO_STATUS: Record<string, string> = {
  sucesso: "✓ Sucesso",
  divergencia_corrigida: "✓ Divergência corrigida",
  verificacao_assistida: "👁 Verificação assistida",
  falha: "✕ Falha",
};

const PAINEL_RA =
  "https://app.powerbi.com/view?r=eyJrIjoiMmFjMjk0YzAtZTBlNy00NWNiLTk2M2YtZDJjY2NlNWFjOGM1IiwidCI6ImFkN2QzYTVkLWNkYTQtNDkyMi05MDkxLTdmOTk5ODM3MmEzYyIsImMiOjN9";

export async function CartaoRobo() {
  const supabase = await createClient();

  let execucoes: Execucao[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("execucoes_robo")
      .select(
        "executado_em, status, certificados_consultados, divergencias, duracao_segundos, log",
      )
      .order("executado_em", { ascending: false })
      .limit(5);
    execucoes = (data as Execucao[]) ?? [];
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="size-4 text-info" />
          Robô de verificação de certificados
        </CardTitle>
        <CardDescription>
          Roda todo dia às 06:00. O diretório público da Rainforest Alliance
          não expõe API (painel Power BI) e o domínio informado da ALAICE não
          existe — por isso o robô opera em <b>verificação assistida</b>:
          confirma a fonte oficial e entrega o link direto para conferência.{" "}
          <a
            href={PAINEL_RA}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-2"
          >
            Abrir diretório oficial <ExternalLink className="size-3" />
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {execucoes.length === 0 ? (
          <EstadoVazio
            semMoldura
            icone={Bot}
            titulo="Nenhuma execução registrada ainda."
            descricao="A primeira varredura automática de vencimentos roda às 06:00."
          />
        ) : (
          execucoes.map((e) => (
            <div
              key={e.executado_em}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm"
            >
              <span className="font-semibold">
                {new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(new Date(e.executado_em))}
              </span>
              <span className="text-muted-foreground">
                {e.certificados_consultados} certificados
                {e.duracao_segundos ? ` · ${e.duracao_segundos}s` : null}
              </span>
              <Badge
                variant={e.status === "falha" ? "destructive" : "secondary"}
              >
                {ROTULO_STATUS[e.status] ?? e.status}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
