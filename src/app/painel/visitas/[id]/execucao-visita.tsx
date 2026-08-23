"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { concluirVisita, responderItem } from "@/lib/checklists/acoes";
import {
  calcularConformidade,
  tamanhoDescricao,
  validarConclusaoVisita,
} from "@/lib/checklists/regras";
import {
  ROTULO_ORIGEM,
  ROTULO_RESPOSTA,
  type ItemVersao,
  type Resposta,
  type VisitaDetalhe,
} from "@/lib/checklists/tipos";
import { cn } from "@/lib/utils";
import { formatarData } from "@/lib/vencimentos";

type Props = {
  visita: VisitaDetalhe;
};

type RespostaLocal = { resposta: Resposta; descricao: string | null };

export function ExecucaoVisita({ visita }: Props) {
  const [respostas, setRespostas] = useState<Record<string, RespostaLocal>>(
    () =>
      Object.fromEntries(
        visita.respostas.map((r) => [
          r.itemId,
          { resposta: r.resposta, descricao: r.descricao },
        ]),
      ),
  );
  const [concluida, setConcluida] = useState(visita.status !== "em_andamento");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciarTransicao] = useTransition();

  const totalItens = visita.itens.length;
  const respondidos = Object.keys(respostas).length;
  const progresso = totalItens === 0 ? 0 : Math.round((respondidos / totalItens) * 100);
  const conformidade = useMemo(
    () => calcularConformidade(Object.values(respostas)),
    [respostas],
  );
  const naoConformes = Object.values(respostas).filter(
    (r) => r.resposta === "nao_conforme",
  ).length;

  function responder(item: ItemVersao, resposta: Resposta, descricao?: string) {
    setErro(null);
    iniciarTransicao(async () => {
      const resultado = await responderItem({
        visitaId: visita.id,
        itemId: item.id,
        resposta,
        descricao,
      });
      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }
      setRespostas((atuais) => ({
        ...atuais,
        [item.id]: {
          resposta,
          descricao: resposta === "nao_conforme" ? (descricao ?? null) : null,
        },
      }));
    });
  }

  function concluir() {
    setErro(null);
    const validacao = validarConclusaoVisita(
      visita.itens,
      Object.keys(respostas).map((itemId) => ({ itemId })),
    );
    if (!validacao.ok) {
      setErro(validacao.erro);
      return;
    }
    iniciarTransicao(async () => {
      const resultado = await concluirVisita(visita.id);
      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }
      setConcluida(true);
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/painel/visitas"
        className="flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Todas as visitas
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            {concluida ? "Registro concluído" : "Registro em andamento"}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {visita.titulo}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {visita.clienteNome} · iniciada em{" "}
            {formatarData(new Date(visita.iniciadaEm))}
          </p>
        </div>
        <Badge variant={visita.origem === "campo" ? "secondary" : "outline"}>
          {visita.origem === "campo" ? "🌱" : "🏢"} {ROTULO_ORIGEM[visita.origem]}
        </Badge>
      </div>

      <Card>
        <CardContent className="space-y-2 pt-4">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>
              Progresso: {respondidos}/{totalItens} itens respondidos
            </span>
            <span className="tabular-nums">{progresso}%</span>
          </div>
          <Progress value={progresso} aria-label="Progresso da visita" />
          {!concluida ? (
            <p className="flex items-start gap-2 pt-1 text-xs font-semibold text-warning">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              Toda resposta “Não conforme” abre uma CAPA automaticamente, com
              prazo padrão de 30 dias — a NC nunca fica sem plano de ação.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {concluida ? (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="size-5 text-primary" />
              Visita concluída
            </CardTitle>
            <CardDescription>
              {naoConformes > 0
                ? `${naoConformes} NC${naoConformes > 1 ? "s" : ""} registrada${naoConformes > 1 ? "s" : ""} — CAPAs criadas automaticamente.`
                : "Nenhuma não conformidade registrada."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold tracking-tight text-primary">
              {conformidade === null ? "—" : `${conformidade}%`}
            </p>
            <p className="text-sm text-muted-foreground">
              Conformidade final — conformes ÷ (respondidos − N.A.).
            </p>
          </CardContent>
        </Card>
      ) : null}

      {erro ? (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm font-semibold text-destructive"
        >
          <AlertTriangle className="size-4 shrink-0" />
          {erro}
        </p>
      ) : null}

      <div className="space-y-3">
        {visita.itens.map((item) => (
          <ItemDaVisita
            key={item.id}
            item={item}
            resposta={respostas[item.id] ?? null}
            travado={concluida}
            pendente={pendente}
            aoResponder={(resposta, descricao) =>
              responder(item, resposta, descricao)
            }
          />
        ))}
      </div>

      {!concluida ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">
            A visita só pode ser concluída com todos os itens obrigatórios
            respondidos.
            {conformidade !== null
              ? ` Conformidade parcial: ${conformidade}%.`
              : ""}
          </p>
          <Button disabled={pendente} onClick={concluir}>
            Concluir visita
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ItemDaVisita({
  item,
  resposta,
  travado,
  pendente,
  aoResponder,
}: {
  item: ItemVersao;
  resposta: RespostaLocal | null;
  travado: boolean;
  pendente: boolean;
  aoResponder: (resposta: Resposta, descricao?: string) => void;
}) {
  const [editandoNc, setEditandoNc] = useState(false);
  const [descricao, setDescricao] = useState(resposta?.descricao ?? "");

  const tamanho = tamanhoDescricao(descricao);
  const faltam = Math.max(0, item.descricaoMinima - tamanho);
  const atual = resposta?.resposta ?? null;

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
        {item.codigo}
        {item.capitulo ? ` · ${item.capitulo}` : null}
        {item.obrigatorio ? " · obrigatório" : ""}
      </p>
      <p className="mt-1 text-sm font-semibold leading-snug">{item.pergunta}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Referência: {item.referenciaNorma}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={atual === "conforme" ? "default" : "outline"}
          disabled={travado || pendente}
          onClick={() => {
            setEditandoNc(false);
            aoResponder("conforme");
          }}
        >
          Conforme
        </Button>
        <Button
          size="sm"
          variant={atual === "nao_conforme" ? "destructive" : "outline"}
          className={cn(
            atual === "nao_conforme" && "bg-destructive/15",
          )}
          disabled={travado || pendente}
          onClick={() => setEditandoNc(true)}
        >
          Não conforme
        </Button>
        <Button
          size="sm"
          variant={atual === "nao_aplicavel" ? "secondary" : "outline"}
          disabled={travado || pendente || !item.permiteNa}
          onClick={() => {
            setEditandoNc(false);
            aoResponder("nao_aplicavel");
          }}
        >
          N.A.
        </Button>

        {atual ? (
          <Badge
            variant={atual === "nao_conforme" ? "destructive" : "secondary"}
            className="ml-auto self-center"
          >
            {ROTULO_RESPOSTA[atual]}
          </Badge>
        ) : null}
      </div>

      {editandoNc && !travado ? (
        <div className="mt-3 space-y-2 rounded-xl bg-destructive/5 p-3">
          <label
            htmlFor={`descricao-nc-${item.id}`}
            className="text-sm font-bold"
          >
            Descreva a não conformidade
          </label>
          <textarea
            id={`descricao-nc-${item.id}`}
            rows={4}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="O que foi encontrado, onde e qual o risco…"
            className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p
              className={cn(
                "text-xs font-semibold tabular-nums",
                faltam > 0 ? "text-destructive" : "text-primary",
              )}
            >
              {tamanho}/{item.descricaoMinima} caracteres
              {faltam > 0 ? ` — faltam ${faltam}` : " — mínimo atingido"}
            </p>
            <Button
              size="sm"
              disabled={pendente || faltam > 0}
              onClick={() => {
                aoResponder("nao_conforme", descricao.trim());
                setEditandoNc(false);
              }}
            >
              Registrar não conformidade
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ao registrar, uma CAPA é aberta automaticamente para este item
            (mínimo de {item.fotosMinimas} foto{item.fotosMinimas === 1 ? "" : "s"} no app de campo).
          </p>
        </div>
      ) : null}

      {atual === "nao_conforme" && resposta?.descricao && !editandoNc ? (
        <p className="mt-3 rounded-xl bg-destructive/5 p-3 text-sm">
          <span className="font-bold text-destructive">NC registrada: </span>
          {resposta.descricao}
        </p>
      ) : null}
    </div>
  );
}
