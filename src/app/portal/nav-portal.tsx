"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Navegação simples do Portal do Produtor: quatro destinos, textos grandes.
 * Client Component apenas para destacar a página atual.
 */

const DESTINOS = [
  { href: "/portal", rotulo: "Meu certificado" },
  { href: "/portal/pendencias", rotulo: "Pendências" },
  { href: "/portal/fazenda", rotulo: "Minha fazenda" },
  { href: "/portal/relatorios", rotulo: "Relatórios" },
] as const;

export function NavPortal() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação do portal"
      className="flex gap-1 overflow-x-auto px-4 pb-2 sm:px-6"
    >
      {DESTINOS.map((destino) => {
        const atual =
          destino.href === "/portal"
            ? pathname === "/portal"
            : pathname.startsWith(destino.href);
        return (
          <Link
            key={destino.href}
            href={destino.href}
            aria-current={atual ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-xl px-4 py-2 text-base font-bold transition-colors",
              atual
                ? "bg-primary-foreground/15 text-primary-foreground"
                : "text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground",
            )}
          >
            {destino.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
