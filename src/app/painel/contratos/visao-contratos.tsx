"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  Eye,
  FileText,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DialogoConfirmar } from "@/components/dialogo-confirmar";
import { decidirContrato } from "@/lib/certificacao/acoes";
import type { ContratoAlcada, PerfilAtual } from "@/lib/certificacao/consultas";
import {
  contratoEscalonado,
  MOTIVO_REJEICAO_MAXIMO,
  MOTIVO_REJEICAO_MINIMO,
} from "@/lib/certificacao/regras";
import { EQUIPE_DEMO } from "@/lib/equipe/dados-demo";
import { formatarData } from "@/lib/vencimentos";
import type { ContratoDecidivel } from "./enriquecimento";

const ROTULO_TIPO: Record<ContratoAlcada["tipo"], string> = {
  fazenda: "Fazenda",
  cadeia_suprimentos: "Cadeia de Suprimentos",
};

type Props = {
  contratos: ContratoDecidivel[];
  perfil: PerfilAtual | null;
  modoDemo: boolean;
};

type Decisao = "aprovado" | "rejeitado";

export function VisaoContratos({ contratos, perfil, modoDemo }: Props) {
  // Estado local usado apenas no modo demonstração (simulação sem gravar);
  // conectado ao banco, a revalidação do servidor atualiza as props.
  const [contratosLocais, setContratosLocais] = useState(contratos);
  const [usuarioDemoId, setUsuarioDemoId] = useState(EQUIPE_DEMO[0].id);
  const [erro, setErro] = useState<string | null>(null);
  const [emDecisao, setEmDecisao] = useState<{
    contrato: ContratoDecidivel;
    decisao: Decisao;
  } | null>(null);
  const [motivo, setMotivo] = useState("");
  const [pendente, iniciarTransicao] = useTransition();

  const contratosExibidos = modoDemo ? contratosLocais : contratos;

  const usuarioDemo = EQUIPE_DEMO.find((m) => m.id === usuarioDemoId)!;
  const temAlcada = modoDemo
    ? usuarioDemo.alcadaAprovacao
    : (perfil?.alcadaAprovacao ?? false);
  const nomeSemAlcada = modoDemo
    ? usuarioDemo.nome.split(" ")[0]
    : (perfil?.nome.split(" ")[0] ?? null);

  function pedirConfirmacao(contrato: ContratoDecidivel, decisao: Decisao) {
    setErro(null);
    setMotivo("");
    setEmDecisao({ contrato, decisao });
  }

  function confirmarDecisao() {
    if (!emDecisao) return;
    const { contrato, decisao } = emDecisao;
    const motivoLimpo = motivo.trim();
    const resultadoTexto =
      decisao === "aprovado"
        ? `Contrato ${contrato.codigo} aprovado — cadastro do cliente liberado`
        : `Contrato ${contrato.codigo} rejeitado — motivo registrado e devolvido a quem solicitou`;

    setEmDecisao(null);

    if (modoDemo) {
      // Demonstração: simula a decisão localmente, nada é gravado.
      setContratosLocais((atuais) =>
        atuais.map((c) =>
          c.id === contrato.id
            ? {
                ...c,
                status: decisao,
                decididoPor: `${usuarioDemo.nome} (simulação)`,
                decididoEm: new Date().toISOString(),
                diasParado: 0,
                observacao: decisao === "rejeitado" ? motivoLimpo : c.observacao,
              }
            : c,
        ),
      );
      toast.success(resultadoTexto, {
        description: "Simulação do modo demonstração — nada foi gravado.",
      });
      return;
    }

    iniciarTransicao(async () => {
      const resultado = await decidirContrato(
        contrato.id,
        decisao,
        decisao === "rejeitado" ? motivoLimpo : undefined,
      );
      if (!resultado.ok) {
        setErro(resultado.erro);
        toast.error(`Contrato ${contrato.codigo} não foi decidido`, {
          description: resultado.erro,
        });
        return;
      }
      toast.success(resultadoTexto);
    });
  }

  const aguardando = contratosExibidos.filter(
    (c) => c.status === "aguardando_alcada",
  );
  const decididos = contratosExibidos
    .filter((c) => c.status !== "aguardando_alcada")
    .sort((a, b) => (b.decididoEm ?? "").localeCompare(a.decididoEm ?? ""));

  const motivoLimpo = motivo.trim();
  const motivoCurtoDemais = motivoLimpo.length < MOTIVO_REJEICAO_MINIMO;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Administração
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Contratos & Alçada de aprovação
          </h1>
        </div>

        {modoDemo ? (
          <label className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm font-semibold">
            <Eye className="size-4 text-muted-foreground" />
            Ver como:
            <select
              className="bg-transparent font-bold outline-none"
              value={usuarioDemoId}
              onChange={(e) => setUsuarioDemoId(e.target.value)}
            >
              {EQUIPE_DEMO.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome} {m.alcadaAprovacao ? "· com alçada" : "· sem alçada"}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="rounded-xl bg-muted px-3 py-2 text-sm font-semibold">
            {perfil
              ? `${perfil.nome} · ${temAlcada ? "com alçada" : "sem alçada"}`
              : "Entre no sistema para decidir contratos"}
          </p>
        )}
      </div>

      {erro ? (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
        >
          <AlertTriangle className="size-4 shrink-0" />
          {erro}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Aguardando alçada de aprovação</CardTitle>
          <CardDescription>
            A aprovação libera o cadastro do cliente. Contratos parados há mais
            de 10 dias disparam escalonamento automático à diretoria.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {aguardando.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum contrato aguardando decisão. 🎉
            </p>
          ) : null}
          {aguardando.map((contrato) => (
            <div
              key={contrato.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border p-4"
            >
              <div className="min-w-[16rem] flex-1 space-y-2">
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-bold">
                    {contrato.codigo} — {contrato.clienteNome}
                    <Badge variant="outline">{ROTULO_TIPO[contrato.tipo]}</Badge>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Solicitado
                    {contrato.solicitadoPor
                      ? ` por ${contrato.solicitadoPor}`
                      : null}{" "}
                    em {formatarData(new Date(`${contrato.solicitadoEm}T12:00:00`))}
                  </p>
                </div>

                <ContextoComercial contrato={contrato} />

                {contratoEscalonado(contrato.diasParado) ? (
                  <p className="flex items-center gap-1.5 text-xs font-bold text-warning">
                    <AlertTriangle className="size-3.5" />
                    Parado há {contrato.diasParado} dias — escalonamento
                    disparado ({">"} 10 dias)
                  </p>
                ) : null}
              </div>

              {temAlcada ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={pendente}
                    onClick={() => pedirConfirmacao(contrato, "aprovado")}
                  >
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pendente}
                    onClick={() => pedirConfirmacao(contrato, "rejeitado")}
                  >
                    Rejeitar
                  </Button>
                </div>
              ) : (
                <p className="text-xs font-semibold text-muted-foreground">
                  Somente leitura —{" "}
                  {nomeSemAlcada
                    ? `${nomeSemAlcada} não possui alçada`
                    : "sem alçada"}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {decididos.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Decididos</CardTitle>
            <CardDescription>
              Toda decisão fica registrada com quem decidiu, quando e — nas
              rejeições — por quê.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {decididos.map((contrato) => (
              <div
                key={contrato.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border p-4"
              >
                <div className="min-w-[16rem] flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-bold">
                    {contrato.codigo} — {contrato.clienteNome}
                    <Badge variant="outline">{ROTULO_TIPO[contrato.tipo]}</Badge>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {contrato.status === "aprovado" ? "Aprovado" : "Rejeitado"}
                    {contrato.decididoPor ? ` por ${contrato.decididoPor}` : null}
                    {contrato.decididoEm
                      ? ` em ${formatarData(new Date(contrato.decididoEm))}`
                      : null}
                  </p>
                  {contrato.status === "rejeitado" && contrato.observacao ? (
                    <p className="mt-1 rounded-lg bg-destructive/5 p-2 text-sm">
                      <span className="font-bold text-destructive">
                        Motivo:{" "}
                      </span>
                      {contrato.observacao}
                    </p>
                  ) : null}
                </div>
                {contrato.status === "aprovado" ? (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="size-3.5" /> Aprovado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-destructive">
                    <XCircle className="size-3.5" /> Rejeitado
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <p className="text-sm text-muted-foreground">
        {modoDemo
          ? "Use o seletor “Ver como” para conferir a regra na prática: sem a permissão de alçada, os botões Aprovar/Rejeitar não aparecem. As decisões aqui são simulações — nada é gravado."
          : "Alçada é permissão, não etapa: sem a flag, os botões não aparecem e o servidor recusa a decisão mesmo que alguém tente por fora da tela."}
      </p>

      <DialogoConfirmar
        aberto={emDecisao !== null}
        aoMudarAberto={(aberto) => {
          if (!aberto) setEmDecisao(null);
        }}
        titulo={
          emDecisao?.decisao === "rejeitado"
            ? "Rejeitar este contrato?"
            : "Aprovar este contrato?"
        }
        descricao={
          emDecisao
            ? `${emDecisao.contrato.codigo} — ${emDecisao.contrato.clienteNome}. ${
                emDecisao.contrato.contexto.valorFormatado ??
                "Sem valor cadastrado no financeiro"
              }.`
            : ""
        }
        oQueAcontece={
          emDecisao?.decisao === "rejeitado"
            ? [
                "O contrato sai da fila de alçada e fica registrado como rejeitado.",
                "O motivo abaixo é gravado no contrato e volta para quem solicitou.",
                "A decisão fica no histórico com o seu nome e a data.",
              ]
            : [
                "O cadastro do cliente é liberado para seguir no processo.",
                "O contrato sai da fila de alçada e para de escalonar à diretoria.",
                "A decisão fica no histórico com o seu nome e a data.",
              ]
        }
        oQueNaoAcontece={
          emDecisao?.decisao === "rejeitado"
            ? [
                "O cadastro do cliente não é apagado — ele só não avança.",
                "Nenhum e-mail é disparado automaticamente por esta tela.",
                "Nada muda no financeiro nem nas faturas do cliente.",
              ]
            : [
                "Nenhuma cobrança é gerada — o contrato do financeiro é cadastrado à parte.",
                "Nenhum e-mail é disparado automaticamente por esta tela.",
                "A certificação do cliente não avança de etapa por causa disto.",
              ]
        }
        rotuloConfirmar={
          emDecisao?.decisao === "rejeitado"
            ? "Rejeitar contrato"
            : "Aprovar contrato"
        }
        destrutivo={emDecisao?.decisao === "rejeitado"}
        confirmarDesabilitado={
          pendente || (emDecisao?.decisao === "rejeitado" && motivoCurtoDemais)
        }
        aoConfirmar={confirmarDecisao}
      >
        {emDecisao?.decisao === "rejeitado" ? (
          <div className="space-y-1.5">
            <label htmlFor="motivo-rejeicao" className="text-sm font-bold">
              Motivo da rejeição (obrigatório)
            </label>
            <textarea
              id="motivo-rejeicao"
              rows={3}
              value={motivo}
              maxLength={MOTIVO_REJEICAO_MAXIMO}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: valor acima do teto aprovado para fazendas deste porte."
              className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <p
              className={
                motivoCurtoDemais
                  ? "text-xs font-semibold tabular-nums text-destructive"
                  : "text-xs font-semibold tabular-nums text-primary"
              }
            >
              {motivoLimpo.length}/{MOTIVO_REJEICAO_MAXIMO} caracteres
              {motivoCurtoDemais
                ? ` — mínimo de ${MOTIVO_REJEICAO_MINIMO}`
                : " — pode rejeitar"}
            </p>
          </div>
        ) : null}
      </DialogoConfirmar>
    </div>
  );
}

/**
 * Valor, vigência, escopo e documento — o que faltava para a decisão não
 * ser às cegas. Sem contrato no financeiro, diz isso com todas as letras e
 * oferece o caminho para cadastrar.
 */
function ContextoComercial({ contrato }: { contrato: ContratoDecidivel }) {
  const { valorFormatado, vigencia, escopo, documentoUrl } = contrato.contexto;

  return (
    <div className="space-y-1 text-sm">
      {valorFormatado ? (
        <p className="flex items-center gap-1.5 font-semibold">
          <Wallet className="size-3.5 shrink-0 text-muted-foreground" />
          {valorFormatado}
        </p>
      ) : (
        <p className="flex flex-wrap items-center gap-1.5 font-semibold text-warning">
          <Wallet className="size-3.5 shrink-0" />
          Sem valor cadastrado
          <Link
            href="/painel/financeiro"
            className="font-bold text-primary underline underline-offset-2"
          >
            cadastrar no Financeiro
          </Link>
        </p>
      )}

      {vigencia ? (
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarRange className="size-3.5 shrink-0" />
          {vigencia}
        </p>
      ) : null}

      {escopo ? (
        <p className="flex items-start gap-1.5 text-muted-foreground">
          <FileText className="mt-0.5 size-3.5 shrink-0" />
          {escopo}
        </p>
      ) : null}

      {documentoUrl ? (
        <p className="flex items-center gap-1.5">
          <FileText className="size-3.5 shrink-0 text-muted-foreground" />
          <a
            href={documentoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary underline underline-offset-2"
          >
            Abrir documento do contrato
          </a>
        </p>
      ) : null}
    </div>
  );
}
