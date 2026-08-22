import type { Metadata } from "next";
import { FormularioDefinirSenha } from "./formulario-definir-senha";

export const metadata: Metadata = {
  title: "Definir senha",
};

export default function PaginaDefinirSenha() {
  return (
    <main className="flex flex-1 items-center justify-center bg-sidebar p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-3xl">
            ☕
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Bem-vindo(a) ao Mundo Novo
          </h1>
          <p className="mt-1 text-sm font-medium text-[#95D5B2]">
            Defina sua senha de acesso
          </p>
        </div>
        <FormularioDefinirSenha />
      </div>
    </main>
  );
}
