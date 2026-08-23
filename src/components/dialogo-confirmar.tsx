"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Confirmação de decisão importante — sempre explicando, em linguagem de
 * negócio, o que a ação faz e o que ela NÃO faz. Usado ao concluir uma
 * visita e ao aprovar/rejeitar um contrato.
 */

type Props = {
  aberto: boolean;
  aoMudarAberto: (aberto: boolean) => void;
  titulo: string;
  descricao: string;
  /** O que acontece ao confirmar (linguagem de negócio, uma frase por item). */
  oQueAcontece?: string[];
  /** O que NÃO acontece — evita a sensação de decidir às cegas. */
  oQueNaoAcontece?: string[];
  /** Campo extra (ex.: motivo obrigatório da rejeição). */
  children?: ReactNode;
  rotuloConfirmar: string;
  rotuloCancelar?: string;
  /** Confirmação destrutiva pinta o botão de vermelho. */
  destrutivo?: boolean;
  confirmarDesabilitado?: boolean;
  aoConfirmar: () => void;
};

export function DialogoConfirmar({
  aberto,
  aoMudarAberto,
  titulo,
  descricao,
  oQueAcontece = [],
  oQueNaoAcontece = [],
  children,
  rotuloConfirmar,
  rotuloCancelar = "Cancelar",
  destrutivo = false,
  confirmarDesabilitado = false,
  aoConfirmar,
}: Props) {
  return (
    <Dialog open={aberto} onOpenChange={aoMudarAberto}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>

        {oQueAcontece.length > 0 ? (
          <div className="space-y-1.5 rounded-xl bg-muted p-3">
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
              O que acontece
            </p>
            <ul className="list-disc space-y-1 pl-4 text-sm">
              {oQueAcontece.map((linha) => (
                <li key={linha}>{linha}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {oQueNaoAcontece.length > 0 ? (
          <div className="space-y-1.5 rounded-xl border border-dashed p-3">
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
              O que NÃO acontece
            </p>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {oQueNaoAcontece.map((linha) => (
                <li key={linha}>{linha}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {children}

        <DialogFooter>
          <Button variant="outline" onClick={() => aoMudarAberto(false)}>
            {rotuloCancelar}
          </Button>
          <Button
            variant={destrutivo ? "destructive" : "default"}
            disabled={confirmarDesabilitado}
            onClick={aoConfirmar}
          >
            {rotuloConfirmar}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
