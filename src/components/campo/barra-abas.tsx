"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, RefreshCw, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ABAS = [
  { rota: "/campo", rotulo: "Início", Icone: Home },
  { rota: "/campo/clientes", rotulo: "Clientes", Icone: Users },
  { rota: "/campo/alertas", rotulo: "Alertas", Icone: Bell },
  { rota: "/campo/sync", rotulo: "Sincronizar", Icone: RefreshCw },
] as const;

/** Barra inferior fixa de navegação do App de Campo (4 abas). */
export function BarraAbas() {
  const rotaAtual = usePathname();

  return (
    <nav
      aria-label="Navegação do app de campo"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto grid max-w-md grid-cols-4">
        {ABAS.map(({ rota, rotulo, Icone }) => {
          const ativa =
            rota === "/campo" ? rotaAtual === "/campo" : rotaAtual.startsWith(rota);
          return (
            <Link
              key={rota}
              href={rota}
              aria-current={ativa ? "page" : undefined}
              className={cn(
                // Alvo de toque de 56px de altura: dedo com luva, em pé.
                "flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[11px] font-bold transition-colors",
                ativa ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icone className="size-6" />
              {rotulo}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
