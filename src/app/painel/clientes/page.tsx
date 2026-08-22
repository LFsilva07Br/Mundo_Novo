import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BadgeVencimento } from "@/components/badge-vencimento";
import { Card, CardContent } from "@/components/ui/card";
import { listarClientes, listarGrupos } from "@/lib/carteira/consultas";
import { ROTULO_NORMA } from "@/lib/carteira/tipos";

export const metadata: Metadata = {
  title: "Clientes",
};

export default async function PaginaClientes() {
  const [clientes, grupos] = await Promise.all([
    listarClientes(),
    listarGrupos(),
  ]);
  const nomeGrupo = new Map(grupos.map((g) => [g.id, g.nome]));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Carteira
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Clientes — Fazendas e Cadeias de Suprimento
          </h1>
        </div>
        <Badge variant="secondary">{clientes.length} clientes ativos</Badge>
      </div>

      <div className="space-y-3">
        {clientes.map((cliente) => {
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
    </div>
  );
}
