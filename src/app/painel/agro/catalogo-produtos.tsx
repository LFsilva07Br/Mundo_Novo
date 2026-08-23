"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type ProdutoCatalogo = {
  id: string;
  nome: string;
  ingredienteAtivo?: string;
  proibidoRa: boolean;
  observacao?: string;
};

/** Catálogo de produtos com filtro dos proibidos pela RA. */
export function CatalogoProdutos({ produtos }: { produtos: ProdutoCatalogo[] }) {
  const [soProibidos, setSoProibidos] = useState(false);

  const visiveis = soProibidos
    ? produtos.filter((p) => p.proibidoRa)
    : produtos;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>Catálogo de produtos</CardTitle>
            <CardDescription>
              Produtos agroquímicos cadastrados — os proibidos pela Rainforest
              Alliance ficam marcados em vermelho.
            </CardDescription>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              className="size-4"
              checked={soProibidos}
              onChange={(evento) => setSoProibidos(evento.target.checked)}
            />
            Só proibidos pela RA
          </label>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {visiveis.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {soProibidos
              ? "Nenhum produto proibido no catálogo — ótimo sinal."
              : "Nenhum produto cadastrado ainda."}
          </p>
        ) : null}
        {visiveis.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3"
          >
            <div>
              <p className="text-sm font-bold">
                {p.nome}
                {p.ingredienteAtivo ? (
                  <span className="ml-1 font-normal text-muted-foreground">
                    · {p.ingredienteAtivo}
                  </span>
                ) : null}
              </p>
              {p.observacao ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {p.observacao}
                </p>
              ) : null}
            </div>
            {p.proibidoRa ? (
              <Badge variant="destructive">Proibido pela RA</Badge>
            ) : (
              <Badge variant="outline">Permitido</Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
