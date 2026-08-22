"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function FormularioRecuperarSenha() {
  const supabase = useMemo(() => createClient(), []);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) {
      setErro("O banco de dados ainda não foi conectado.");
      return;
    }
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    setEnviando(true);
    setErro(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/definir-senha`,
    });
    setEnviando(false);
    if (error) {
      setErro("Não foi possível enviar o e-mail. Confira o endereço.");
      return;
    }
    setEnviado(true);
  }

  return (
    <Card className="border-white/10 bg-white shadow-2xl">
      <CardContent className="pt-6">
        {enviado ? (
          <div className="space-y-4 py-2 text-center">
            <p className="text-sm">
              ✅ Pronto! Se o e-mail estiver cadastrado, você receberá um link
              para definir uma nova senha. Confira também a caixa de spam.
            </p>
            <Link
              href="/login"
              className="text-sm font-semibold text-primary underline underline-offset-2"
            >
              Voltar para a entrada
            </Link>
          </div>
        ) : (
          <form onSubmit={aoEnviar} className="space-y-4">
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
            {erro ? (
              <p role="alert" className="text-sm font-medium text-destructive">
                {erro}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando ? "Enviando…" : "Enviar link de recuperação"}
            </Button>
            <p className="text-center">
              <Link
                href="/login"
                className="text-sm font-semibold text-muted-foreground hover:text-foreground"
              >
                Voltar para a entrada
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
