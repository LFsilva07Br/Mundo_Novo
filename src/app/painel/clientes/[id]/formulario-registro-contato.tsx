"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNativo } from "@/components/select-nativo";
import { registrarContato, type EstadoAcao } from "@/lib/carteira/acoes";
import {
  ROTULO_TIPO_REGISTRO,
  type TipoRegistroContato,
} from "@/lib/carteira/tipos";

/** Valor inicial do campo datetime-local (agora, no fuso local). */
function agoraLocal(): string {
  const agora = new Date();
  agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
  return agora.toISOString().slice(0, 16);
}

/** Dialog para registrar um contato feito com o cliente. */
export function FormularioRegistroContato({
  clienteId,
  abertoInicialmente = false,
}: {
  clienteId: string;
  abertoInicialmente?: boolean;
}) {
  const [aberto, setAberto] = useState(abertoInicialmente);
  const [estado, enviar, pendente] = useActionState<EstadoAcao, FormData>(
    async (estadoAnterior, formData) => {
      const resultado = await registrarContato(estadoAnterior, formData);
      if (resultado?.ok) {
        toast.success(resultado.mensagem);
        setAberto(false);
      }
      return resultado;
    },
    null,
  );

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        Novo registro
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar contato</DialogTitle>
          <DialogDescription>
            Guarde no histórico do cliente cada ligação, mensagem, reunião ou
            visita.
          </DialogDescription>
        </DialogHeader>

        <form action={enviar} className="space-y-4">
          <input type="hidden" name="clienteId" value={clienteId} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="registro-tipo">Tipo</Label>
              <SelectNativo id="registro-tipo" name="tipo" defaultValue="ligacao">
                {(
                  Object.entries(ROTULO_TIPO_REGISTRO) as [
                    TipoRegistroContato,
                    string,
                  ][]
                ).map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>
                    {rotulo}
                  </option>
                ))}
              </SelectNativo>
            </div>
            <div className="space-y-2">
              <Label htmlFor="registro-ocorrido-em">Quando ocorreu</Label>
              <Input
                id="registro-ocorrido-em"
                name="ocorridoEm"
                type="datetime-local"
                defaultValue={agoraLocal()}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="registro-assunto">Assunto</Label>
            <Input
              id="registro-assunto"
              name="assunto"
              placeholder="Ex.: Agendamento da auditoria interna"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registro-detalhes">Detalhes (opcional)</Label>
            <textarea
              id="registro-detalhes"
              name="detalhes"
              rows={3}
              placeholder="O que foi combinado, pendências, próximos passos…"
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registro-duracao">Duração em minutos (opcional)</Label>
            <Input
              id="registro-duracao"
              name="duracaoMinutos"
              type="number"
              min={1}
              max={1440}
              placeholder="30"
            />
          </div>

          {estado && !estado.ok ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {estado.erro}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={pendente}>
              {pendente ? "Registrando…" : "Registrar contato"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
