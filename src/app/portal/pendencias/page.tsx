import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BadgeVencimento } from "@/components/badge-vencimento";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SeveridadeNc, StatusCapa } from "@/lib/certificacao/consultas";
import { capasDoProdutor } from "@/lib/portal/consultas";
import { perfilPortal } from "@/lib/portal/sessao";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";
import { FormularioEvidenciaProdutor } from "./formulario-evidencia-produtor";

export const metadata: Metadata = {
  title: "Pendências",
};

const ROTULO_SEVERIDADE: Record<SeveridadeNc, { texto: string; classe: string }> =
  {
    menor: { texto: "Atenção", classe: "bg-secondary text-secondary-foreground" },
    maior: { texto: "Importante", classe: "bg-warning/10 text-warning" },
    critica: { texto: "Urgente", classe: "bg-destructive/10 text-destructive" },
  };

const ROTULO_STATUS: Record<StatusCapa, string> = {
  aberta: "Aguardando início",
  em_correcao: "Em correção",
  aguardando_evidencia: "Aguardando suas fotos",
  fechada: "Resolvida",
};

export default async function PaginaPendencias() {
  const perfil = await perfilPortal();
  if (!perfil) redirect("/painel");
  const modoDemo = !hasSupabaseEnv();

  const capas = await capasDoProdutor(perfil.nome);
  const abertas = capas.filter((capa) => capa.status !== "fechada");
  const resolvidas = capas.filter((capa) => capa.status === "fechada");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Pendências</h2>
        <p className="mt-1 text-base text-muted-foreground">
          O que precisa ser ajustado na fazenda para manter o certificado.
          Envie fotos do que já foi feito — o consultor confere o resto.
        </p>
      </div>

      {abertas.length === 0 ? (
        <p className="rounded-2xl border p-6 text-base text-muted-foreground">
          Nenhuma pendência aberta — sua fazenda está em dia!
        </p>
      ) : (
        abertas.map((capa) => {
          const severidade = ROTULO_SEVERIDADE[capa.severidade];
          return (
            <Card key={capa.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-bold",
                      severidade.classe,
                    )}
                  >
                    {severidade.texto}
                  </span>
                  <Badge variant="outline">{ROTULO_STATUS[capa.status]}</Badge>
                  {capa.prazo ? <BadgeVencimento venceEm={capa.prazo} /> : null}
                </div>
                <CardTitle className="text-lg leading-snug">
                  {capa.descricao}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {capa.acoes.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                      O que fazer
                    </p>
                    <ul className="space-y-2">
                      {capa.acoes.map((acao) => (
                        <li
                          key={acao.id}
                          className="flex items-start gap-2.5 text-base leading-relaxed"
                        >
                          {acao.concluida ? (
                            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                          ) : (
                            <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                          )}
                          <span
                            className={cn(
                              acao.concluida &&
                                "text-muted-foreground line-through",
                            )}
                          >
                            {acao.descricao}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <FormularioEvidenciaProdutor
                  capaId={capa.id}
                  acoes={capa.acoes}
                  modoDemo={modoDemo}
                />
              </CardContent>
            </Card>
          );
        })
      )}

      {resolvidas.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-lg font-extrabold">Já resolvidas</h3>
          {resolvidas.map((capa) => (
            <p
              key={capa.id}
              className="flex items-start gap-2.5 rounded-xl border p-4 text-base text-muted-foreground"
            >
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
              {capa.descricao}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
