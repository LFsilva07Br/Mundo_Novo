"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BadgeVencimento } from "@/components/badge-vencimento";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ROTULO_NORMA, type Cliente, type Grupo } from "@/lib/carteira/tipos";

type Filtro = "todos" | "fazenda" | "cadeia_suprimentos" | "sem_grupo";

const FILTROS: { id: Filtro; rotulo: string }[] = [
  { id: "todos", rotulo: "Todos" },
  { id: "fazenda", rotulo: "Fazendas" },
  { id: "cadeia_suprimentos", rotulo: "Cadeia de Suprimentos" },
  { id: "sem_grupo", rotulo: "Sem grupo" },
];

function normalizar(texto: string): string {
  return texto
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/** Lista de clientes com busca por nome e filtro por tipo/grupo. */
export function ListaClientes({
  clientes,
  grupos,
}: {
  clientes: Cliente[];
  grupos: Grupo[];
}) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const nomeGrupo = new Map(grupos.map((g) => [g.id, g.nome]));

  const filtrados = clientes.filter((cliente) => {
    if (busca && !normalizar(cliente.nome).includes(normalizar(busca))) {
      return false;
    }
    if (filtro === "todos") return true;
    if (filtro === "sem_grupo") return cliente.grupoId === null;
    return cliente.tipo === filtro;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Buscar cliente por nome"
            placeholder="Buscar cliente por nome…"
            className="pl-8"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar clientes">
          {FILTROS.map((opcao) => (
            <Button
              key={opcao.id}
              size="sm"
              variant={filtro === opcao.id ? "default" : "outline"}
              aria-pressed={filtro === opcao.id}
              onClick={() => setFiltro(opcao.id)}
            >
              {opcao.rotulo}
            </Button>
          ))}
        </div>
      </div>

      {filtrados.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum cliente encontrado com a busca e os filtros atuais.
        </p>
      ) : (
        <div className="space-y-3">
          {filtrados.map((cliente) => {
            const principal = cliente.certificacoes.find((c) => c.principal);
            return (
              <Link
                key={cliente.id}
                href={`/painel/clientes/${cliente.id}`}
                className="block"
              >
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="flex flex-wrap items-center gap-4 py-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-lg">
                      {cliente.tipo === "cadeia_suprimentos" ? "🔗" : "🌱"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-bold">
                        {cliente.nome}
                        <Badge variant="outline">
                          {cliente.tipo === "cadeia_suprimentos"
                            ? "Cadeia de Suprimentos"
                            : "Fazenda"}
                        </Badge>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {cliente.cidade} - {cliente.uf}
                        {cliente.produtor ? ` · ${cliente.produtor}` : null} ·{" "}
                        {cliente.grupoId
                          ? nomeGrupo.get(cliente.grupoId)
                          : "Sem grupo (cliente direto)"}
                      </p>
                      <p className="mt-1 flex flex-wrap gap-1.5">
                        {cliente.certificacoes.map((cert) => (
                          <Badge key={cert.norma} variant="secondary">
                            {ROTULO_NORMA[cert.norma]}
                          </Badge>
                        ))}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {typeof cliente.conformidade === "number" ? (
                        <span className="text-sm font-extrabold text-success">
                          {cliente.conformidade}% conforme
                        </span>
                      ) : null}
                      <BadgeVencimento venceEm={principal?.venceEm} />
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
