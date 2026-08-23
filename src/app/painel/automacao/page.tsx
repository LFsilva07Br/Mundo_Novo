import type { Metadata } from "next";
import { Bot, CalendarClock, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listarConfiguracoes } from "@/lib/alertas/consultas";
import { listarClientes } from "@/lib/carteira/consultas";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { DISPAROS_PADRAO_DIAS } from "@/lib/vencimentos";
import { cn } from "@/lib/utils";
import { OverridesClientes } from "./overrides-clientes";

export const metadata: Metadata = {
  title: "Alertas & Automação",
};

const DISPAROS_DISPONIVEIS = [180, 150, 120, 90, 60, 30, 15, 7] as const;
/** Padrão validado com a Mundo Novo no protótipo v2. */
const DISPAROS_ATIVOS = new Set([90, 60, 30, 15, 7]);

const GATILHOS_EVENTO = [
  {
    se: "Item de checklist marcado como Não Conforme",
    entao:
      "Gera CAPA automaticamente e cria tarefa imediata na Agenda do responsável definido.",
  },
  {
    se: "Certificação avança para “Na certificadora” no workflow",
    entao:
      "Notifica o gestor do grupo e registra a data de envio para acompanhamento de prazo.",
  },
  {
    se: "Novo cliente ou contrato cadastrado",
    entao:
      "Cria pendência na fila de Contratos — só usuários com alçada veem o botão de aprovar.",
  },
  {
    se: "CAPA atinge o prazo de correção sem evidência anexada",
    entao: "Escala a tarefa para o gestor do grupo e marca como crítica.",
  },
  {
    se: "Contrato parado em aprovação por mais de 10 dias",
    entao: "Escalonamento automático à diretoria.",
  },
];

export default async function PaginaAutomacao() {
  const modoDemo = !hasSupabaseEnv();
  const [configuracoes, clientes] = await Promise.all([
    listarConfiguracoes(),
    listarClientes(),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Configuração
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Alertas & Automação
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dois motores independentes, lado a lado. Toda tarefa criada cai na
          Agenda com a etiqueta de origem.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-4 text-primary" />
              Gatilhos por proximidade de data
            </CardTitle>
            <CardDescription>
              Disparos antes do vencimento de certificados, documentos de
              imóvel, CAPAs, treinamentos e exames. O alerta persiste até a
              pendência ser resolvida.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {DISPAROS_DISPONIVEIS.map((dias) => (
                <span
                  key={dias}
                  className={cn(
                    "rounded-xl border px-3 py-1.5 text-sm font-bold",
                    DISPAROS_ATIVOS.has(dias)
                      ? "border-primary bg-secondary text-secondary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {dias} dias
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Padrão global validado com a Mundo Novo (90 · 60 · 30 · 15 · 7).
              A régua completa {DISPAROS_PADRAO_DIAS.join(" · ")} continua
              disponível, com <b>override por cliente</b> — ex.: grupo externo
              recebe cópia dos alertas para o administrador.
            </p>
            <div className="space-y-2 text-sm">
              <p className="rounded-xl bg-muted p-3">
                <b>SE</b> CAPA a 7 dias do prazo final → <b>ENTÃO</b> lembrete
                automático ao responsável
              </p>
              <p className="rounded-xl bg-muted p-3">
                <b>SE</b> documento do imóvel rural (CAR, licença, outorga)
                próximo do vencimento → <b>ENTÃO</b> tarefa de regularização
                para o gestor
              </p>
              <p className="rounded-xl bg-muted p-3">
                <b>SE</b> treinamento ou exame ocupacional vencendo →{" "}
                <b>ENTÃO</b> tarefa de capacitação para o responsável da
                fazenda
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-4 text-warning" />
              Gatilhos por evento
            </CardTitle>
            <CardDescription>
              Algo aconteceu → tarefa imediata, sem depender de calendário.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {GATILHOS_EVENTO.map((g) => (
              <div key={g.se} className="rounded-xl border p-3 text-sm">
                <p className="font-bold">⚡ {g.se}</p>
                <p className="mt-1 text-muted-foreground">→ {g.entao}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <OverridesClientes
        configuracoes={configuracoes}
        clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))}
        modoDemo={modoDemo}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="size-4 text-info" />
            Robô da certificadora (ALAICE)
          </CardTitle>
          <CardDescription>
            O MyRA/RACP não expõe API pública — um robô consultará diariamente
            às 06:00 o site da certificadora para conferir as datas de
            vencimento, atualizando a base e notificando o gestor em caso de
            divergência (verificação assistida como alternativa).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="outline">
            Estrutura pronta — ativação na Fase 8, após conexão do banco
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
