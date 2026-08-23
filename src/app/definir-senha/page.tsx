import { Suspense } from "react";
import type { Metadata } from "next";
import { RodapeAjuda } from "@/components/rodape-ajuda";
import { FormularioDefinirSenha } from "./formulario-definir-senha";

export const metadata: Metadata = {
  title: "Definir senha",
};

export default function PaginaDefinirSenha() {
  return (
    <main className="flex flex-1 items-center justify-center bg-sidebar p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-3xl">
            ☕
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Bem-vindo(a) ao Mundo Novo
          </h1>
          <p className="mt-1 text-base font-medium text-[#95D5B2]">
            Defina sua senha de acesso
          </p>
        </div>

        {/* O formulário lê ?obrigatoria=1 — precisa de Suspense. */}
        <Suspense
          fallback={
            <p className="rounded-2xl bg-white/10 p-6 text-center text-base text-white/80">
              Carregando…
            </p>
          }
        >
          <FormularioDefinirSenha />
        </Suspense>

        <RodapeAjuda tema="escuro" className="mt-6" />
      </div>
    </main>
  );
}
