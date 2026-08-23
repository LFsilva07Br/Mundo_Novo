import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogOut, Sprout } from "lucide-react";
import { sair } from "@/app/login/actions";
import { Toaster } from "@/components/ui/sonner";
import { perfilPortal } from "@/lib/portal/sessao";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { NavPortal } from "./nav-portal";

export const metadata: Metadata = {
  title: {
    template: "%s · Portal do Produtor",
    default: "Portal do Produtor",
  },
};

/**
 * Casca do Portal do Produtor: topo verde com o nome da fazenda e navegação
 * simples. Visual acolhedor, textos grandes — o produtor rural acompanha
 * certificado, pendências, fazenda e relatórios sem depender da equipe.
 * Quem não é usuário de portal (equipe) é levado de volta ao painel.
 */
export default async function LayoutPortal({ children }: LayoutProps<"/portal">) {
  const perfil = await perfilPortal();
  if (!perfil) redirect("/painel");
  const modoDemo = !hasSupabaseEnv();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="mx-auto w-full max-w-4xl">
          <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-5 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/15">
                <Sprout className="size-6" />
              </span>
              <div className="min-w-0 leading-tight">
                <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/70">
                  Portal do Produtor · Mundo Novo Café
                </p>
                <h1 className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">
                  {perfil.nome}
                </h1>
              </div>
            </div>
            <form action={sair}>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <LogOut className="size-4" />
                Sair
              </button>
            </form>
          </div>
          <NavPortal />
        </div>
      </header>

      {modoDemo ? (
        <div className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-sm font-semibold text-warning">
          Modo demonstração — o portal completo estará disponível no ambiente
          publicado.
        </div>
      ) : null}

      <main id="conteudo" className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
