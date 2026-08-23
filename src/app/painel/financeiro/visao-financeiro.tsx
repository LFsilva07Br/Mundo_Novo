"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  Copy,
  HandCoins,
  Info,
  Percent,
  RefreshCcw,
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
import {
  gerarFaturasDoMes,
  registrarPagamento,
  type ResultadoAcao,
} from "@/lib/financeiro/acoes";
import {
  formatarData,
  formatarMoeda,
  formatarPercentual,
  mensagemCobranca,
  recebimentosPorMes,
  receitaRecorrente,
  resumoFinanceiro,
  rotuloCompetencia,
  ROTULO_STATUS_FATURA,
  type ContratoFinanceiro,
  type Fatura,
  type StatusFatura,
} from "@/lib/financeiro/regras";
import { BotaoNovoContrato, type OpcaoCliente } from "./dialogos";

const VARIANTE_STATUS_FATURA: Record<
  StatusFatura,
  "default" | "secondary" | "outline" | "destructive"
> = {
  em_aberto: "outline",
  paga: "secondary",
  atrasada: "destructive",
};

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
  contratos: ContratoFinanceiro[];
  faturas: Fatura[];
  clientes: OpcaoCliente[];
  /** Data de referência (AAAA-MM-DD) — vem do servidor para a tela ser testável. */
  hoje: string;
  /** Sem banco ou sem a migration financeira: nada é gravado ainda. */
  modoPreparado: boolean;
};

