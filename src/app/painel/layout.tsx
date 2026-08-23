import Link from "next/link";
import { redirect } from "next/navigation";
import { BarraLateral } from "@/components/barra-lateral";
import { Toaster } from "@/components/ui/sonner";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient, getUsuarioAtual } from "@/lib/supabase/server";

export default async function LayoutPainel({
  children,
}: LayoutProps<"/painel">) {
  const usuario = await getUsuarioAtual();
  const modoDemo = !hasSupabaseEnv();

  // Senha provisória: obriga a definir a própria senha antes de usar o painel.
  if (usuario) {
    const supabase = await createClient();
    const { data: perfil } = (await supabase!
      .from("perfis")
      .select("deve_trocar_senha, cliente_id")
      .eq("id", usuario.id)
      .maybeSingle()) as {
      data: { deve_trocar_senha: boolean; cliente_id: string | null } | null;
    };
    if (perfil?.deve_trocar_senha) {
      redirect("/definir-senha?obrigatoria=1");
    }
    // Perfil vinculado a um cliente é PRODUTOR — o lugar dele é o portal.
    if (perfil?.cliente_id) {
      redirect("/portal");
    }
  }

  return (
    <div className="flex min-h-dvh flex-1">
      <BarraLateral emailUsuario={usuario?.email ?? null} />
      <div className="flex min-w-0 flex-1 flex-col">
        {modoDemo ? (
          <div className="border-b border-warning/30 bg-warning/10 px-6 py-2 text-center text-xs font-semibold text-warning">
            Modo demonstração — o banco de dados ainda não foi conectado.{" "}
            <Link href="/docs" className="underline underline-offset-2">
              Ver documentação
            </Link>
          </div>
        ) : null}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
