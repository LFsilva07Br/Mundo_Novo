"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { moverEtapa } from "@/lib/certificacao/acoes";
import type {
  MovimentoWorkflow,
  ProcessoCertificacao,
} from "@/lib/certificacao/consultas";
import {
  ETAPAS_PROCESSO,
  proximaEtapa,
  ROTULO_ETAPA,
} from "@/lib/certificacao/regras";
import { formatarData } from "@/lib/vencimentos";

type Props = {
  processos: ProcessoCertificacao[];
  movimentos: MovimentoWorkflow[];
  modoDemo: boolean;
};

export function QuadroWorkflow({ processos, movimentos, modoDemo }: Props) {
  // Estado local usado apenas no modo demonstração (simulação sem gravar);
  // conectado ao banco, a revalidação do servidor atualiza as props.
  const [processosLocais, setProcessosLocais] = useState(processos);
  const [movimentosLocais, setMovimentosLocais] = useState(movimentos);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciarTransicao] = useTransition();

  const processosExibidos = modoDemo ? processosLocais : processos;
  const movimentosExibidos = modoDemo ? movimentosLocais : movimentos;

  function avancar(processo: ProcessoCertificacao) {
    const destino = proximaEtapa(processo.etapa);
    if (!destino) return;
    setErro(null);

    if (modoDemo) {
      // Demonstração: simula o movimento localmente, nada é gravado.
      setProcessosLocais((atuais) =>
        atuais.map((p) => (p.id === processo.id ? { ...p, etapa: destino } : p)),
      );
      setMovimentosLocais((atuais) => [
        {
          id: `demo-${processo.id}-${Date.now()}`,
          cliente: processo.cliente,
          de: processo.etapa,
          para: destino,
          autor: "Simulação (modo demonstração)",
          ocorridoEm: new Date().toISOString(),
        },
        ...atuais,
      ]);
      return;
    }

    iniciarTransicao(async () => {
      const resultado = await moverEtapa(processo.id, destino);
      if (!resultado.ok) setErro(resultado.erro);
    });
  }

  return (
    <div className="space-y-6">
      {erro ? (
        <p className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          {erro}
        </p>
      ) : null}

      <div className="grid gap-3 overflow-x-auto md:grid-cols-3 xl:grid-cols-6">
        {ETAPAS_PROCESSO.map((etapa) => {
          const cartoes = processosExibidos.filter((p) => p.etapa === etapa);
          return (
            <div key={etapa} className="min-w-44 rounded-2xl bg-muted p-3">
              <p className="mb-3 flex items-center justify-between px-1 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                {ROTULO_ETAPA[etapa]}
                <span className="rounded-md bg-background px-1.5 py-0.5">
                  {cartoes.length}
                </span>
              </p>
              <div className="space-y-2">
                {cartoes.map((processo) => (
                  <Card key={processo.id} className="shadow-none">
                    <CardContent className="space-y-1.5 p-3">
                      <Link
                        href={`/painel/clientes/${processo.clienteId}`}
                        className="block text-[13px] font-bold leading-tight hover:text-primary"
                      >
                        {processo.cliente}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {processo.normas}
                        {processo.conformidade != null
                          ? ` · ${processo.conformidade}% conforme`
                          : null}
                      </p>
                      {processo.observacao ? (
                        <Badge variant="secondary" className="text-[10px]">
                          {processo.observacao}
                        </Badge>
                      ) : null}
                      {etapa !== "aprovado" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          disabled={pendente}
                          onClick={() => avancar(processo)}
                        >
                          Avançar
                          <ArrowRight className="size-3.5" />
                        </Button>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-extrabold">
          <History className="size-4 text-muted-foreground" />
          Últimos movimentos
        </p>
        {movimentosExibidos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum movimento registrado ainda — ao avançar um cliente, o
            histórico aparece aqui com data e autor.
          </p>
        ) : (
          <ul className="space-y-2">
            {movimentosExibidos.slice(0, 12).map((movimento) => (
              <li
                key={movimento.id}
                className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm"
              >
                <span className="font-bold">{movimento.cliente}</span>
                <span className="text-muted-foreground">
                  {movimento.de ? ROTULO_ETAPA[movimento.de] : "Início"}
                  {" → "}
                  <b className="text-foreground">{ROTULO_ETAPA[movimento.para]}</b>
                </span>
                <span className="text-xs text-muted-foreground">
                  · {formatarData(new Date(movimento.ocorridoEm))}
                  {movimento.autor ? ` · por ${movimento.autor}` : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
