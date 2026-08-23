import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { capasDoProdutor } from "@/lib/portal/consultas";
import { perfilPortal } from "@/lib/portal/sessao";
import { traduzirJargao, urgenciaDaPendencia } from "@/lib/portal/traducao";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";
import { FormularioEvidenciaProdutor } from "./formulario-evidencia-produtor";

export const metadata: Metadata = {
  title: "Pendências",
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
        <p className="mt-1 text-base leading-relaxed text-muted-foreground">
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
          // UMA etiqueta só. Antes o cartão trazia severidade, status e
          // vencimento lado a lado ("Importante" + "Em correção" +
          // "Crítico"), e os três diziam coisas diferentes.
          const urgencia = urgenciaDaPendencia(capa);
          return (
            <Card key={capa.id}>
              <CardHeader>
                <span
                  className={cn(
                    "inline-flex w-fit rounded-lg px-3 py-1.5 text-sm font-extrabold",
                    urgencia.classe,
                  )}
                >
                  {urgencia.rotulo}
                </span>
                <CardTitle className="text-lg leading-snug">
                  {traduzirJargao(capa.descricao)}
                </CardTitle>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {urgencia.situacao}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* A consequência é o que faltava: sem ela o produtor não
                    sabe se isso é "um lembrete" ou "perco o certificado". */}
                <p className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/10 p-4 text-base leading-relaxed">
                  <AlertTriangle
                    className="mt-0.5 size-5 shrink-0 text-warning"
                    aria-hidden="true"
                  />
                  <span>
                    <strong className="font-extrabold">O que acontece se ficar assim: </strong>
                    {urgencia.consequencia}
                  </span>
                </p>

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
                            {traduzirJargao(acao.descricao)}
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
              {traduzirJargao(capa.descricao)}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
