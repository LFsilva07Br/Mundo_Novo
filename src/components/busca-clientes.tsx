"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  EVENTO_CLIENTE_SELECIONADO,
  gravarClienteSelecionado,
  lerClienteSelecionado,
} from "@/lib/cliente-selecionado";
import { cn } from "@/lib/utils";

export type ClienteBusca = {
  id: string;
  nome: string;
  produtor?: string;
  cidade?: string;
  uf?: string;
};

/** Tira acentos e caixa: quem digita "sao jose" acha "São José". */
export function normalizar(texto: string): string {
  return texto
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

/**
 * Filtra a carteira por nome, produtor ou cidade, sem exigir acento.
 * Cada palavra digitada precisa aparecer em algum dos campos, então
 * "cedro salitre" acha a Fazenda Cedro de Serra do Salitre.
 * Sem termo, devolve a carteira inteira (limitada) — o painel abre já
 * mostrando as opções em vez de uma caixa vazia.
 */
export function filtrarClientes(
  clientes: readonly ClienteBusca[],
  termo: string,
  limite = 8,
): ClienteBusca[] {
  const palavras = normalizar(termo).split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return clientes.slice(0, limite);

  return clientes
    .filter((cliente) => {
      const alvo = normalizar(
        [cliente.nome, cliente.produtor, cliente.cidade, cliente.uf]
          .filter(Boolean)
          .join(" "),
      );
      return palavras.every((palavra) => alvo.includes(palavra));
    })
    .slice(0, limite);
}

/** Descrição secundária mostrada abaixo do nome no resultado. */
export function detalheCliente(cliente: ClienteBusca): string {
  const local = [cliente.cidade, cliente.uf].filter(Boolean).join(" - ");
  return [local, cliente.produtor].filter(Boolean).join(" · ");
}

/**
 * Cabeçalho do painel: busca global de cliente (Ctrl/Cmd+K) e o nome do
 * cliente ativo. Antes disto, achar um cliente exigia ir até a lista e
 * filtrar lá — e nada na tela dizia em qual cliente o usuário estava.
 */
export function BuscaClientes({
  clientes,
  abertaInicialmente = false,
}: {
  clientes: ClienteBusca[];
  abertaInicialmente?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [aberta, setAberta] = useState(abertaInicialmente);
  const [termo, setTermo] = useState("");
  const [indice, setIndice] = useState(0);
  const [clienteAtivoId, setClienteAtivoId] = useState<string | null>(null);
  const idLista = useId();
  const campoRef = useRef<HTMLInputElement>(null);

  const resultados = useMemo(
    () => filtrarClientes(clientes, termo),
    [clientes, termo],
  );
  const clienteAtivo = clientes.find((c) => c.id === clienteAtivoId) ?? null;

  // O cookie só existe no navegador: ler depois da montagem evita divergir
  // do HTML gerado no servidor.
  useEffect(() => {
    const sincronizar = () => setClienteAtivoId(lerClienteSelecionado());
    sincronizar();
    window.addEventListener(EVENTO_CLIENTE_SELECIONADO, sincronizar);
    return () =>
      window.removeEventListener(EVENTO_CLIENTE_SELECIONADO, sincronizar);
  }, [pathname]);

  // Abrir sempre começa do zero: a busca anterior não interessa mais.
  const definirAberta = useCallback((valor: boolean) => {
    setAberta(valor);
    if (valor) {
      setTermo("");
      setIndice(0);
    }
  }, []);

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key.toLowerCase() === "k" && (evento.metaKey || evento.ctrlKey)) {
        evento.preventDefault();
        definirAberta(true);
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [definirAberta]);

  const abrirCliente = useCallback(
    (cliente: ClienteBusca | undefined) => {
      if (!cliente) return;
      gravarClienteSelecionado(cliente.id);
      setClienteAtivoId(cliente.id);
      setAberta(false);
      router.push(`/painel/clientes/${encodeURIComponent(cliente.id)}`);
    },
    [router],
  );

  const aoTeclarNoCampo = (evento: React.KeyboardEvent<HTMLInputElement>) => {
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setIndice((i) => (resultados.length ? (i + 1) % resultados.length : 0));
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setIndice((i) =>
        resultados.length ? (i - 1 + resultados.length) % resultados.length : 0,
      );
    } else if (evento.key === "Enter") {
      evento.preventDefault();
      abrirCliente(resultados[indice]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 border-b bg-background px-4 py-2 lg:px-8 print:hidden">
      <button
        type="button"
        onClick={() => definirAberta(true)}
        className="flex min-w-56 flex-1 items-center gap-2 rounded-lg border border-input bg-card px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-ring sm:flex-none"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        Buscar cliente…
        <kbd className="ml-auto rounded border bg-muted px-1.5 py-0.5 text-[10px] font-bold sm:ml-4">
          Ctrl K
        </kbd>
      </button>

      {clienteAtivo ? (
        <p className="flex min-w-0 items-center gap-2 text-sm">
          <span className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Cliente ativo
          </span>
          <a
            href={`/painel/clientes/${encodeURIComponent(clienteAtivo.id)}`}
            className="truncate font-bold hover:text-primary"
          >
            {clienteAtivo.nome}
          </a>
          <button
            type="button"
            aria-label="Limpar cliente ativo"
            onClick={() => {
              gravarClienteSelecionado("");
              setClienteAtivoId(null);
            }}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </p>
      ) : null}

      <Dialog open={aberta} onOpenChange={definirAberta}>
        <DialogContent
          showCloseButton={false}
          className="top-24 max-w-lg translate-y-0 gap-2 p-0 sm:max-w-lg"
          initialFocus={campoRef}
        >
          <DialogTitle className="sr-only">Buscar cliente</DialogTitle>
          <DialogDescription className="sr-only">
            Digite parte do nome, do produtor ou da cidade. Use as setas para
            escolher e Enter para abrir a ficha.
          </DialogDescription>

          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              ref={campoRef}
              type="text"
              role="combobox"
              aria-label="Buscar cliente por nome, produtor ou cidade"
              aria-expanded
              aria-controls={idLista}
              aria-autocomplete="list"
              aria-activedescendant={
                resultados[indice] ? `${idLista}-${resultados[indice].id}` : undefined
              }
              placeholder="Nome, produtor ou cidade…"
              value={termo}
              onChange={(evento) => {
                setTermo(evento.target.value);
                setIndice(0);
              }}
              onKeyDown={aoTeclarNoCampo}
              className="w-full bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {resultados.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nenhum cliente encontrado para “{termo}”.
            </p>
          ) : (
            <ul id={idLista} role="listbox" aria-label="Clientes" className="max-h-80 overflow-y-auto p-1.5">
              {resultados.map((cliente, posicao) => (
                // Padrão combobox: o foco fica no campo e o item ativo é
                // anunciado por aria-activedescendant, então a opção não é
                // focável — o teclado navega pelo campo, o mouse clica aqui.
                <li
                  key={cliente.id}
                  id={`${idLista}-${cliente.id}`}
                  role="option"
                  aria-selected={posicao === indice}
                  onMouseEnter={() => setIndice(posicao)}
                  onClick={() => abrirCliente(cliente)}
                  className={cn(
                    "flex cursor-pointer flex-col items-start rounded-lg px-3 py-2 text-left",
                    posicao === indice && "bg-accent text-accent-foreground",
                  )}
                >
                  <span className="text-sm font-bold">{cliente.nome}</span>
                  <span className="text-xs text-muted-foreground">
                    {detalheCliente(cliente)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="border-t px-3 py-1.5 text-[11px] text-muted-foreground">
            ↑↓ para escolher · Enter para abrir · Esc para fechar
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
