"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  CalendarCheck2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { DialogoConfirmar } from "@/components/dialogo-confirmar";
import {
  definirPlanejamento,
  removerPlanejamento,
} from "@/lib/planejamento/acoes";
import {
  calcularCobertura,
  type PlanejamentoComStatus,
} from "@/lib/planejamento/regras";
import {
  MESES_CURTOS,
  MESES_LONGOS,
  ROTULO_TIPO_PLANEJAMENTO,
  TIPOS_PLANEJAMENTO,
  type TipoPlanejamento,
} from "@/lib/planejamento/tipos";
import { cn } from "@/lib/utils";

type ClienteLinha = { id: string; nome: string };

type Props = {
  ano: number;
  clientes: ClienteLinha[];
  planejamentos: PlanejamentoComStatus[];
  modoDemo: boolean;
};

type CelulaEscolhida = {
  cliente: ClienteLinha;
  mes: number;
  existente: PlanejamentoComStatus | null;
};

const ESTILO_CAMPO =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none";

/** Grade ano × clientes: cada célula define o mês previsto da visita. */
export function GradePlanejamento({
  ano,
  clientes,
  planejamentos,
  modoDemo,
}: Props) {
  // Estado local usado apenas no modo demonstração (simulação sem gravar);
  // conectado ao banco, a revalidação do servidor atualiza as props.
  const [planejamentosLocais, setPlanejamentosLocais] = useState(planejamentos);
  const [celula, setCelula] = useState<CelulaEscolhida | null>(null);
  const [pendente, iniciarTransicao] = useTransition();

  const exibidos = modoDemo ? planejamentosLocais : planejamentos;

  const porCliente = useMemo(() => {
    const mapa = new Map<string, PlanejamentoComStatus[]>();
    for (const planejamento of exibidos) {
      const lista = mapa.get(planejamento.clienteId) ?? [];
      lista.push(planejamento);
      mapa.set(planejamento.clienteId, lista);
    }
    return mapa;
  }, [exibidos]);

  const cobertura = useMemo(
    () => calcularCobertura(clientes, exibidos),
    [clientes, exibidos],
  );
  const semPlanejamento = clientes.filter((c) =>
    cobertura.semPlanejamento.includes(c.id),
  );

  function abrirCelula(cliente: ClienteLinha, mes: number) {
    const doCliente = porCliente.get(cliente.id) ?? [];
    // Prioriza o planejamento já naquele mês; senão, o primeiro do cliente
    // (o dialog permite mover o mês previsto).
    const existente =
      doCliente.find((p) => p.mesPrevisto === mes) ?? doCliente[0] ?? null;
    setCelula({ cliente, mes, existente });
  }

  function aoDefinir(dados: {
    clienteId: string;
    mesPrevisto: number;
    tipo: TipoPlanejamento;
    observacao?: string;
  }) {
    if (modoDemo) {
      setPlanejamentosLocais((atuais) => {
        const semEsseTipo = atuais.filter(
          (p) => !(p.clienteId === dados.clienteId && p.tipo === dados.tipo),
        );
        return [
          ...semEsseTipo,
          {
            id: `demo-novo-${dados.clienteId}-${dados.tipo}`,
            clienteId: dados.clienteId,
            ano,
            mesPrevisto: dados.mesPrevisto,
            tipo: dados.tipo,
            visitaId: null,
            observacao: dados.observacao ?? null,
            realizado: false,
          },
        ];
      });
      toast.success(
        `Visita planejada para ${MESES_LONGOS[dados.mesPrevisto - 1]} de ${ano}.`,
      );
      setCelula(null);
      return;
    }
    iniciarTransicao(async () => {
      const resultado = await definirPlanejamento({ ...dados, ano });
      if (resultado.ok) {
        toast.success(resultado.mensagem);
        setCelula(null);
      } else {
        toast.error(resultado.erro);
      }
    });
  }

  function aoRemover(clienteId: string, tipo: TipoPlanejamento) {
    if (modoDemo) {
      setPlanejamentosLocais((atuais) =>
        atuais.filter((p) => !(p.clienteId === clienteId && p.tipo === tipo)),
      );
      toast.success("Planejamento removido.");
      setCelula(null);
      return;
    }
    iniciarTransicao(async () => {
      const resultado = await removerPlanejamento({ clienteId, ano, tipo });
      if (resultado.ok) {
        toast.success(resultado.mensagem);
        setCelula(null);
      } else {
        toast.error(resultado.erro);
      }
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Cobertura da carteira
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Planejamento anual de visitas
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={`Ver ${ano - 1}`}
            render={<Link href={`/painel/planejamento?ano=${ano - 1}`} />}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-16 text-center text-lg font-extrabold">
            {ano}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={`Ver ${ano + 1}`}
            render={<Link href={`/painel/planejamento?ano=${ano + 1}`} />}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">
              {cobertura.planejados} / {cobertura.total}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              clientes com visita planejada
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">{cobertura.realizados}</p>
            <p className="text-xs font-semibold text-muted-foreground">
              planejamentos realizados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">{semPlanejamento.length}</p>
            <p className="text-xs font-semibold text-muted-foreground">
              clientes sem planejamento
            </p>
          </CardContent>
        </Card>
      </div>

      {semPlanejamento.length > 0 ? (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
          <p className="text-sm font-semibold">
            Sem planejamento em {ano}:{" "}
            {semPlanejamento.map((c) => c.nome).join(", ")}. Clique no mês
            desejado na grade para planejar a visita.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-secondary/60 p-4">
          <CalendarCheck2 className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-sm font-semibold text-secondary-foreground">
            Cobertura completa: todos os clientes têm visita planejada em {ano}.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Grade {ano}</CardTitle>
          <CardDescription>
            Linhas são clientes, colunas são os meses. Clique em uma célula
            para definir ou mover o mês previsto. O selo{" "}
            <CheckCircle2 className="inline size-3.5 text-success" /> indica
            visita concluída perto do mês planejado (±1 mês).
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-card p-2 text-left text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                  Cliente
                </th>
                {MESES_CURTOS.map((mes) => (
                  <th
                    key={mes}
                    className="p-2 text-center text-xs font-extrabold uppercase tracking-wide text-muted-foreground"
                  >
                    {mes}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => {
                const doCliente = porCliente.get(cliente.id) ?? [];
                return (
                  <tr key={cliente.id} className="border-t">
                    <td className="sticky left-0 z-10 max-w-44 truncate border-t bg-card p-2 font-semibold">
                      {cliente.nome}
                    </td>
                    {MESES_CURTOS.map((_, indice) => {
                      const mes = indice + 1;
                      const noMes = doCliente.filter(
                        (p) => p.mesPrevisto === mes,
                      );
                      return (
                        <td key={mes} className="border-t p-1 text-center">
                          <button
                            type="button"
                            aria-label={`${cliente.nome} — ${MESES_LONGOS[indice]}`}
                            onClick={() => abrirCelula(cliente, mes)}
                            className={cn(
                              "flex min-h-10 w-full flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 transition-colors hover:bg-muted",
                              noMes.length === 0 && "text-muted-foreground/40",
                            )}
                          >
                            {noMes.length === 0 ? (
                              <span aria-hidden>·</span>
                            ) : (
                              noMes.map((planejamento) => (
                                <span
                                  key={planejamento.id}
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[11px] font-bold",
                                    planejamento.realizado
                                      ? "bg-success/15 text-success"
                                      : "bg-primary/10 text-primary",
                                  )}
                                >
                                  {planejamento.realizado ? (
                                    <CheckCircle2 className="size-3" />
                                  ) : null}
                                  {ROTULO_TIPO_PLANEJAMENTO[planejamento.tipo]}
                                </span>
                              ))
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <DialogoPlanejamento
        ano={ano}
        celula={celula}
        pendente={pendente}
        aoFechar={() => setCelula(null)}
        aoDefinir={aoDefinir}
        aoRemover={aoRemover}
      />
    </div>
  );
}

type PropsDialogo = {
  ano: number;
  celula: CelulaEscolhida | null;
  pendente: boolean;
  aoFechar: () => void;
  aoDefinir: (dados: {
    clienteId: string;
    mesPrevisto: number;
    tipo: TipoPlanejamento;
    observacao?: string;
  }) => void;
  aoRemover: (clienteId: string, tipo: TipoPlanejamento) => void;
};

function DialogoPlanejamento({
  ano,
  celula,
  pendente,
  aoFechar,
  aoDefinir,
  aoRemover,
}: PropsDialogo) {
  if (!celula) return null;
  const { cliente, mes, existente } = celula;

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {existente ? "Alterar planejamento" : "Planejar visita"}
          </DialogTitle>
          <DialogDescription>
            {cliente.nome} · {ano}
            {existente?.realizado
              ? " — já realizada (visita concluída vinculada)."
              : ""}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(evento) => {
            evento.preventDefault();
            const dados = new FormData(evento.currentTarget);
            aoDefinir({
              clienteId: cliente.id,
              mesPrevisto: Number(dados.get("mesPrevisto") ?? mes),
              tipo: String(
                dados.get("tipo") ?? "auditoria_interna",
              ) as TipoPlanejamento,
              observacao:
                String(dados.get("observacao") ?? "").trim() || undefined,
            });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="plan-mes">Mês previsto</Label>
              <select
                id="plan-mes"
                name="mesPrevisto"
                required
                className={ESTILO_CAMPO}
                defaultValue={mes}
              >
                {MESES_LONGOS.map((nome, indice) => (
                  <option key={nome} value={indice + 1}>
                    {nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-tipo">Tipo</Label>
              <select
                id="plan-tipo"
                name="tipo"
                required
                className={ESTILO_CAMPO}
                defaultValue={existente?.tipo ?? "auditoria_interna"}
              >
                {TIPOS_PLANEJAMENTO.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {ROTULO_TIPO_PLANEJAMENTO[tipo]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-observacao">Observação (opcional)</Label>
            <Input
              id="plan-observacao"
              name="observacao"
              defaultValue={existente?.observacao ?? ""}
              placeholder="Ex.: combinar com a colheita"
            />
          </div>
          <DialogFooter className="mt-2 gap-2">
            {existente ? (
              <DialogoConfirmar
                gatilho={
                  <Button type="button" variant="destructive" disabled={pendente}>
                    <Trash2 className="size-4" />
                    Remover
                  </Button>
                }
                titulo={`Remover o planejamento de ${cliente.nome}?`}
                oQueMuda={`A ${ROTULO_TIPO_PLANEJAMENTO[existente.tipo].toLowerCase()} prevista para ${MESES_LONGOS[existente.mesPrevisto - 1]} de ${ano} sai da grade e ${cliente.nome} volta a contar como cliente sem planejamento no ano.`}
                oQueNaoMuda={
                  existente.realizado
                    ? "A visita já realizada e o laudo dela continuam no sistema — só o planejamento do ano sai da grade."
                    : "Visitas já realizadas, CAPAs e o histórico do cliente continuam intactos — só o mês previsto sai da grade."
                }
                rotuloAcao="Remover planejamento"
                destrutivo
                pendente={pendente}
                aoConfirmar={() => aoRemover(cliente.id, existente.tipo)}
              />
            ) : null}
            <Button type="submit" disabled={pendente}>
              {existente ? "Salvar alteração" : "Planejar visita"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
