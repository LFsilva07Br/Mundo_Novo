import Link from "next/link";
import { redirect } from "next/navigation";
import { BarraLateral, BarraLateralMovel } from "@/components/barra-lateral";
import { BuscaClientes } from "@/components/busca-clientes";
import { Toaster } from "@/components/ui/sonner";
import { perfilEhAuditor } from "@/lib/auditor/sessao";
import { listarClientes } from "@/lib/carteira/consultas";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient, getUsuarioAtual } from "@/lib/supabase/server";

export default async function LayoutPainel({
  children,
}: LayoutProps<"/painel">) {
  const usuario = await getUsuarioAtual();
  const modoDemo = !hasSupabaseEnv();
  let modoAuditor = false;

  // Senha provisória: obriga a definir a própria senha antes de usar o painel.
  if (usuario) {
    const supabase = await createClient();
    const { data: perfil } = (await supabase!
      .from("perfis")
      .select("deve_trocar_senha, cliente_id, papel")
      .eq("id", usuario.id)
      .maybeSingle()) as {
      data: {
        deve_trocar_senha: boolean;
        cliente_id: string | null;
        papel?: string;
      } | null;
    };
    if (perfil?.deve_trocar_senha) {
      redirect("/definir-senha?obrigatoria=1");
    }
    // Perfil vinculado a um cliente é PRODUTOR — o lugar dele é o portal.
    if (perfil?.cliente_id) {
      redirect("/portal");
    }
    modoAuditor = perfilEhAuditor(
      perfil ? { papel: perfil.papel, clienteId: perfil.cliente_id } : null,
    );
  }

  // Busca global de cliente (Ctrl/Cmd+K) e nome do cliente ativo: fica no
  // layout para estar disponível em qualquer tela do painel.
  const clientesBusca = (await listarClientes()).map((cliente) => ({
    id: cliente.id,
    nome: cliente.nome,
    produtor: cliente.produtor,
    cidade: cliente.cidade,
    uf: cliente.uf,
  }));

  return (
    <div className="flex min-h-dvh flex-1">
      <BarraLateral emailUsuario={usuario?.email ?? null} />
      <div className="flex min-w-0 flex-1 flex-col">
        <BarraLateralMovel emailUsuario={usuario?.email ?? null} />
        <BuscaClientes clientes={clientesBusca} />
        {modoAuditor ? (
          <div className="sticky top-0 z-40 border-b border-warning/40 bg-warning/15 px-6 py-2 text-center text-xs font-bold text-warning print:hidden">
            Modo auditor — somente leitura. Você pode consultar todos os
            registros, mas nenhuma alteração é permitida.
          </div>
        ) : null}
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
