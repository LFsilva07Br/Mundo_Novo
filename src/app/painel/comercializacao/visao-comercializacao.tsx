"use client";

import { Fragment, useState, useTransition } from "react";
import {
  AlertTriangle,
  Banknote,
  ChevronDown,
  ChevronUp,
  HandCoins,
  Package,
  Truck,
  Warehouse,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EstadoVazio } from "@/components/estado-vazio";
import {
  atualizarStatusNegociacao,
  marcarLoteEntregue,
  type ResultadoAcao,
} from "@/lib/comercializacao/acoes";
import type { Lote, OpcaoSafra } from "@/lib/comercializacao/consultas";
import {
  calcularKpis,
  formatarPreco,
  formatarSacas,
  ROTULO_STATUS_LOTE,
  ROTULO_STATUS_NEGOCIACAO,
  type StatusLote,
  type StatusNegociacao,
} from "@/lib/comercializacao/regras";
import {
  BotaoEditarLote,
  BotaoNovaNegociacao,
  BotaoNovoLote,
  type OpcaoCliente,
} from "./dialogos";

const VARIANTE_STATUS_LOTE: Record<
  StatusLote,
  "default" | "secondary" | "outline" | "destructive"
> = {
  estoque: "outline",
  negociado: "default",
  entregue: "secondary",
};

const VARIANTE_STATUS_NEGOCIACAO: Record<
  StatusNegociacao,
  "default" | "secondary" | "outline" | "destructive"
> = {
  proposta: "outline",
  fechada: "default",
  cancelada: "destructive",
};

function formatarData(data: string): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function CartaoKpi({
  titulo,
  valor,
  detalhe,
  icone,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
  icone: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {titulo}
          </p>
          <p className="mt-1 truncate text-2xl font-extrabold tracking-tight">
            {valor}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-2 text-primary">{icone}</div>
      </CardContent>
    </Card>
  );
}

type Props = {
  lotes: Lote[];
  clientes: OpcaoCliente[];
  safras: OpcaoSafra[];
  modoDemo: boolean;
};

