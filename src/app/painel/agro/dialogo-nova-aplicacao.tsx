"use client";

import { useActionState, useState } from "react";
import { SprayCan } from "lucide-react";
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
import { registrarAplicacao, type EstadoAcao } from "@/lib/agro/acoes";

export type OpcaoTalhao = { id: string; nome: string; imovelNome: string };
export type OpcaoProduto = { id: string; nome: string; proibidoRa: boolean };
export type OpcaoAplicador = { id: string; nome: string };

const CLASSE_SELECT =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * Registro de aplicação de defensivo. Ao selecionar um produto proibido
 * pela RA, o aviso aparece na hora — e o servidor registra a aplicação
 * criando o alerta crítico correspondente.
 */
export function DialogoNovaAplicacao({
  clienteId,
  talhoes,
  produtos,
  aplicadores,
}: {
  clienteId: string;
  talhoes: OpcaoTalhao[];
  produtos: OpcaoProduto[];
  aplicadores: OpcaoAplicador[];
}) {
  const [aberto, setAberto] = useState(false);
  const [produtoId, setProdutoId] = useState("");
  const [estado, acao, pendente] = useActionState<EstadoAcao, FormData>(
    registrarAplicacao,
    null,
  );

  const produtoSelecionado = produtos.find((p) => p.id === produtoId);

  return (
    <>
      <Button onClick={() => setAberto(true)}>
        <SprayCan className="size-4" />
        Nova aplicação
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar aplicação de defensivo</DialogTitle>
            <DialogDescription>
              O sistema confere a lista de banidos da RA e o treinamento
              NR-31 do aplicador na data — irregularidade vira alerta crítico.
            </DialogDescription>
          </DialogHeader>

          <form action={acao} className="space-y-4">
            <input type="hidden" name="clienteId" value={clienteId} />

            <div className="space-y-2">
              <Label htmlFor="aplicacao-talhao">Talhão</Label>
              <select
                id="aplicacao-talhao"
                name="talhaoId"
                required
                defaultValue=""
                className={CLASSE_SELECT}
              >
                <option value="" disabled>
                  Selecione o talhão
                </option>
                {talhoes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome} · {t.imovelNome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aplicacao-produto">Produto</Label>
              <select
                id="aplicacao-produto"
                name="produtoId"
                required
                value={produtoId}
                onChange={(evento) => setProdutoId(evento.target.value)}
                className={CLASSE_SELECT}
              >
                <option value="" disabled>
                  Selecione o produto
                </option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                    {p.proibidoRa ? " — PROIBIDO PELA RA" : ""}
                  </option>
                ))}
              </select>
              {produtoSelecionado?.proibidoRa ? (
                <p
                  role="alert"
                  className="rounded-lg bg-destructive/10 p-2 text-xs font-semibold text-destructive"
                >
                  Atenção: {produtoSelecionado.nome} está na lista de banidos
                  da Rainforest Alliance. O registro será feito, mas um alerta
                  crítico entrará na agenda.
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="aplicacao-dose">Dose (opcional)</Label>
                <Input
                  id="aplicacao-dose"
                  name="dose"
                  placeholder="Ex.: 2,5 L/ha"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aplicacao-data">Data</Label>
                <Input id="aplicacao-data" name="data" type="date" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aplicacao-aplicador">Aplicador</Label>
              <select
                id="aplicacao-aplicador"
                name="aplicadorId"
                defaultValue=""
                className={CLASSE_SELECT}
              >
                <option value="">Sem aplicador informado</option>
                {aplicadores.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aplicacao-equipamento">
                Equipamento (opcional)
              </Label>
              <Input
                id="aplicacao-equipamento"
                name="equipamento"
                placeholder="Ex.: pulverizador de barra"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aplicacao-observacao">
                Observação (opcional)
              </Label>
              <Input
                id="aplicacao-observacao"
                name="observacao"
                placeholder="Ex.: manejo das ruas do café"
              />
            </div>

            {estado && !estado.ok ? (
              <p role="alert" className="text-sm font-medium text-destructive">
                {estado.erro}
              </p>
            ) : null}
            {estado?.ok ? (
              <div className="space-y-2">
                <p role="status" className="text-sm font-medium text-primary">
                  {estado.mensagem}
                </p>
                {estado.avisos?.map((aviso) => (
                  <p
                    key={aviso}
                    role="alert"
                    className="rounded-lg bg-destructive/10 p-2 text-sm font-semibold text-destructive"
                  >
                    {aviso}
                  </p>
                ))}
              </div>
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
                {pendente ? "Registrando…" : "Registrar aplicação"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
