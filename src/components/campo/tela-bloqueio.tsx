"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  appDesbloqueadoNaSessao,
  biometriaAtivada,
  desbloquearComBiometria,
} from "@/lib/campo/biometria";

/**
 * Tela de bloqueio do App de Campo (trava local, não autenticação).
 *
 * Aparece ao abrir o app quando o desbloqueio por biometria está ativado;
 * o destrave vale para a sessão de página (navegar entre abas não trava
 * de novo; recarregar o app trava). Sem biometria ativada, não renderiza
 * nada e o app segue como sempre.
 */
export function TelaBloqueio() {
  const [travado, setTravado] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    void biometriaAtivada().then((ativada) => {
      if (ativo && ativada && !appDesbloqueadoNaSessao()) setTravado(true);
    });
    return () => {
      ativo = false;
    };
  }, []);

  if (!travado) return null;

  async function desbloquear() {
    setVerificando(true);
    setErro(null);
    try {
      await desbloquearComBiometria();
      setTravado(false);
    } catch (excecao) {
      setErro(
        excecao instanceof Error
          ? excecao.message
          : "Não foi possível desbloquear. Tente de novo.",
      );
    } finally {
      setVerificando(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="App de Campo bloqueado"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-sidebar p-6 text-center"
    >
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-3xl">
        ☕
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-white">
        Mundo Novo
      </h1>
      <p className="mt-1 text-sm font-medium text-white/70">
        App de Campo bloqueado — confirme que é você para continuar.
      </p>

      <div className="mt-8 w-full max-w-xs space-y-3">
        <Button
          size="lg"
          onClick={desbloquear}
          disabled={verificando}
          className="h-14 w-full gap-2 rounded-2xl bg-white text-base font-bold text-sidebar hover:bg-white/90"
        >
          <Fingerprint className="size-5" />
          {verificando ? "Verificando…" : "Desbloquear com biometria"}
        </Button>
        {erro ? (
          <p role="alert" className="text-sm font-semibold text-warning">
            {erro}
          </p>
        ) : null}
        <Link
          href="/login"
          className="block text-sm font-semibold text-white/80 underline-offset-4 hover:underline"
        >
          Usar senha
        </Link>
      </div>
    </div>
  );
}
