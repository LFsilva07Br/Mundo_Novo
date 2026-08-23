import type { Metadata } from "next";
import {
  listarMovimentos,
  listarProcessos,
} from "@/lib/certificacao/consultas";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { QuadroWorkflow } from "./quadro-workflow";

export const metadata: Metadata = {
  title: "Workflow de Certificação",
};

export default async function PaginaWorkflow() {
  const [processos, movimentos] = await Promise.all([
    listarProcessos(),
    listarMovimentos(),
  ]);
  const modoDemo = !hasSupabaseEnv();

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
          As 6 etapas do ciclo — a implantação vem antes da auditoria: fazenda
          em implantação não inicia avaliação. Ao chegar em “Na certificadora”,
          o motor de gatilhos por evento cria a tarefa que notifica o gestor do
          grupo. O sorteio amostral é da certificadora — não é etapa nossa.
        </p>
      </div>

      <QuadroWorkflow
        processos={processos}
        movimentos={movimentos}
        modoDemo={modoDemo}
      />

      <p className="text-sm text-muted-foreground">
        Cada cliente avança (ou volta) uma etapa por vez — pular etapas é
        bloqueado pelo sistema — e todo movimento fica registrado com data e
        autor.
      </p>
    </div>
  );
}
