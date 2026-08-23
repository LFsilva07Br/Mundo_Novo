"use client";

import { useState, useTransition } from "react";
import { HardHat } from "lucide-react";
import { QuadroAssinatura } from "@/components/assinatura/quadro-assinatura";
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
import { entregarEpi } from "@/lib/social/epis";
import { EPIS_SUGERIDOS } from "@/lib/social/regras";
import type { EstadoAcao } from "@/lib/social/acoes";
import { useAvisarResultado } from "@/lib/ui/avisar-resultado";

export type OpcaoTrabalhadorEpi = { id: string; nome: string };

const CLASSE_SELECT =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Entrega de EPI com assinatura do colaborador direto na tela (opcional).
 * A ficha alimenta a tabela de entregas do módulo social.
 */
export function DialogoEntregarEpi({
  trabalhadores,
}: {
  trabalhadores: OpcaoTrabalhadorEpi[];
}) {
  const [aberto, setAberto] = useState(false);
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoAcao>(null);
  const [pendente, iniciarTransicao] = useTransition();
  useAvisarResultado(estado, {
    sucesso: "Entrega de EPI registrada na ficha do colaborador.",
    aoDarCerto: () => setAberto(false),
  });

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = new FormData(evento.currentTarget);
    const trabalhadorId = String(formulario.get("trabalhadorId") ?? "");
    const epi = String(formulario.get("epi") ?? "");
    const ca = String(formulario.get("ca") ?? "").trim();
    const quantidade = Number(formulario.get("quantidade") ?? 0);
    const entregueEm = String(formulario.get("entregueEm") ?? "");

    iniciarTransicao(async () => {
      const resultado = await entregarEpi(
        trabalhadorId,
        epi,
        ca === "" ? undefined : ca,
        quantidade,
        entregueEm,
        assinatura ?? undefined,
      );
      setEstado(resultado);
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setAberto(true)}>
        <HardHat className="size-4" />
        Entregar EPI
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Entregar EPI</DialogTitle>
            <DialogDescription>
              Registre a entrega e, se possível, colha a assinatura do
              colaborador direto na tela — a ficha fica arquivada como
              evidência.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={enviar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="epi-trabalhador">Colaborador(a)</Label>
              <select
                id="epi-trabalhador"
                name="trabalhadorId"
                required
                defaultValue=""
                className={CLASSE_SELECT}
              >
                <option value="" disabled>
                  Selecione o colaborador
                </option>
                {trabalhadores.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="epi-nome">EPI entregue</Label>
              <Input
                id="epi-nome"
                name="epi"
                required
                list="epis-sugeridos"
                placeholder="Ex.: Luva nitrílica"
              />
              <datalist id="epis-sugeridos">
                {EPIS_SUGERIDOS.map((epi) => (
                  <option key={epi} value={epi} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="epi-ca">CA (opcional)</Label>
                <Input id="epi-ca" name="ca" placeholder="Ex.: 32128" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="epi-quantidade">Quantidade</Label>
                <Input
                  id="epi-quantidade"
                  name="quantidade"
                  type="number"
                  min={1}
                  defaultValue={1}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="epi-data">Data da entrega</Label>
              <Input id="epi-data" name="entregueEm" type="date" required />
            </div>

            <div className="space-y-2">
              <Label>Assinatura do colaborador (opcional)</Label>
              <QuadroAssinatura onChange={setAssinatura} />
            </div>

            {estado && !estado.ok ? (
              <p role="alert" className="text-sm font-medium text-destructive">
                {estado.erro}
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
                {pendente ? "Registrando…" : "Registrar entrega"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
