"use client";

// Fronteiras de erro precisam ser Client Components.

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Tela de erro do painel.
 *
 * O PO não é desenvolvedor: nada de stack trace nem mensagem técnica. A tela
 * diz, em linguagem de negócio, que nada foi perdido e oferece dois caminhos —
 * tentar de novo ou voltar para o painel.
 */
export default function ErroPainel({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Registro técnico fica no console/servidor, nunca na cara do usuário.
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center"
    >
      <TriangleAlert className="size-10 text-destructive" aria-hidden />
      <h1 className="text-xl font-extrabold tracking-tight">
        Não conseguimos carregar esta tela agora
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Pode ter sido uma falha momentânea de conexão com o banco de dados.
        Nenhum dado foi perdido e nada do que você já registrou foi alterado.
      </p>
      <p className="max-w-md text-sm text-muted-foreground">
        Tente de novo. Se continuar assim, avise a equipe técnica informando a
        hora e o que você estava fazendo.
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <Button onClick={() => retry()}>
          <RefreshCcw data-icon="inline-start" />
          Tentar de novo
        </Button>
        <Button variant="outline" render={<Link href="/painel" />}>
          Voltar ao painel
        </Button>
      </div>

      {error.digest ? (
        <p className="text-xs text-muted-foreground">
          Código para a equipe técnica: {error.digest}
        </p>
      ) : null}
    </div>
  );
}
