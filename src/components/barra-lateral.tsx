"use client";

import { useId, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Bell,
  BookOpen,
  ChevronDown,
  Coins,
  Mail,
  Menu,
  CalendarClock,
  CalendarRange,
  CircleHelp,
  ClipboardCheck,
  Download,
  FileChartColumn,
  FileSignature,
  FolderOpen,
  Globe,
  HardHat,
  HeartHandshake,
  History,
  LayoutDashboard,
  Leaf,
  ListChecks,
  Map,
  Network,
  SearchCheck,
  ShieldCheck,
  ShieldUser,
  SprayCan,
  Users,
  Wallet,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type ItemNavegacao = {
  rotulo: string;
  href: string;
  icone: React.ComponentType<{ className?: string }>;
  disponivel?: boolean;
};

export type GrupoNavegacao = {
  /** Identificador estável — é a chave da preferência no localStorage. */
  id: string;
  titulo: string;
  itens: ItemNavegacao[];
};

/**
 * Menu organizado pela jornada de trabalho da equipe, não por "tipo de tela":
 * quem cuida da carteira, quem toca a certificação, quem opera o dia a dia,
 * quem analisa dados e quem configura o sistema encontram tudo no mesmo bloco.
 *
 * Cada ícone é exclusivo — em 16px o ícone é o que diferencia as linhas,
 * então repetir (ou usar um símbolo alheio ao assunto) atrapalha mais do que ajuda.
 */
export const GRUPOS_NAVEGACAO: GrupoNavegacao[] = [
  {
    id: "carteira",
    titulo: "Carteira",
    itens: [
      { rotulo: "Dashboard", href: "/painel", icone: LayoutDashboard, disponivel: true },
      { rotulo: "Grupos", href: "/painel/grupos", icone: Network, disponivel: true },
      { rotulo: "Clientes", href: "/painel/clientes", icone: Users, disponivel: true },
      { rotulo: "Imóveis & Talhões", href: "/painel/imoveis", icone: Map, disponivel: true },
      { rotulo: "Contratos", href: "/painel/contratos", icone: FileSignature, disponivel: true },
    ],
  },
  {
    id: "certificacao",
    titulo: "Certificação",
    itens: [
      { rotulo: "Certificações", href: "/painel/workflow", icone: Award, disponivel: true },
      { rotulo: "Visitas", href: "/painel/visitas", icone: ClipboardCheck, disponivel: true },
      { rotulo: "CAPAs", href: "/painel/capas", icone: ShieldCheck, disponivel: true },
      { rotulo: "Checklists", href: "/painel/checklists", icone: ListChecks, disponivel: true },
      { rotulo: "Auditoria Externa", href: "/painel/auditoria-externa", icone: SearchCheck, disponivel: true },
    ],
  },
  {
    id: "operacao",
    titulo: "Operação",
    itens: [
      { rotulo: "Agenda", href: "/painel/agenda", icone: CalendarClock, disponivel: true },
      { rotulo: "Planejamento anual", href: "/painel/planejamento", icone: CalendarRange, disponivel: true },
      { rotulo: "Social & Colaboradores", href: "/painel/social", icone: HardHat, disponivel: true },
      { rotulo: "Compliance social", href: "/painel/compliance", icone: HeartHandshake, disponivel: true },
      { rotulo: "Agroquímicos", href: "/painel/agro", icone: SprayCan, disponivel: true },
      { rotulo: "Comercialização", href: "/painel/comercializacao", icone: Coins, disponivel: true },
    ],
  },
  {
    id: "analise",
    titulo: "Análise & Dados",
    itens: [
      { rotulo: "Relatórios", href: "/painel/relatorios", icone: FileChartColumn, disponivel: true },
      { rotulo: "EUDR (exportação UE)", href: "/painel/eudr", icone: Globe, disponivel: true },
      { rotulo: "Sustentabilidade (DS/DI)", href: "/painel/sustentabilidade", icone: Leaf, disponivel: true },
      { rotulo: "Financeiro", href: "/painel/financeiro", icone: Wallet, disponivel: true },
      { rotulo: "Dossiê do auditor", href: "/painel/dossie", icone: FolderOpen, disponivel: true },
      { rotulo: "Trilha de auditoria", href: "/painel/trilha", icone: History, disponivel: true },
      { rotulo: "Exportação de dados", href: "/painel/exportacao", icone: Download, disponivel: true },
    ],
  },
  {
    id: "configuracao",
    titulo: "Configuração",
    itens: [
      { rotulo: "Alertas & Automação", href: "/painel/automacao", icone: Bell, disponivel: true },
      { rotulo: "Usuários & Permissões", href: "/painel/usuarios", icone: ShieldUser, disponivel: true },
      { rotulo: "E-mails", href: "/painel/emails", icone: Mail, disponivel: true },
    ],
  },
];

export const CHAVE_PREFERENCIA_MENU = "mundo-novo:menu-grupos-abertos";

/**
 * O item está ativo quando a rota atual é ele ou uma tela filha dele.
 * "/painel" só casa consigo mesmo — senão o Dashboard ficaria sempre aceso.
 */
export function itemAtivo(pathname: string, href: string): boolean {
  if (href === "/painel") return pathname === "/painel";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Id do grupo que contém a rota atual (null fora do menu). */
export function grupoDaRota(pathname: string): string | null {
  for (const grupo of GRUPOS_NAVEGACAO) {
    if (grupo.itens.some((item) => itemAtivo(pathname, item.href))) {
      return grupo.id;
    }
  }
  return null;
}

/**
 * Quais grupos aparecem abertos.
 *
 * Regra: manda a preferência que o usuário salvou; onde ele nunca mexeu,
 * abre só o grupo da rota atual. Com 26 telas, abrir tudo empurrava um
 * terço do menu para fora da tela — o problema que este agrupamento veio
 * resolver. Um grupo fechado que contém a tela atual ganha um ponto no
 * título, para a pessoa não se perder.
 */
export function estadoInicialGrupos(
  pathname: string,
  preferencia?: Record<string, boolean> | null,
): Record<string, boolean> {
  const atual = grupoDaRota(pathname);
  const estado: Record<string, boolean> = {};
  for (const grupo of GRUPOS_NAVEGACAO) {
    const salvo = preferencia?.[grupo.id];
    estado[grupo.id] = typeof salvo === "boolean" ? salvo : grupo.id === atual;
  }
  return estado;
}

/**
 * Preferência do menu como "fonte externa" (padrão useSyncExternalStore):
 * é o localStorage que manda, e as duas barras (fixa e gaveta) leem a mesma
 * coisa e se atualizam juntas — sem estado duplicado e sem efeito para
 * sincronizar depois da montagem.
 */
const ouvintesPreferencia = new Set<() => void>();
/** Espelho em memória, para quando o navegador bloqueia o localStorage. */
let preferenciaEmMemoria: string | null = null;

function assinarPreferencia(ouvinte: () => void): () => void {
  ouvintesPreferencia.add(ouvinte);
  return () => ouvintesPreferencia.delete(ouvinte);
}

/** localStorage quando disponível (aba anônima ou política podem barrar). */
function armazenamento(): Storage | null {
  try {
    return typeof window !== "undefined" ? (window.localStorage ?? null) : null;
  } catch {
    return null;
  }
}

function lerPreferenciaBruta(): string | null {
  const local = armazenamento();
  if (!local) return preferenciaEmMemoria;
  try {
    return local.getItem(CHAVE_PREFERENCIA_MENU);
  } catch {
    return preferenciaEmMemoria;
  }
}

function gravarPreferencia(preferencia: Record<string, boolean>): void {
  preferenciaEmMemoria = JSON.stringify(preferencia);
  try {
    armazenamento()?.setItem(CHAVE_PREFERENCIA_MENU, preferenciaEmMemoria);
  } catch {
    // Sem persistência, a preferência vale só para a sessão atual.
  }
  for (const ouvinte of ouvintesPreferencia) ouvinte();
}

/** Converte o JSON salvo em preferência utilizável. */
export function analisarPreferencia(
  bruto: string | null,
): Record<string, boolean> | null {
  if (!bruto) return null;
  try {
    const dados: unknown = JSON.parse(bruto);
    if (!dados || typeof dados !== "object") return null;
    return dados as Record<string, boolean>;
  } catch {
    return null;
  }
}

function LinhaItem({
  item,
  pathname,
}: {
  item: ItemNavegacao;
  pathname: string;
}) {
  const ativo = itemAtivo(pathname, item.href);
  const Icone = item.icone;

  return (
    <li>
      {item.disponivel ? (
        <Link
          href={item.href}
          aria-current={ativo ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            ativo && "bg-sidebar-primary text-sidebar-primary-foreground",
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
}

function BlocoGrupo({
  grupo,
  pathname,
  aberto,
  aoAlternar,
}: {
  grupo: GrupoNavegacao;
  pathname: string;
  aberto: boolean;
  aoAlternar: () => void;
}) {
  const idLista = useId();
  const temRotaAtual = grupo.itens.some((item) => itemAtivo(pathname, item.href));

  return (
    <div>
      <button
        type="button"
        onClick={aoAlternar}
        aria-expanded={aberto}
        aria-controls={idLista}
        className="flex w-full items-center gap-2 rounded-xl px-3 pb-2 pt-5 text-[10px] font-extrabold uppercase tracking-widest text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground/80"
      >
        <ChevronDown
          aria-hidden
          className={cn(
            "size-3 shrink-0 transition-transform",
            !aberto && "-rotate-90",
          )}
        />
        {grupo.titulo}
        {!aberto && temRotaAtual ? (
          <span
            aria-hidden
            className="size-1.5 shrink-0 rounded-full bg-sidebar-primary"
          />
        ) : null}
      </button>
      <ul id={idLista} hidden={!aberto} className="space-y-0.5">
        {grupo.itens.map((item) => (
          <LinhaItem key={item.href} item={item} pathname={pathname} />
        ))}
      </ul>
    </div>
  );
}

function ConteudoBarra({
  emailUsuario,
  pathname,
  aoNavegar,
}: {
  emailUsuario: string | null;
  pathname: string;
  aoNavegar?: () => void;
}) {
  // No servidor não existe localStorage: o HTML sai com a regra padrão e o
  // navegador aplica a preferência já na hidratação, sem divergência.
  const bruto = useSyncExternalStore(
    assinarPreferencia,
    lerPreferenciaBruta,
    () => null,
  );
  const preferencia = useMemo(() => analisarPreferencia(bruto), [bruto]);
  const abertos = estadoInicialGrupos(pathname, preferencia);

  // Guarda só o que o usuário mexeu de fato: assim um grupo em que ele nunca
  // tocou continua abrindo sozinho quando ele entra numa tela de lá.
  const alternar = (id: string) => {
    gravarPreferencia({ ...(preferencia ?? {}), [id]: !abertos[id] });
  };

  // Na gaveta, só o clique num link fecha o menu — abrir/fechar um grupo
  // precisa manter a gaveta aberta para o usuário escolher o destino.
  const aoClicar = (evento: React.MouseEvent<HTMLDivElement>) => {
    if (!aoNavegar) return;
    if ((evento.target as HTMLElement).closest("a")) aoNavegar();
  };

  return (
    <div
      className="flex h-full flex-col overflow-y-auto bg-sidebar px-3 pb-4"
      onClick={aoClicar}
    >
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

      <nav className="flex-1" aria-label="Navegação principal">
        {GRUPOS_NAVEGACAO.map((grupo) => (
          <BlocoGrupo
            key={grupo.id}
            grupo={grupo}
            pathname={pathname}
            aberto={abertos[grupo.id]}
            aoAlternar={() => alternar(grupo.id)}
          />
        ))}
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
    </div>
  );
}

export function BarraLateral({ emailUsuario }: { emailUsuario: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 lg:block">
      <ConteudoBarra emailUsuario={emailUsuario} pathname={pathname} />
    </aside>
  );
}

/**
 * Navegação para telas estreitas (notebook com janela reduzida, tablet).
 * Sem isto, abaixo de `lg` o usuário ficava sem nenhum acesso ao menu.
 */
export function BarraLateralMovel({
  emailUsuario,
}: {
  emailUsuario: string | null;
}) {
  const pathname = usePathname();
  const [aberta, setAberta] = useState(false);

  return (
    <div className="flex items-center gap-3 border-b bg-sidebar px-4 py-3 lg:hidden">
      <Sheet open={aberta} onOpenChange={setAberta}>
        <SheetTrigger
          render={
            <button
              type="button"
              aria-label="Abrir menu de navegação"
              className="rounded-xl p-2 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Menu className="size-5" />
            </button>
          }
        />
        <SheetContent side="left" className="w-72 border-0 p-0">
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <ConteudoBarra
            emailUsuario={emailUsuario}
            pathname={pathname}
            aoNavegar={() => setAberta(false)}
          />
        </SheetContent>
      </Sheet>
      <span className="flex items-center gap-2 text-sm font-extrabold text-white">
        <span className="text-lg">☕</span> Mundo Novo
      </span>
    </div>
  );
}
