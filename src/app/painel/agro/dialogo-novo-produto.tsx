"use client";

import { useActionState, useState } from "react";
import { FlaskConical } from "lucide-react";
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
import { cadastrarProduto, type EstadoAcao } from "@/lib/agro/acoes";

/** Cadastro de produto no catálogo, com a flag de proibido pela RA. */
export function DialogoNovoProduto() {
  const [aberto, setAberto] = useState(false);
  const [proibido, setProibido] = useState(false);
  const [estado, acao, pendente] = useActionState<EstadoAcao, FormData>(
    cadastrarProduto,
    null,
  );

  return (
    <>
      <Button variant="outline" onClick={() => setAberto(true)}>
        <FlaskConical className="size-4" />
        Novo produto
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo produto agroquímico</DialogTitle>
            <DialogDescription>
              Marque como proibido os produtos da lista de banidos da
              Rainforest Alliance — aplicações deles geram alerta crítico.
            </DialogDescription>
          </DialogHeader>

          <form action={acao} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="produto-nome">Nome comercial</Label>
              <Input
                id="produto-nome"
                name="nome"
                required
                placeholder="Ex.: Glifosato 480 SL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="produto-ingrediente">
                Ingrediente ativo (opcional)
              </Label>
              <Input
                id="produto-ingrediente"
                name="ingredienteAtivo"
                placeholder="Ex.: Glifosato"
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="proibidoRa"
                className="size-4"
                checked={proibido}
                onChange={(evento) => setProibido(evento.target.checked)}
              />
              Proibido pela Rainforest Alliance (lista de banidos)
            </label>
            {proibido ? (
              <p className="rounded-lg bg-destructive/10 p-2 text-xs font-semibold text-destructive">
                Toda aplicação deste produto será registrada com alerta
                crítico na agenda.
              </p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="produto-observacao">Observação (opcional)</Label>
              <Input
                id="produto-observacao"
                name="observacao"
                placeholder="Ex.: fungicida para ferrugem"
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
                {pendente ? "Salvando…" : "Cadastrar produto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