export function VisaoFinanceiro({
  contratos,
  faturas,
  clientes,
  hoje,
  modoPreparado,
}: Props) {
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [idPendente, setIdPendente] = useState<string | null>(null);
  const [idCopiado, setIdCopiado] = useState<string | null>(null);
  const [, iniciarTransicao] = useTransition();

  const mesAtual = hoje.slice(0, 7);
  const resumo = resumoFinanceiro(faturas, hoje);
  const mrr = receitaRecorrente(contratos);
  const recebimentos = recebimentosPorMes(faturas, hoje, 6);
  const maiorRecebimento = Math.max(...recebimentos.map((r) => r.total), 1);
  const faturasDoMes = [...faturas]
    .filter((f) => f.competencia === mesAtual)
    .sort(
      (a, b) =>
        a.vencimento.localeCompare(b.vencimento) ||
        a.clienteNome.localeCompare(b.clienteNome, "pt-BR"),
    );

  function executar(id: string, acao: () => Promise<ResultadoAcao>) {
    setErro(null);
    setAviso(null);
    setIdPendente(id);
    iniciarTransicao(async () => {
      try {
        const resultado = await acao();
        if (!resultado.ok) setErro(resultado.erro);
        else if (resultado.mensagem) setAviso(resultado.mensagem);
      } finally {
        setIdPendente(null);
      }
    });
  }

  async function copiarCobranca(fatura: Fatura) {
    setErro(null);
    try {
      await navigator.clipboard.writeText(mensagemCobranca(fatura));
      setIdCopiado(fatura.id);
      setTimeout(() => setIdCopiado(null), 3000);
    } catch {
      setErro(
        "Não foi possível copiar a mensagem — copie manualmente e envie ao cliente.",
      );
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Gestão do negócio
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Financeiro da consultoria
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Contratos de mensalidade, faturas do mês e recebimentos da Mundo
            Novo Café.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={idPendente === "gerar-faturas"}
            onClick={() =>
              executar("gerar-faturas", () => gerarFaturasDoMes(mesAtual))
            }
          >
            <RefreshCcw data-icon="inline-start" />
            Gerar faturas do mês
          </Button>
          <BotaoNovoContrato clientes={clientes} />
        </div>
      </div>

      {modoPreparado ? (
        <p className="flex items-center gap-2 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning">
          <Info className="size-4 shrink-0" />
          Módulo em pré-ativação — os lançamentos serão gravados após a
          migração financeira. Os valores abaixo são de demonstração.
        </p>
      ) : null}

      {erro ? (
        <p className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          {erro}
        </p>
      ) : null}
      {aviso ? (
        <p className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
          <CheckCircle2 className="size-4 shrink-0" />
          {aviso}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CartaoKpi
          titulo="Receita mensal recorrente"
          valor={formatarMoeda(mrr)}
          detalhe={`${contratos.filter((c) => c.ativo).length} contratos ativos`}
          icone={<Banknote className="size-5" />}
        />
        <CartaoKpi
          titulo="Recebido no mês"
          valor={formatarMoeda(resumo.recebidoNoMes)}
          detalhe={`Pagamentos que entraram em ${rotuloCompetencia(mesAtual)}`}
          icone={<HandCoins className="size-5" />}
        />
        <CartaoKpi
          titulo="Em atraso"
          valor={formatarMoeda(resumo.atrasadoTotal)}
          detalhe={
            resumo.porCliente.filter((c) => c.valorAtrasado > 0).length > 0
              ? `${resumo.porCliente.filter((c) => c.valorAtrasado > 0).length} cliente(s) com fatura vencida`
              : "Nenhuma fatura vencida sem pagamento"
          }
          icone={<CalendarClock className="size-5" />}
        />
        <CartaoKpi
          titulo="Inadimplência"
          valor={formatarPercentual(resumo.inadimplenciaPercentual)}
          detalhe="Atrasado ÷ total já vencido"
          icone={<Percent className="size-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recebimentos dos últimos 6 meses</CardTitle>
          <CardDescription>
            Total pago pelos clientes em cada mês, pela data do pagamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            role="img"
            aria-label={`Gráfico de recebimentos: ${recebimentos
              .map((r) => `${rotuloCompetencia(r.competencia)} ${formatarMoeda(r.total)}`)
              .join("; ")}`}
            className="flex h-44 items-end gap-2 sm:gap-4"
          >
            {recebimentos.map((recebimento) => (
              <div
                key={recebimento.competencia}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1"
              >
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {formatarMoeda(recebimento.total)}
                </span>
                <div
                  className="w-full max-w-16 rounded-t-md bg-primary/80"
                  style={{
                    height: `${Math.max(
                      (recebimento.total / maiorRecebimento) * 100,
                      recebimento.total > 0 ? 4 : 1,
                    )}%`,
                  }}
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {rotuloCompetencia(recebimento.competencia)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Faturas de {rotuloCompetencia(mesAtual)}</CardTitle>
          <CardDescription>
            Registre o pagamento assim que ele entrar, ou copie a mensagem de
            cobrança para enviar ao cliente por WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {faturasDoMes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma fatura para este mês — use “Gerar faturas do mês”.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faturasDoMes.map((fatura) => (
                    <TableRow key={fatura.id}>
                      <TableCell className="font-semibold">
                        {fatura.clienteNome}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatarMoeda(fatura.valor)}
                      </TableCell>
                      <TableCell>{formatarData(fatura.vencimento)}</TableCell>
                      <TableCell>
                        <Badge variant={VARIANTE_STATUS_FATURA[fatura.status]}>
                          {ROTULO_STATUS_FATURA[fatura.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {fatura.status === "paga" ? (
                          <p className="text-right text-xs text-muted-foreground">
                            {fatura.pagoEm
                              ? `Paga em ${formatarData(fatura.pagoEm)}`
                              : "Paga"}
                          </p>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              disabled={idPendente === fatura.id}
                              onClick={() =>
                                executar(fatura.id, () =>
                                  registrarPagamento(fatura.id, hoje),
                                )
                              }
                            >
                              Registrar pagamento
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              aria-label={`Copiar cobrança de ${fatura.clienteNome}`}
                              onClick={() => copiarCobranca(fatura)}
                            >
                              <Copy data-icon="inline-start" />
                              {idCopiado === fatura.id ? "Copiado!" : "Cobrar"}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contratos de mensalidade</CardTitle>
          <CardDescription>
            Um contrato recorrente por cliente — o primeiro mês sai
            proporcional (pró-rata) à data de início.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contratos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum contrato cadastrado — comece pelo botão “Novo contrato”.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead className="text-right">Valor mensal</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contratos.map((contrato) => (
                    <TableRow key={contrato.id}>
                      <TableCell className="font-semibold">
                        {contrato.clienteNome}
                      </TableCell>
                      <TableCell className="max-w-64 truncate">
                        {contrato.descricao}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatarMoeda(contrato.valorMensal)}
                      </TableCell>
                      <TableCell>dia {contrato.diaVencimento}</TableCell>
                      <TableCell>{formatarData(contrato.inicio)}</TableCell>
                      <TableCell>
                        <Badge variant={contrato.ativo ? "default" : "secondary"}>
                          {contrato.ativo ? "Ativo" : "Encerrado"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {modoPreparado ? (
        <p className="text-xs text-muted-foreground">
          Pré-ativação: os contratos e faturas exibidos são exemplos com os
          clientes reais da carteira; registrar pagamentos e criar contratos
          ficará disponível após a migration financeira.
        </p>
      ) : null}
    </div>
  );
}
