import type { Metadata } from "next";
import Link from "next/link";
import { Building2, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  clientesDiretos,
  clientesDoGrupo,
  listarGrupos,
} from "@/lib/carteira/consultas";
import { FormularioGrupo } from "./formulario-grupo";

export const metadata: Metadata = {
  title: "Grupos",
};

export default async function PaginaGrupos() {
  const grupos = await listarGrupos();
  const diretos = await clientesDiretos();

  const cartoes = await Promise.all(
    grupos.map(async (grupo) => ({
      grupo,
      clientes: await clientesDoGrupo(grupo.id),
    })),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Estrutura da carteira
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">Grupos</h1>
        </div>
        <FormularioGrupo />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cartoes.map(({ grupo, clientes }) => {
          const conformidades = clientes
            .map((c) => c.conformidade)
            .filter((n): n is number => typeof n === "number");
          const media =
            conformidades.length > 0
              ? Math.round(
                  conformidades.reduce((s, n) => s + n, 0) /
                    conformidades.length,
                )
              : null;

          return (
            <Card key={grupo.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="size-4 text-primary" />
                    {grupo.nome}
                  </CardTitle>
                  <FormularioGrupo grupo={grupo} />
                </div>
                <CardDescription>
                  {grupo.administracao === "mundo_novo" ? (
                    <>Administrado pela Mundo Novo</>
                  ) : (
                    <>
                      Administrado por terceiro
                      {grupo.nomeAdministrador
                        ? ` — ${grupo.nomeAdministrador}`
                        : null}
                    </>
                  )}
                  {grupo.cidade ? ` · ${grupo.cidade}, ${grupo.uf}` : null}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-end justify-between">
                <div className="flex gap-6">
                  <div>
                    <p className="text-2xl font-extrabold">{clientes.length}</p>
                    <p className="text-xs font-semibold text-muted-foreground">
                      cliente{clientes.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  {media !== null ? (
                    <div>
                      <p className="text-2xl font-extrabold text-success">
                        {media}%
                      </p>
                      <p className="text-xs font-semibold text-muted-foreground">
                        conf. média
                      </p>
                    </div>
                  ) : null}
                </div>
                {grupo.administracao === "terceiro" ? (
                  <Badge variant="outline">Grupo externo</Badge>
                ) : null}
              </CardContent>
            </Card>
          );
        })}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="size-4 text-coffee" />
              Clientes diretos
            </CardTitle>
            <CardDescription>
              Sem grupo — relação direta com a Mundo Novo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold">{diretos.length}</p>
            <p className="text-xs font-semibold text-muted-foreground">
              cliente{diretos.length === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        Um cliente pode pertencer a um grupo (administrado pela Mundo Novo ou
        por terceiro, como a Expocaccer) ou ser cliente direto.{" "}
        <Link
          href="/painel/clientes"
          className="font-semibold text-primary underline underline-offset-2"
        >
          Ver todos os clientes →
        </Link>
      </p>
    </div>
  );
}
