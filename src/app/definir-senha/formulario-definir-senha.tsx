"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function FormularioDefinirSenha() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [pronto, setPronto] = useState(() => supabase === null);
  const [semSessao, setSemSessao] = useState(() => supabase === null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    // O link do convite/recuperação traz a sessão na própria URL —
    // o cliente do Supabase a captura automaticamente ao carregar.
    const verificar = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setSemSessao(false);
        setPronto(true);
        return;
      }
      // aguarda o processamento do link (evento SIGNED_IN)
      const { data: escuta } = supabase.auth.onAuthStateChange((evento) => {
        if (evento === "SIGNED_IN" || evento === "PASSWORD_RECOVERY") {
          setSemSessao(false);
          setPronto(true);
        }
      });
      setTimeout(async () => {
        const {
          data: { session: agora },
        } = await supabase.auth.getSession();
        setSemSessao(!agora);
        setPronto(true);
      }, 2500);
      return () => escuta.subscription.unsubscribe();
    };
    void verificar();
  }, [supabase]);

  async function aoEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return;
    const dados = new FormData(e.currentTarget);
    const senha = String(dados.get("senha") ?? "");
    const confirmacao = String(dados.get("confirmacao") ?? "");

    if (senha.length < 8) {
      setErro("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (senha !== confirmacao) {
      setErro("As senhas não conferem — digite a mesma senha nos dois campos.");
      return;
    }

    setSalvando(true);
    setErro(null);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);

    if (error) {
      setErro("Não foi possível salvar a senha. Tente novamente.");
      return;
    }
    router.replace("/painel");
  }

  return (
    <Card className="border-white/10 bg-white shadow-2xl">
      <CardContent className="pt-6">
        {!pronto ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Validando seu convite…
          </p>
        ) : semSessao ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Este link de convite expirou ou já foi usado. Peça um novo convite
            ao gestor, ou use “Esqueci a senha” na tela de entrada.
          </p>
        ) : (
          <form onSubmit={aoEnviar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senha">Nova senha</Label>
              <Input
                id="senha"
                name="senha"
                type="password"
                autoComplete="new-password"
                placeholder="mínimo 8 caracteres"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmacao">Repita a senha</Label>
              <Input
                id="confirmacao"
                name="confirmacao"
                type="password"
                autoComplete="new-password"
                required
              />
            </div>
            {erro ? (
              <p role="alert" className="text-sm font-medium text-destructive">
                {erro}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar senha e entrar"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
