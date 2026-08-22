"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { entrar, type EstadoLogin } from "./actions";

export function FormularioLogin() {
  const [estado, acaoEntrar, pendente] = useActionState<EstadoLogin, FormData>(
    entrar,
    null,
  );

  return (
    <Card className="border-white/10 bg-white shadow-2xl">
      <CardContent className="pt-6">
        <form action={acaoEntrar} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nome@mundonovo.agr.br"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </div>

          {estado?.erro ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {estado.erro}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={pendente}>
            {pendente ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
