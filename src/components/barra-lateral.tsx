"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  Building2,
  CircleHelp,
  ClipboardCheck,
  FileSignature,
  Landmark,
  LayoutDashboard,
  ListChecks,
  Map,
  ShieldCheck,
  Users,
  UsersRound,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ItemNavegacao = {
  rotulo: string;
  href: string;
  icone: React.ComponentType<{ className?: string }>;
  disponivel?: boolean;
};

const visaoGeral: ItemNavegacao[] = [
  { rotulo: "Dashboard", href: "/painel", icone: LayoutDashboard, disponivel: true },
  { rotulo: "Grupos", href: "/painel/grupos", icone: Building2, disponivel: true },
  { rotulo: "Clientes", href: "/painel/clientes", icone: Users, disponivel: true },
  { rotulo: "Imóveis & Talhões", href: "/painel/imoveis", icone: Map, disponivel: true },
  { rotulo: "Contratos", href: "/painel/contratos", icone: FileSignature, disponivel: true },
  { rotulo: "Certificações", href: "/painel/workflow", icone: Workflow, disponivel: true },
  { rotulo: "Visitas", href: "/painel/visitas", icone: ClipboardCheck, disponivel: true },
  { rotulo: "CAPAs", href: "/painel/capas", icone: ShieldCheck, disponivel: true },
  { rotulo: "Social & Colaboradores", href: "/painel/social", icone: UsersRound, disponivel: true },
];

const configuracao: ItemNavegacao[] = [
  { rotulo: "Checklists", href: "/painel/checklists", icone: ListChecks, disponivel: true },
  { rotulo: "Alertas & Automação", href: "/painel/automacao", icone: Bell, disponivel: true },
  { rotulo: "Usuários & Permissões", href: "/painel/usuarios", icone: Landmark, disponivel: true },
  { rotulo: "Relatórios", href: "/painel/relatorios", icone: BookOpen, disponivel: true },
];

function GrupoNavegacao({
  titulo,
  itens,
  pathname,
}: {
  titulo: string;
  itens: ItemNavegacao[];
  pathname: string;
}) {
  return (
    <div>
      <p className="px-3 pb-2 pt-5 text-[10px] font-extrabold uppercase tracking-widest text-sidebar-foreground/50">
        {titulo}
      </p>
      <ul className="space-y-0.5">
        {itens.map((item) => {
          const ativo = pathname === item.href;
          const Icone = item.icone;
          return (
            <li key={item.href}>
              {item.disponivel ? (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    ativo &&
                      "bg-sidebar-primary text-sidebar-primary-foreground",
                  )}
                >
                  <Icone className="size-4 shrink-0" />
                  {item.rotulo}
                </Link>
              ) : (
                <span className="flex cursor-default items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold text-sidebar-foreground/35">
                  <Icone className="size-4 shrink-0" />
                  {item.rotulo}
                  <span className="ml-auto rounded-md bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                    Em breve
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function BarraLateral({ emailUsuario }: { emailUsuario: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto bg-sidebar px-3 pb-4 lg:flex">
      <div className="flex items-center gap-3 px-3 py-5">
        <div className="flex size-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-lg">
          ☕
        </div>
        <div>
          <p className="text-sm font-extrabold leading-tight text-white">
            Mundo Novo
          </p>
          <p className="text-[10px] font-semibold text-[#95D5B2]">
            Gestão de Certificação
          </p>
        </div>
      </div>

      <nav className="flex-1">
        <GrupoNavegacao titulo="Visão geral" itens={visaoGeral} pathname={pathname} />
        <GrupoNavegacao titulo="Configuração" itens={configuracao} pathname={pathname} />
      </nav>

      <div className="mt-4 space-y-2 border-t border-sidebar-border pt-4">
        <Link
          href="/manual"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <CircleHelp className="size-4" />
          Manual do usuário
        </Link>
        <Link
          href="/docs"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <BookOpen className="size-4" />
          Documentação
        </Link>
        <p className="truncate px-3 text-[11px] text-sidebar-foreground/50">
          {emailUsuario ?? "Visitante (demonstração)"}
        </p>
      </div>
    </aside>
  );
}
