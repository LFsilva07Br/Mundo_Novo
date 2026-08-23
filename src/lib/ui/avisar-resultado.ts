"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

/** Resultado padrão das Server Actions do painel. */
export type ResultadoAvisavel =
  | { ok: true; mensagem?: string }
  | { ok: false; erro?: string; mensagem?: string }
  | null
  | undefined;

/**
 * Transforma o resultado de uma Server Action em aviso na tela.
 *
 * Formulários que usam `useActionState` guardam o resultado no estado; sem
 * isto, a pessoa fica sem saber se deu certo. O aviso dispara uma única vez
 * por resultado novo — reenviar o mesmo formulário avisa de novo.
 */
export function useAvisarResultado(
  estado: ResultadoAvisavel,
  {
    sucesso,
    aoDarCerto,
  }: {
    /** Texto do aviso de sucesso quando a ação não devolve mensagem própria. */
    sucesso?: string;
    /** Executado depois do aviso — normalmente fecha o diálogo. */
    aoDarCerto?: () => void;
  } = {},
) {
  const anterior = useRef<ResultadoAvisavel>(null);

  useEffect(() => {
    if (!estado || estado === anterior.current) {
      anterior.current = estado;
      return;
    }
    anterior.current = estado;

    if (estado.ok) {
      toast.success(estado.mensagem ?? sucesso ?? "Registro salvo.");
      aoDarCerto?.();
      return;
    }
    toast.error(
      estado.erro ?? estado.mensagem ?? "Não foi possível concluir a ação.",
    );
    // `sucesso` e `aoDarCerto` são recriados a cada render de quem chama; só o
    // resultado novo deve disparar o aviso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);
}