export function VisaoComercializacao({
  lotes,
  clientes,
  safras,
  modoDemo,
}: Props) {
  const [loteExpandido, setLoteExpandido] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [idPendente, setIdPendente] = useState<string | null>(null);
  const [, iniciarTransicao] = useTransition();

  const kpis = calcularKpis(lotes);

  const opcoesLote = lotes
    .filter((l) => l.status !== "entregue")
    .map((l) => ({
      id: l.id,
      identificacao: l.identificacao,
      clienteNome: l.clienteNome,
      saldoDisponivel: l.saldoDisponivel,
    }));

  function executar(id: string, acao: () => Promise<ResultadoAcao>) {
    setErro(null);
    setIdPendente(id);
    iniciarTransicao(async () => {
      try {
        const resultado = await acao();
        if (!resultado.ok) setErro(resultado.erro);
      } finally {
        setIdPendente(null);
      }
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Comercial
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Comercialização de café
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lotes, negociações e entregas — com rastreabilidade dos talhões de
            origem de cada lote.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BotaoNovaNegociacao lotes={opcoesLote} />
          <BotaoNovoLote clientes={clientes} safras={safras} />
        </div>
      </div>

      {erro ? (
        <p className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          {erro}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CartaoKpi
          titulo="Sacas em estoque"
          valor={formatarSacas(kpis.sacasEmEstoque)}
          detalhe="Saldo disponível dos lotes não entregues"
          icone={<Warehouse className="size-5" />}
        />
        <CartaoKpi
          titulo="Sacas negociadas"
          valor={formatarSacas(kpis.sacasNegociadasSafra)}
          detalhe={
            kpis.safraDasNegociacoes
              ? `Negociações fechadas na safra ${kpis.safraDasNegociacoes}`
              : "Negociações fechadas"
          }
          icone={<HandCoins className="size-5" />}
        />
        <CartaoKpi
          titulo="Preço médio (fechadas)"
          valor={
            kpis.precoMedioFechadas === null
              ? "—"
              : formatarPreco(kpis.precoMedioFechadas)
          }
          detalhe="Média ponderada por saca das vendas fechadas"
          icone={<Banknote className="size-5" />}
        />
        <CartaoKpi
          titulo="Receita estimada"
          valor={formatarPreco(kpis.receitaEstimada)}
          detalhe="Sacas × preço das negociações fechadas"
          icone={<Package className="size-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lotes de café</CardTitle>
          <CardDescription>
            Clique na seta de um lote para ver as negociações. Propostas não
            abatem o saldo — só negociações fechadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lotes.length === 0 ? (
            <EstadoVazio
              icone={Package}
              titulo="Nenhum lote cadastrado — comece pelo botão “Novo lote”."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Lote</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Safra</TableHead>
                    <TableHead className="text-right">Sacas</TableHead>
                    <TableHead className="text-right">Saldo disponível</TableHead>
                    <TableHead>Peneira · Bebida</TableHead>
                    <TableHead>Talhões de origem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lotes.map((lote) => {
                    const expandido = loteExpandido === lote.id;
                    return (
                      <Fragment key={lote.id}>
                        <TableRow>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Ver negociações do lote ${lote.identificacao}`}
                              aria-expanded={expandido}
                              onClick={() =>
                                setLoteExpandido(expandido ? null : lote.id)
                              }
                            >
                              {expandido ? <ChevronUp /> : <ChevronDown />}
                            </Button>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {lote.identificacao}
                          </TableCell>
                          <TableCell>{lote.clienteNome}</TableCell>
                          <TableCell>{lote.safraRotulo ?? "—"}</TableCell>
                          <TableCell className="text-right">
                            {formatarSacas(lote.sacas)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatarSacas(lote.saldoDisponivel)}
                          </TableCell>
                          <TableCell>
                            {[lote.peneira, lote.bebida]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </TableCell>
                          <TableCell className="max-w-40 truncate">
                            {lote.origemTalhoes ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={VARIANTE_STATUS_LOTE[lote.status]}>
                              {ROTULO_STATUS_LOTE[lote.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <BotaoEditarLote
                                lote={lote}
                                clientes={clientes}
                                safras={safras}
                              />
                              {lote.status === "negociado" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={idPendente === lote.id}
                                  onClick={() =>
                                    executar(lote.id, () =>
                                      marcarLoteEntregue(lote.id),
                                    )
                                  }
                                >
                                  <Truck data-icon="inline-start" />
                                  Entregar
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandido ? (
                          <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableCell colSpan={10} className="p-4">
                              {lote.negociacoes.length === 0 ? (
                                <EstadoVazio
                                  icone={HandCoins}
                                  titulo="Nenhuma negociação registrada para este lote."
                                  className="py-6"
                                />
                              ) : (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Data</TableHead>
                                      <TableHead>Comprador</TableHead>
                                      <TableHead className="text-right">
                                        Sacas
                                      </TableHead>
                                      <TableHead className="text-right">
                                        Preço/saca
                                      </TableHead>
                                      <TableHead>Contrato</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead className="text-right">
                                        Ações
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {lote.negociacoes.map((negociacao) => (
                                      <TableRow key={negociacao.id}>
                                        <TableCell>
                                          {formatarData(negociacao.data)}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                          {negociacao.comprador}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {formatarSacas(negociacao.sacas)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {formatarPreco(
                                            negociacao.precoPorSaca,
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          {negociacao.contrato ?? "—"}
                                        </TableCell>
                                        <TableCell>
                                          <Badge
                                            variant={
                                              VARIANTE_STATUS_NEGOCIACAO[
                                                negociacao.status
                                              ]
                                            }
                                          >
                                            {
                                              ROTULO_STATUS_NEGOCIACAO[
                                                negociacao.status
                                              ]
                                            }
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          {negociacao.status === "proposta" ? (
                                            <div className="flex items-center justify-end gap-1">
                                              <Button
                                                size="sm"
                                                disabled={
                                                  idPendente === negociacao.id
                                                }
                                                onClick={() =>
                                                  executar(negociacao.id, () =>
                                                    atualizarStatusNegociacao(
                                                      negociacao.id,
                                                      "fechada",
                                                    ),
                                                  )
                                                }
                                              >
                                                Fechar
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={
                                                  idPendente === negociacao.id
                                                }
                                                onClick={() =>
                                                  executar(negociacao.id, () =>
                                                    atualizarStatusNegociacao(
                                                      negociacao.id,
                                                      "cancelada",
                                                    ),
                                                  )
                                                }
                                              >
                                                Cancelar
                                              </Button>
                                            </div>
                                          ) : null}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {modoDemo ? (
        <p className="text-xs text-muted-foreground">
          Modo demonstração: os lotes exibidos são exemplos da Fazenda Alto da
          Serra e os cadastros não são gravados.
        </p>
      ) : null}
    </div>
  );
}
