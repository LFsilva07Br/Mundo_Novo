"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { obterOuBaixarPacote } from "@/lib/campo/pacote";
import type { PacoteCampo } from "@/lib/campo/tipos";
import { ROTULO_NORMA } from "@/lib/carteira/tipos";

/** Lista de clientes do pacote — tocar em um deles inicia uma visita. */
export default function PaginaClientesCampo() {
  const [pacote, setPacote] = useState<PacoteCampo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    void obterOuBaixarPacote().then((p) => {
      setPacote(p);
      setCarregando(false);
    });
  }, []);

  const clientes = useMemo(() => {
    const todos = pacote?.clientes ?? [];
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    if (!termo) return todos;
    return todos.filter((c) =>
      `${c.nome} ${c.produtor ?? ""} ${c.cidade} ${c.regiao}`
        .toLocaleLowerCase("pt-BR")
        .includes(termo),
    );
  }, [pacote, busca]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Toque em um cliente para iniciar a visita.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, produtor ou cidade…"
          className="h-11 rounded-2xl pl-9"
          aria-label="Buscar cliente"
        />
      </div>

      {carregando ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Abrindo os dados do aparelho…
        </p>
      ) : clientes.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {pacote
            ? "Nenhum cliente encontrado com essa busca."
            : "Sem pacote de dados no aparelho — baixe na tela Início."}
        </p>
      ) : (
        <div className="space-y-2">
          {clientes.map((cliente) => {
            const principal =
              cliente.certificacoes.find((c) => c.principal) ??
              cliente.certificacoes[0];
            return (
              <Link
                key={cliente.id}
                href={`/campo/visita/nova?cliente=${cliente.id}`}
                className="block"
              >
                <Card className="rounded-2xl transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{cliente.nome}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[cliente.produtor, `${cliente.cidade}/${cliente.uf}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {principal ? (
                        <span className="mt-1 inline-flex rounded-lg bg-secondary px-2 py-0.5 text-[11px] font-bold text-secondary-foreground">
                          {ROTULO_NORMA[principal.norma]}
                        </span>
                      ) : null}
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
