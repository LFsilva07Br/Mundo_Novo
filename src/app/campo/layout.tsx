import type { Metadata } from "next";
import { BarraAbas } from "@/components/campo/barra-abas";
import { IndicadorConexao } from "@/components/campo/indicador-conexao";
import { ManutencaoLocal } from "@/components/campo/manutencao-local";
import { TelaBloqueio } from "@/components/campo/tela-bloqueio";
import { RegistrarSw } from "@/components/registrar-sw";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    template: "%s · App de Campo",
    default: "App de Campo",
  },
};

/**
 * Casca mobile-first do App de Campo: container estreito centralizado,
 * cabeçalho com indicador de conexão e barra inferior fixa de navegação.
 * O service worker garante que a casca abre mesmo sem internet.
 */
export default function LayoutCampo({ children }: LayoutProps<"/campo">) {
  return (
    <div className="min-h-dvh bg-background">
      <RegistrarSw />
      <ManutencaoLocal />
      <TelaBloqueio />
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-sidebar text-sm font-extrabold text-sidebar-foreground">
              MN
            </span>
            <div className="leading-tight">
              <p className="text-sm font-extrabold tracking-tight">Mundo Novo</p>
              <p className="text-[11px] font-semibold text-muted-foreground">
                App de Campo
              </p>
            </div>
          </div>
          <IndicadorConexao />
        </header>
        <main id="conteudo" className="flex-1 px-4 pb-24 pt-4">{children}</main>
      </div>
      <BarraAbas />
      <Toaster position="top-center" />
    </div>
  );
}
