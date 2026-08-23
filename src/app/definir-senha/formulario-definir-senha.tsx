"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { confirmarTrocaSenha } from "./acoes";

/** Tamanho mínimo da senha — explicado ANTES de virar mensagem de erro. */
const MINIMO_CARACTERES = 8;

export function FormularioDefinirSenha() {
  const router = useRouter();
  const parametros = useSearchParams();
  // ?obrigatoria=1 vem do fluxo em que o gestor exige a troca de senha.
  // Antes o parâmetro era simplesmente ignorado e a pessoa caía numa tela
  // idêntica à do convite, sem entender por que estava ali.
  const obrigatoria = parametros.get("obrigatoria") === "1";

  const supabase = useMemo(() => createClient(), []);
  const [pronto, setPronto] = useState(() => supabase === null);
  const [semSessao, setSemSessao] = useState(() => supabase === null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

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

    if (senha.length < MINIMO_CARACTERES) {
      setErro(
        `A senha precisa ter pelo menos ${MINIMO_CARACTERES} caracteres — você digitou ${senha.length}. Vale juntar letras, números e espaços.`,
      );
      return;
    }
    if (senha !== confirmacao) {
      setErro("As senhas não conferem — digite a mesma senha nos dois campos.");
      return;
    }

    setSalvando(true);
    setErro(null);
    const { error } = await supabase.auth.updateUser({ password: senha });

    if (error) {
      setSalvando(false);
      setErro("Não foi possível salvar a senha. Tente novamente.");
      return;
    }
    await confirmarTrocaSenha();
    setSalvando(false);
    router.replace("/painel");
  }

  return (
    <Card className="border-white/10 bg-white shadow-2xl">
      <CardContent className="pt-6">
        {!pronto ? (
          <p className="py-4 text-center text-base text-muted-foreground">
            Validando seu convite…
          </p>
        ) : semSessao ? (
          <ConviteExpirado />
        ) : (
          <form onSubmit={aoEnviar} className="space-y-4">
            {obrigatoria ? (
              <div
                role="status"
                className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-base leading-relaxed"
              >
                <p className="font-extrabold">
                  Você precisa criar uma senha nova para continuar.
                </p>
                <p className="mt-1">
                  A senha que você usava foi marcada para troca obrigatória —
                  em geral porque era uma senha temporária enviada pela equipe,
                  ou porque já passou do prazo de renovação. Crie a senha nova
                  aqui e você entra direto, sem precisar fazer login de novo.
                </p>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="senha" className="text-base">
                Nova senha
              </Label>
              {/* A regra aparece antes de virar erro vermelho. */}
              <p className="text-base leading-relaxed text-muted-foreground">
                Precisa ter no mínimo {MINIMO_CARACTERES} caracteres. Uma frase
                fácil de lembrar já resolve — por exemplo,{" "}
                <span className="font-semibold">cafe do serrado</span>.
              </p>
              <div className="relative">
                <Input
                  id="senha"
                  name="senha"
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={MINIMO_CARACTERES}
                  placeholder={`mínimo ${MINIMO_CARACTERES} caracteres`}
                  required
                  className="h-11 pr-14 text-base md:text-base"
                />
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
            <div className="space-y-2">
              <Label htmlFor="confirmacao" className="text-base">
                Repita a senha
              </Label>
              <Input
                id="confirmacao"
                name="confirmacao"
                type={mostrarSenha ? "text" : "password"}
                autoComplete="new-password"
                required
                className="h-11 text-base md:text-base"
              />
            </div>
            {erro ? (
              <p role="alert" className="text-base font-medium text-destructive">
                {erro}
              </p>
            ) : null}
            <Button
              type="submit"
              size="lg"
              className="h-11 w-full text-base"
              disabled={salvando}
            >
              {salvando ? "Salvando…" : "Salvar senha e entrar"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Convite expirado: antes as duas saídas ("peça um novo convite", "use
 * Esqueci a senha") eram texto solto — a pessoa lia e ficava parada na tela.
 * Agora cada saída é um botão de verdade.
 */
function ConviteExpirado() {
  return (
    <div className="space-y-4 py-2">
      <div role="alert" className="text-base leading-relaxed">
        <p className="font-extrabold">Este link não vale mais.</p>
        <p className="mt-1 text-muted-foreground">
          Links de convite expiram depois de um tempo e só funcionam uma vez.
          Não é problema seu — é só pegar um link novo. Escolha um caminho:
        </p>
      </div>

      <Link
        href="/recuperar-senha"
        className="flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-base font-bold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Receber um link novo por e-mail
      </Link>
      <Link
        href="/login"
        className="flex min-h-11 w-full items-center justify-center rounded-lg border border-border px-4 text-base font-bold transition-colors hover:bg-muted"
      >
        Já tenho senha — ir para a entrada
      </Link>
    </div>
  );
}
