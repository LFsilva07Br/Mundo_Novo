"use client";

import { useState, useTransition } from "react";
import { Loader2, UserPlus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { convidarUsuario } from "@/lib/equipe/acoes";
import { PAPEIS, type PapelUsuario } from "@/lib/equipe/validacao";
import { Interruptor } from "./interruptor";

const ROTULOS_PAPEL = Object.fromEntries(
  PAPEIS.map((p) => [p.valor, p.rotulo]),
);

export function DialogoConvidar({ disponivel }: { disponivel: boolean }) {
  const [aberto, setAberto] = useState(false);
  const [papel, setPapel] = useState<PapelUsuario>("consultor");
  const [alcada, setAlcada] = useState(false);
  const [enviando, iniciarEnvio] = useTransition();

  function aoEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    const nome = String(dados.get("nome") ?? "").trim();
    const email = String(dados.get("email") ?? "").trim();

    iniciarEnvio(async () => {
      const resultado = await convidarUsuario({
        nome,
        email,
        papel,
        alcadaAprovacao: alcada,
      });
      if (resultado.ok) {
        toast.success(resultado.mensagem);
        setAberto(false);
        setPapel("consultor");
        setAlcada(false);
      } else {
        toast.error(resultado.erro);
      }
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger
        render={<Button disabled={!disponivel} />}
      >
        <UserPlus data-icon="inline-start" />
        Convidar usuário
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar usuário</DialogTitle>
          <DialogDescription>
            A pessoa recebe um e-mail com um link para definir a própria senha
            e entrar no sistema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={aoEnviar} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="convite-nome">Nome completo</Label>
            <Input
              id="convite-nome"
              name="nome"
              autoComplete="off"
              placeholder="Maria da Silva"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="convite-email">E-mail</Label>
            <Input
              id="convite-email"
              name="email"
              type="email"
              autoComplete="off"
              placeholder="nome@mundonovo.agr.br"
              required
            />
          </div>
          <div className="space-y-2">
            <Label id="convite-papel-rotulo">Papel</Label>
            <Select
              items={ROTULOS_PAPEL}
              value={papel}
              onValueChange={(valor) => setPapel(valor as PapelUsuario)}
            >
              <SelectTrigger
                className="w-full"
                aria-labelledby="convite-papel-rotulo"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAPEIS.map((p) => (
                  <SelectItem key={p.valor} value={p.valor}>
                    {p.rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
            <div>
              <p className="text-sm font-semibold">Alçada de aprovação</p>
              <p className="text-xs text-muted-foreground">
                Permite aprovar ou rejeitar contratos.
              </p>
            </div>
            <Interruptor
              ligado={alcada}
              aoAlternar={setAlcada}
              rotulo="Alçada de aprovação de contrato"
            />
          </div>
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAberto(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando}>
              {enviando ? (
                <>
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                  Enviando…
                </>
              ) : (
                "Enviar convite"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
