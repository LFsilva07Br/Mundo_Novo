"use client";

import { useActionState, useState } from "react";
import { Recycle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registrarDestinacao, type EstadoAcao } from "@/lib/agro/acoes";

/**
 * Registro da destinação de embalagens vazias (tríplice lavagem/devolução),
 * com upload opcional do comprovante para o bucket de evidências.
 */
export function DialogoRegistrarDestinacao({
  clienteId,
}: {
  clienteId: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao, pendente] = useActionState<EstadoAcao, FormData>(
    registrarDestinacao,
    null,
  );

  return (
    <>
      <Button variant="outline" onClick={() => setAberto(true)}>
        <Recycle className="size-4" />
        Registrar destinação de embalagens
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Destinação de embalagens</DialogTitle>
            <DialogDescription>
              Devolução das embalagens tríplice lavadas com comprovante —
              exigência da norma para o descarte de agroquímicos.
            </DialogDescription>
          </DialogHeader>

          <form action={acao} className="space-y-4">
            <input type="hidden" name="clienteId" value={clienteId} />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="destinacao-data">Data</Label>
                <Input id="destinacao-data" name="data" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destinacao-quantidade">
                  Quantidade (opcional)
                </Label>
                <Input
                  id="destinacao-quantidade"
                  name="quantidade"
                  type="number"
                  min={1}
                  placeholder="Ex.: 48"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destinacao-descricao">Descrição</Label>
              <Input
                id="destinacao-descricao"
                name="descricao"
                required
                placeholder="Ex.: devolução na central de recebimento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destinacao-comprovante">
                Comprovante (opcional — foto JPEG, PNG ou WebP)
              </Label>
              <Input
                id="destinacao-comprovante"
                name="comprovante"
                type="file"
                accept="image/jpeg,image/png,image/webp"
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
                {pendente ? "Registrando…" : "Registrar destinação"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
