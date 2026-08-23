import type { Metadata } from "next";
import { RodapeAjuda } from "@/components/rodape-ajuda";
import { FormularioRecuperarSenha } from "./formulario-recuperar-senha";

export const metadata: Metadata = {
  title: "Recuperar senha",
};

export default function PaginaRecuperarSenha() {
  return (
    <main id="conteudo" className="flex flex-1 items-center justify-center bg-sidebar p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-3xl">
            ☕
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Recuperar senha
          </h1>
          <p className="mt-1 text-base font-medium text-[#95D5B2]">
            Enviaremos um link para o seu e-mail
          </p>
        </div>
        <FormularioRecuperarSenha />
        <RodapeAjuda tema="escuro" className="mt-6" />
      </div>
    </main>
  );
}
