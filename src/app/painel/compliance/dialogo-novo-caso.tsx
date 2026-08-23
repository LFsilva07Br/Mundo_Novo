"use client";

import { useActionState, useState } from "react";
import { ShieldAlert } from "lucide-react";
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
import { criarCaso, type EstadoAcao } from "@/lib/compliance/acoes";
import { ROTULOS_TIPO_CASO, TIPOS_CASO } from "@/lib/compliance/validacao";

export type OpcaoClienteCaso = { id: string; nome: string };

/** Abertura manual de caso social (origem monitoramento ou auditoria). */
export function DialogoNovoCaso({
  clientes,
  clienteId,
}: {
  clientes: OpcaoClienteCaso[];
  clienteId: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao, pendente] = useActionState<EstadoAcao, FormData>(
    criarCaso,
    null,
  );

  return (
    <>
      <Button onClick={() => setAberto(true)}>
        <ShieldAlert className="size-4" />
        Novo caso
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo caso social</DialogTitle>
            <DialogDescription>
              Avaliar-e-tratar (cap. 5.1): todo caso identificado é
              registrado, tratado e só encerra com a remediação comprovada.
            </DialogDescription>
          </DialogHeader>

          <form action={acao} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="caso-cliente">Cliente</Label>
              <SelectNativo
                id="caso-cliente"
                name="clienteId"
                defaultValue={clienteId}
                required
              >
                {clientes.map((c) => (
                  <option key={`${c.id}-${c.nome}`} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </SelectNativo>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caso-tipo">Tipo do caso</Label>
              <SelectNativo id="caso-tipo" name="tipo" required>
                {TIPOS_CASO.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {ROTULOS_TIPO_CASO[tipo]}
                  </option>
                ))}
              </SelectNativo>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caso-origem">Origem</Label>
              <SelectNativo id="caso-origem" name="origem" required>
                <option value="monitoramento">Monitoramento interno</option>
                <option value="auditoria">Auditoria</option>
                <option value="queixa">Queixa</option>
              </SelectNativo>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caso-descricao">O que foi identificado?</Label>
              <textarea
                id="caso-descricao"
                name="descricao"
                required
                rows={4}
                placeholder="Descreva a situação, quem está envolvido e como foi identificada."
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="caso-remediacao">
                Remediação já iniciada (opcional)
              </Label>
              <textarea
                id="caso-remediacao"
                name="remediacao"
                rows={2}
                placeholder="Se alguma providência já foi tomada, registre aqui."
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
                {pendente ? "Salvando…" : "Abrir caso"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
