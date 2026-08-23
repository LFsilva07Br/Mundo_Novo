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
import { SelectNativo } from "@/components/select-nativo";
import { triarQueixa, type EstadoAcao } from "@/lib/compliance/acoes";
import { ROTULOS_TIPO_CASO, TIPOS_CASO } from "@/lib/compliance/validacao";

/**
 * Triagem de queixa recebida: converte em caso social (origem "queixa"),
 * vinculando o caso à queixa e movendo-a para "em análise".
 */
export function DialogoTriagemQueixa({
  queixaId,
  clienteId,
  mensagem,
}: {
  queixaId: string;
  clienteId: string;
  mensagem: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao, pendente] = useActionState<EstadoAcao, FormData>(
    triarQueixa,
    null,
  );

  return (
    <>
      <Button size="sm" onClick={() => setAberto(true)}>
        Triar → caso
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Converter queixa em caso</DialogTitle>
            <DialogDescription>
              A queixa passa a ficar em análise, vinculada ao caso — ela só
              poderá ser marcada como tratada quando o caso encerrar.
            </DialogDescription>
          </DialogHeader>

          <form action={acao} className="space-y-4">
            <input type="hidden" name="queixaId" value={queixaId} />
            <input type="hidden" name="clienteId" value={clienteId} />

            <div className="space-y-2">
              <Label htmlFor={`triagem-tipo-${queixaId}`}>Tipo do caso</Label>
              <SelectNativo id={`triagem-tipo-${queixaId}`} name="tipo" required>
                {TIPOS_CASO.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {ROTULOS_TIPO_CASO[tipo]}
                  </option>
                ))}
              </SelectNativo>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`triagem-descricao-${queixaId}`}>
                Descrição do caso
              </Label>
              <textarea
                id={`triagem-descricao-${queixaId}`}
                name="descricao"
                required
                rows={4}
                defaultValue={mensagem}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
              />
            </div>

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
                {pendente ? "Abrindo caso…" : "Abrir caso vinculado"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
