import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ETAPAS_WORKFLOW,
  WORKFLOW_DEMO,
} from "@/lib/certificacao/dados-demo";

export const metadata: Metadata = {
  title: "Workflow de Certificação",
};

export default function PaginaWorkflow() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Workflow de aprovação
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Certificações
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          As 5 etapas reais do ciclo. Ao chegar em “Na certificadora”, o motor
          de gatilhos por evento notifica automaticamente o gestor do grupo. O
          sorteio amostral é da certificadora — não é etapa nossa.
        </p>
      </div>

      <div className="grid gap-3 overflow-x-auto md:grid-cols-5">
        {ETAPAS_WORKFLOW.map((etapa) => {
          const cartoes = WORKFLOW_DEMO.filter((c) => c.etapa === etapa);
          return (
            <div key={etapa} className="min-w-44 rounded-2xl bg-muted p-3">
              <p className="mb-3 flex items-center justify-between px-1 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                {etapa}
                <span className="rounded-md bg-background px-1.5 py-0.5">
                  {cartoes.length}
                </span>
              </p>
              <div className="space-y-2">
                {cartoes.map((cartao) => (
                  <Card key={cartao.clienteId} className="shadow-none">
                    <CardContent className="space-y-1.5 p-3">
                      <Link
                        href={`/painel/clientes/${cartao.clienteId}`}
                        className="block text-[13px] font-bold leading-tight hover:text-primary"
                      >
                        {cartao.cliente}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {cartao.normas} · {cartao.conformidade}% conforme
                      </p>
                      {cartao.observacao ? (
                        <Badge variant="secondary" className="text-[10px]">
                          {cartao.observacao}
                        </Badge>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground">
        No sistema conectado, o consultor ou gestor responsável avança cada
        cliente de etapa, e todo movimento fica registrado com data e autor. A
        etapa de <b>implantação</b> do cliente acontece antes de ele entrar
        neste ciclo — fazenda em implantação não inicia auditoria.
      </p>
    </div>
  );
}
