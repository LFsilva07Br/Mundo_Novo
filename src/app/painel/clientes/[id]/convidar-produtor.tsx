"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
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
import { convidarProdutor } from "@/lib/portal/acoes";

/**
 * Dialog da ficha do cliente para convidar o produtor ao Portal do Produtor.
 * O convite chega por e-mail com link para definir a senha; o perfil criado
 * fica vinculado ao cliente (cliente_id) e só enxerga os próprios dados.
 */
export function ConvidarProdutor({
  clienteId,
  nomeSugerido,
}: {
  clienteId: string;
  nomeSugerido?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, iniciarTransicao] = useTransition();

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    const dados = new FormData(evento.currentTarget);
    const nome = String(dados.get("nome") ?? "").trim();
    const email = String(dados.get("email") ?? "").trim();

    iniciarTransicao(async () => {
      const resultado = await convidarProdutor({ clienteId, nome, email });
      if (resultado.ok) {
        toast.success(resultado.mensagem);
        setAberto(false);
      } else {
        setErro(resultado.erro);
      }
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <UserPlus className="size-4" />
        Convidar produtor para o portal
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar produtor para o portal</DialogTitle>
          <DialogDescription>
            O produtor recebe um e-mail com o link para definir a senha e passa
            a acompanhar certificado, pendências e relatórios da própria
            fazenda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={enviar} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="produtor-nome">Nome do produtor</Label>
            <Input
              id="produtor-nome"
              name="nome"
              defaultValue={nomeSugerido ?? ""}
              placeholder="Ex.: Silvio Dutra"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="produtor-email">E-mail</Label>
            <Input
              id="produtor-email"
              name="email"
              type="email"
              placeholder="produtor@exemplo.com.br"
              required
            />
          </div>

          {erro ? (
            <p role="alert" className="text-sm font-semibold text-destructive">
              {erro}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={enviando}>
              {enviando ? "Enviando…" : "Enviar convite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
