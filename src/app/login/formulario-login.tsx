"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { entrar, type EstadoLogin } from "./actions";

/**
 * Entrada do sistema. Campos com 44px de altura e fonte de 16px — abaixo
 * disso o celular dá zoom sozinho ao tocar no campo e a pessoa se perde.
 */
export function FormularioLogin() {
  const [estado, acaoEntrar, pendente] = useActionState<EstadoLogin, FormData>(
    entrar,
    null,
  );
  const [mostrarSenha, setMostrarSenha] = useState(false);

  return (
    <Card className="border-white/10 bg-white shadow-2xl">
      <CardContent className="pt-6">
        <form action={acaoEntrar} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base">
              E-mail
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="seuemail@exemplo.com"
              required
              className="h-11 text-base md:text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha" className="text-base">
              Senha
            </Label>
            <div className="relative">
              <Input
                id="senha"
                name="senha"
                type={mostrarSenha ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                required
                className="h-11 pr-14 text-base md:text-base"
              />
              {/* Ver o que está sendo digitado evita o erro mais comum de
                  quem digita senha em teclado de celular. */}
              <button
                type="button"
                onClick={() => setMostrarSenha((atual) => !atual)}
                aria-pressed={mostrarSenha}
                className="absolute inset-y-0 right-0 flex min-h-11 min-w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground"
              >
                {mostrarSenha ? (
                  <EyeOff className="size-5" aria-hidden="true" />
                ) : (
                  <Eye className="size-5" aria-hidden="true" />
                )}
                <span className="sr-only">
                  {mostrarSenha ? "Esconder senha" : "Mostrar senha"}
                </span>
              </button>
            </div>
          </div>

          {estado?.erro ? (
            <p role="alert" className="text-base font-medium text-destructive">
              {estado.erro}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="h-11 w-full text-base"
            disabled={pendente}
          >
            {pendente ? "Entrando…" : "Entrar"}
          </Button>

          <p className="text-center">
            <a
              href="/recuperar-senha"
              className="inline-flex min-h-11 items-center px-3 text-base font-semibold text-muted-foreground hover:text-foreground"
            >
              Esqueci a senha
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
