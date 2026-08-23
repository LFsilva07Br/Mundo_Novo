import type { Metadata } from "next";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { CLIENTES_DEMO } from "@/lib/carteira/dados-demo";
import { hasSupabaseEnv, supabaseUrl } from "@/lib/supabase/env";
import { FormularioQueixa } from "./formulario-queixa";

export const metadata: Metadata = {
  title: "Canal de escuta",
};

/**
 * Nome do cliente para o cabeçalho do canal. A página é pública (sem
 * login) e a RLS não deixa o anônimo ler `clientes`, então a consulta usa
 * a service key — só no servidor e só para buscar o nome.
 */
async function nomeDoCliente(clienteId: string): Promise<string | null> {
  if (!hasSupabaseEnv()) {
    return CLIENTES_DEMO.find((c) => c.id === clienteId)?.nome ?? null;
  }

  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!service) return null;

  const supabase = createServiceClient(supabaseUrl(), service, {
    auth: { persistSession: false },
  });
  const { data } = await supabase
    .from("clientes")
    .select("nome")
    .eq("id", clienteId)
    .maybeSingle();
  return data?.nome ?? null;
}

export default async function PaginaCanalQueixas({
  params,
}: PageProps<"/queixa/[clienteId]">) {
  const { clienteId } = await params;
  const clienteNome = await nomeDoCliente(clienteId);

  return (
    <main className="flex min-h-dvh flex-1 items-start justify-center bg-sidebar p-6 sm:items-center">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl">
            🗣️
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Canal de escuta
          </h1>
          {clienteNome ? (
            <p className="mt-1 text-sm font-semibold text-[#95D5B2]">
              {clienteNome}
            </p>
          ) : null}
          <p className="mx-auto mt-2 max-w-md text-sm text-white/80">
            Este é um espaço seguro para contar qualquer situação que te
            incomode no trabalho — condições, tratamento, pagamento ou o que
            for. Você não precisa se identificar e ninguém será punido por
            falar.
          </p>
        </div>

        <FormularioQueixa clienteId={clienteId} />

        <p className="mt-6 text-center text-xs text-white/60">
          O relato vai direto para a equipe de certificação Mundo Novo, que
          acompanha o tratamento até o fim.
        </p>
      </div>
    </main>
  );
}
