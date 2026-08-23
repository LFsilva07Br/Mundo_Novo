"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Navegação simples do Portal do Produtor: quatro destinos, textos grandes.
 * Client Component apenas para destacar a página atual.
 *
 * No celular vira grade 2×2: antes a fila rolava para o lado e "Relatórios"
 * ficava fora da tela — quem não sabia que existia nunca achava.
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
      className="grid grid-cols-2 gap-1.5 px-4 pb-3 sm:flex sm:gap-1 sm:px-6 sm:pb-2"
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
              "flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-center text-base font-bold transition-colors sm:justify-start sm:whitespace-nowrap",
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
