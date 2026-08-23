"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { marcarQueixaTratada, type EstadoAcao } from "@/lib/compliance/acoes";
import type { StatusCaso } from "@/lib/compliance/consultas";

/**
 * Encerramento de queixa: só é aceita como tratada se o caso vinculado já
 * foi encerrado — ou com uma justificativa de quem tratou (regra também
 * validada no servidor).
 */
export function DialogoTratarQueixa({
  queixaId,
  casoStatus,
}: {
  queixaId: string;
  casoStatus?: StatusCaso;
}) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao, pendente] = useActionState<EstadoAcao, FormData>(
    marcarQueixaTratada,
    null,
  );

  const casoEncerrado = casoStatus === "encerrado";

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setAberto(true)}>
        Marcar tratada
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Marcar queixa como tratada</DialogTitle>
            <DialogDescription>
              {casoEncerrado
                ? "O caso vinculado já foi encerrado com remediação — a queixa pode ser concluída."
                : "Sem caso encerrado, é preciso justificar como a queixa foi resolvida."}
            </DialogDescription>
          </DialogHeader>

          <form action={acao} className="space-y-4">
            <input type="hidden" name="queixaId" value={queixaId} />

            {!casoEncerrado ? (
              <div className="space-y-2">
                <Label htmlFor={`justificativa-${queixaId}`}>
                  Como a queixa foi resolvida?
                </Label>
                <textarea
                  id={`justificativa-${queixaId}`}
                  name="justificativa"
                  required
                  rows={3}
                  placeholder="Ex.: chuveiro do alojamento consertado no dia 20/08, confirmado com a equipe."
                  className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                />
              </div>
            ) : null}

            {estado && !estado.ok ? (
              <p role="alert" className="text-sm font-medium text-destructive">
                {estado.erro}
              </p>
            ) : null}
            {estado?.ok ? (
              <p role="status" className="text-sm font-medium text-primary">
                {estado.mensagem}
              </p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAberto(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pendente}>
                {pendente ? "Salvando…" : "Confirmar tratamento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
