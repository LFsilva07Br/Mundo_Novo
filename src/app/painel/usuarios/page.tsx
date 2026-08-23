import type { Metadata } from "next";
import { listarPerfis } from "@/lib/equipe/consultas";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { TabelaUsuarios } from "./tabela-usuarios";

export const metadata: Metadata = {
  title: "Usuários & Permissões",
};

export default async function PaginaUsuarios() {
  const perfis = await listarPerfis();
  const bancoConectado = hasSupabaseEnv();
  // A service key nunca chega ao navegador: aqui só dizemos se ela existe.
  const conviteDisponivel =
    bancoConectado && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Administração
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Usuários & Permissões
        </h1>
      </div>

      <TabelaUsuarios
        perfis={perfis}
        bancoConectado={bancoConectado}
        conviteDisponivel={conviteDisponivel}
      />

      <p className="text-sm text-muted-foreground">
        A alçada de aprovação de contrato é uma <b>permissão por usuário</b> —
        não é cargo nem etapa de workflow. Veja o efeito prático na tela de{" "}
        <a
          href="/painel/contratos"
          className="font-semibold text-primary underline underline-offset-2"
        >
          Contratos
        </a>
        .
      </p>
    </div>
  );
}
