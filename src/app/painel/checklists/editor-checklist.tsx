"use client";

import { useState } from "react";
import { Camera, FileText, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ITENS_CHECKLIST_RA } from "@/lib/certificacao/dados-demo";
import { cn } from "@/lib/utils";

export function EditorChecklist() {
  const [codigoSelecionado, setCodigoSelecionado] = useState(
    ITENS_CHECKLIST_RA[1].codigo,
  );
  const item = ITENS_CHECKLIST_RA.find((i) => i.codigo === codigoSelecionado)!;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Configuração
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Editor de Checklist
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Norma Rainforest Alliance 1.4 · {ITENS_CHECKLIST_RA.length} itens ·
            todo item é vinculado ao capítulo da norma correspondente.
          </p>
        </div>
        <Badge variant="secondary">Rascunho v1.0 — publicação com o banco</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-2">
          {ITENS_CHECKLIST_RA.map((i) => (
            <button
              key={i.codigo}
              type="button"
              onClick={() => setCodigoSelecionado(i.codigo)}
              className={cn(
                "w-full rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40",
                i.codigo === codigoSelecionado &&
                  "border-primary ring-2 ring-primary/20",
              )}
            >
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                {i.codigo} · {i.capitulo}
              </p>
              <p className="mt-1 text-sm font-semibold leading-snug">
                {i.pergunta}
              </p>
              <p className="mt-2 flex flex-wrap gap-1.5">
                {i.obrigatorio ? (
                  <Badge variant="secondary" className="text-[10px]">
                    Obrigatório
                  </Badge>
                ) : null}
                <Badge variant="outline" className="text-[10px]">
                  Foto mín. {i.fotosMinimas}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  Descrição mín. {i.descricaoMinima} car.
                </Badge>
              </p>
            </button>
          ))}
        </div>

        <Card className="h-fit lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="text-base">
              Propriedades do item {item.codigo}
            </CardTitle>
            <CardDescription>
              Estas regras alimentam em tempo real o formulário de NC do app de
              campo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-3 rounded-xl bg-muted p-3">
              <Lock className="mt-0.5 size-4 text-primary" />
              <div>
                <p className="font-bold">Item obrigatório</p>
                <p className="text-muted-foreground">
                  Bloqueia o envio da visita se não respondido.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-muted p-3">
              <Camera className="mt-0.5 size-4 text-primary" />
              <div>
                <p className="font-bold">
                  Foto obrigatória em NC — mínimo {item.fotosMinimas}
                </p>
                <p className="text-muted-foreground">
                  Com GPS e horário anexados automaticamente.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-muted p-3">
              <FileText className="mt-0.5 size-4 text-primary" />
              <div>
                <p className="font-bold">
                  Descrição obrigatória — mínimo {item.descricaoMinima}{" "}
                  caracteres
                </p>
                <p className="text-muted-foreground">
                  O contador aparece em tempo real no app do consultor.
                </p>
              </div>
            </div>
            <p className="rounded-xl bg-accent/60 p-3 text-xs font-semibold text-accent-foreground">
              Referência na norma: {item.referencia}
            </p>
            <p className="text-xs text-muted-foreground">
              Alterações são versionadas e só chegam ao app após a publicação
              da nova versão do checklist.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
