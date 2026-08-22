"use client";

import { useState } from "react";
import { AlertTriangle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CONTRATOS_PENDENTES_DEMO,
  EQUIPE_DEMO,
} from "@/lib/equipe/dados-demo";
import { formatarData } from "@/lib/vencimentos";

export function VisaoContratos() {
  const [usuarioId, setUsuarioId] = useState(EQUIPE_DEMO[0].id);
  const usuario = EQUIPE_DEMO.find((m) => m.id === usuarioId)!;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Administração
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Contratos & Alçada de aprovação
          </h1>
        </div>

        <label className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm font-semibold">
          <Eye className="size-4 text-muted-foreground" />
          Ver como:
          <select
            className="bg-transparent font-bold outline-none"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
          >
            {EQUIPE_DEMO.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome} {m.alcadaAprovacao ? "· com alçada" : "· sem alçada"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aguardando alçada de aprovação</CardTitle>
          <CardDescription>
            A aprovação libera o cadastro do cliente. Contratos parados há mais
            de 10 dias disparam escalonamento automático à diretoria.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {CONTRATOS_PENDENTES_DEMO.map((contrato) => (
            <div
              key={contrato.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
            >
              <div>
                <p className="flex flex-wrap items-center gap-2 font-bold">
                  {contrato.id} — {contrato.cliente}
                  <Badge variant="outline">{contrato.tipo}</Badge>
                </p>
                <p className="text-sm text-muted-foreground">
                  Solicitado por {contrato.solicitadoPor} em{" "}
                  {formatarData(new Date(`${contrato.solicitadoEm}T12:00:00`))}
                </p>
                {contrato.diasParado > 10 ? (
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-warning">
                    <AlertTriangle className="size-3.5" />
                    Parado há {contrato.diasParado} dias — escalonamento
                    disparado ({">"} 10 dias)
                  </p>
                ) : null}
              </div>

              {usuario.alcadaAprovacao ? (
                <div className="flex gap-2">
                  <Button size="sm">Aprovar</Button>
                  <Button size="sm" variant="outline">
                    Rejeitar
                  </Button>
                </div>
              ) : (
                <p className="text-xs font-semibold text-muted-foreground">
                  Somente leitura — {usuario.nome.split(" ")[0]} não possui
                  alçada
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Use o seletor “Ver como” para conferir a regra na prática: sem a
        permissão de alçada, os botões Aprovar/Rejeitar não aparecem. No
        sistema conectado, cada usuário vê apenas a própria visão.
      </p>
    </div>
  );
}
