"use client";

import { useActionState, useState } from "react";
import { GraduationCap, PenLine } from "lucide-react";
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
import {
  registrarParticipacaoTreinamento,
  type EstadoAcao,
} from "@/lib/social/acoes";

export type OpcaoTreinamento = {
  id: string;
  nome: string;
  periodicidadeMeses: number;
};
export type OpcaoTrabalhador = { id: string; nome: string };

const CLASSE_SELECT =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Registro de turma de treinamento: o vencimento é calculado no servidor
 * (realização + periodicidade do treinamento) e entra no motor de alertas.
 */
export function DialogoRegistrarTreinamento({
  treinamentos,
  trabalhadores,
}: {
  treinamentos: OpcaoTreinamento[];
  trabalhadores: OpcaoTrabalhador[];
}) {
  const [aberto, setAberto] = useState(false);
  // Colaboradores marcados na turma e assinaturas colhidas na tela.
  const [marcados, setMarcados] = useState<string[]>([]);
  const [assinaturas, setAssinaturas] = useState<Record<string, string>>({});
  const [assinando, setAssinando] = useState<string | null>(null);
  const [estado, acao, pendente] = useActionState<EstadoAcao, FormData>(
    registrarParticipacaoTreinamento,
    null,
  );

  function alternarMarcado(id: string, marcado: boolean) {
    setMarcados((atuais) =>
      marcado ? [...atuais, id] : atuais.filter((m) => m !== id),
    );
    if (!marcado && assinando === id) setAssinando(null);
  }

  function registrarAssinatura(dataUrl: string | null) {
    if (!assinando) return;
    const id = assinando;
    setAssinaturas((atuais) => {
      if (dataUrl === null) {
        const restantes = { ...atuais };
        delete restantes[id];
        return restantes;
      }
      return { ...atuais, [id]: dataUrl };
    });
  }

  const nomeAssinando = trabalhadores.find((t) => t.id === assinando)?.nome;

  return (
    <>
      <Button variant="outline" onClick={() => setAberto(true)}>
        <GraduationCap className="size-4" />
        Registrar treinamento
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar treinamento</DialogTitle>
            <DialogDescription>
              O vencimento é calculado pela periodicidade do treinamento e
              alimenta o motor de alertas.
            </DialogDescription>
          </DialogHeader>

          <form action={acao} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="participacao-treinamento">Treinamento</Label>
              <select
                id="participacao-treinamento"
                name="treinamentoId"
                required
                defaultValue=""
                className={CLASSE_SELECT}
              >
                <option value="" disabled>
                  Selecione o treinamento
                </option>
                {treinamentos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome} (a cada {t.periodicidadeMeses} meses)
                  </option>
                ))}
              </select>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">
                Colaboradores que participaram
              </legend>
              <div className="grid gap-1.5">
                {trabalhadores.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="trabalhadorIds"
                        value={t.id}
                        className="size-4"
                        onChange={(e) =>
                          alternarMarcado(t.id, e.currentTarget.checked)
                        }
                      />
                      {t.nome}
                    </label>
                    {marcados.includes(t.id) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAssinando(t.id)}
                      >
                        <PenLine className="size-3.5" />
                        {assinaturas[t.id] ? "Assinado ✓" : "Assinar"}
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            </fieldset>

            {assinando ? (
              <div className="space-y-2 rounded-xl border p-3">
                <p className="text-sm font-medium">
                  Assinatura de {nomeAssinando} (opcional)
                </p>
                <QuadroAssinatura key={assinando} onChange={registrarAssinatura} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAssinando(null)}
                >
                  Concluir assinatura
                </Button>
              </div>
            ) : null}

            {marcados
              .filter((id) => assinaturas[id])
              .map((id) => (
                <input
                  key={id}
                  type="hidden"
                  name={`assinatura-${id}`}
                  value={assinaturas[id]}
                />
              ))}

            <div className="space-y-2">
              <Label htmlFor="participacao-data">Data de realização</Label>
              <Input
                id="participacao-data"
                name="realizadoEm"
                type="date"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="participacao-observacao">
                Observação (opcional)
              </Label>
              <Input
                id="participacao-observacao"
                name="observacao"
                placeholder="Ex.: turma da colheita"
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
                {pendente ? "Registrando…" : "Registrar turma"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
