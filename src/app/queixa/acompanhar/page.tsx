import type { Metadata } from "next";
import { RodapeAjuda } from "@/components/rodape-ajuda";
import { PRAZO_RESPOSTA_DIAS } from "@/lib/portal/protocolo";
import { FormularioAcompanhar } from "./formulario-acompanhar";

/** Título de aba neutro, igual ao do canal — celular emprestado não entrega. */
export const metadata: Metadata = {
  title: { absolute: "Fale com a gente" },
};

export default function PaginaAcompanharQueixa() {
  return (
    <main className="flex min-h-dvh flex-1 items-start justify-center bg-sidebar p-6 sm:items-center">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl">
            🔎
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Consultar pelo código
          </h1>
          <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-white/80">
            Digite o código que você anotou para saber no que deu o seu relato.
            Não precisa dizer seu nome. A resposta sai em até{" "}
            {PRAZO_RESPOSTA_DIAS} dias depois do envio.
          </p>
        </div>

        <FormularioAcompanhar />

        <RodapeAjuda canal="queixas" tema="escuro" className="mt-6" />
      </div>
    </main>
  );
}
