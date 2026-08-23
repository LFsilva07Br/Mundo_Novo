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
import { atualizarStatusCaso, type EstadoAcao } from "@/lib/compliance/acoes";
import {
  ROTULOS_STATUS_CASO,
  STATUS_CASO,
  type DadosAtualizarStatusCaso,
} from "@/lib/compliance/validacao";

/**
 * Atualização de status do caso — para encerrar, a remediação aplicada é
 * obrigatória (regra do cap. 5.1, validada também no servidor).
 */
export function DialogoStatusCaso({
  casoId,
  statusAtual,
  remediacaoAtual,
}: {
  casoId: string;
  statusAtual: DadosAtualizarStatusCaso["status"];
  remediacaoAtual?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [status, setStatus] = useState<string>(statusAtual);
  const [estado, acao, pendente] = useActionState<EstadoAcao, FormData>(
    atualizarStatusCaso,
    null,
  );

  const encerrando = status === "encerrado";

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setAberto(true)}>
        Atualizar status
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar status do caso</DialogTitle>
            <DialogDescription>
              O caso só encerra com a remediação registrada — é ela que
              comprova o tratamento na auditoria.
            </DialogDescription>
          </DialogHeader>

          <form action={acao} className="space-y-4">
            <input type="hidden" name="id" value={casoId} />

            <div className="space-y-2">
              <Label htmlFor={`status-caso-${casoId}`}>Novo status</Label>
              <SelectNativo
                id={`status-caso-${casoId}`}
                name="status"
                value={status}
                onChange={(evento) => setStatus(evento.target.value)}
              >
                {STATUS_CASO.map((s) => (
                  <option key={s} value={s}>
                    {ROTULOS_STATUS_CASO[s]}
                  </option>
                ))}
              </SelectNativo>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`remediacao-caso-${casoId}`}>
                Remediação aplicada
                {encerrando ? " (obrigatória para encerrar)" : " (opcional)"}
              </Label>
              <textarea
                id={`remediacao-caso-${casoId}`}
                name="remediacao"
                rows={3}
                required={encerrando}
                defaultValue={remediacaoAtual}
                placeholder="O que foi feito para corrigir a situação e evitar que se repita?"
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
              />
              {encerrando ? (
                <p className="rounded-lg bg-warning/10 p-2 text-xs font-semibold text-warning">
                  Sem a remediação descrita, o encerramento é recusado.
                </p>
              ) : null}
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
                {pendente ? "Salvando…" : "Salvar status"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
