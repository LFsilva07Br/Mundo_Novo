"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Plus,
  ShieldCheck,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  concluirAcaoCapa,
  criarCapa,
  fecharCapa,
  type DadosNovaCapa,
} from "@/lib/certificacao/acoes";
import type { Capa } from "@/lib/certificacao/consultas";
import { calcularRankingGaps, podeFecharCapa } from "@/lib/certificacao/regras";
import { ITENS_CHECKLIST_RA } from "@/lib/certificacao/dados-demo";
import { formatarData } from "@/lib/vencimentos";
import { cn } from "@/lib/utils";
import { SecaoEvidencias } from "./secao-evidencias";

const ROTULO_SEVERIDADE: Record<Capa["severidade"], string> = {
  menor: "Menor",
  maior: "Maior",
  critica: "Crítica",
};

const COR_SEVERIDADE: Record<Capa["severidade"], string> = {
  critica: "bg-destructive/10 text-destructive",
  maior: "bg-destructive/10 text-destructive",
  menor: "bg-warning/10 text-warning",
};

const ROTULO_STATUS: Record<Capa["status"], string> = {
  aberta: "Aberta",
  em_correcao: "Em correção",
  aguardando_evidencia: "Aguardando evidência",
  fechada: "✓ Fechada",
};

type ClienteOpcao = { id: string; nome: string };

type Props = {
  capas: Capa[];
  clientes: ClienteOpcao[];
  modoDemo: boolean;
};

export function VisaoCapas({ capas, clientes, modoDemo }: Props) {
  // Estado local usado apenas no modo demonstração (simulação sem gravar);
  // conectado ao banco, a revalidação do servidor atualiza as props.
  const [capasLocais, setCapasLocais] = useState(capas);
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set());
  const [erro, setErro] = useState<string | null>(null);
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [pendente, iniciarTransicao] = useTransition();

  const capasExibidas = modoDemo ? capasLocais : capas;

  const abertas = capasExibidas.filter((c) => c.status !== "fechada");
  const fechadas = capasExibidas.filter((c) => c.status === "fechada");
  const deCampo = capasExibidas.filter((c) => c.origem === "campo");
  const ranking = useMemo(
    () => calcularRankingGaps(abertas.map((c) => ({ itemCodigo: c.itemCodigo }))),
    [abertas],
  );
  const maiorQuantidade = Math.max(...ranking.map((g) => g.quantidade), 1);

  function alternarExpansao(capaId: string) {
    setExpandidas((atuais) => {
      const novas = new Set(atuais);
      if (novas.has(capaId)) novas.delete(capaId);
      else novas.add(capaId);
      return novas;
    });
  }

  function marcarAcao(capaId: string, acaoId: string, concluida: boolean) {
    setErro(null);
    if (modoDemo) {
      setCapasLocais((atuais) =>
        atuais.map((capa) =>
          capa.id === capaId
            ? {
                ...capa,
                acoes: capa.acoes.map((acao) =>
                  acao.id === acaoId
                    ? {
                        ...acao,
                        concluida,
                        concluidaEm: concluida
                          ? new Date().toISOString().slice(0, 10)
                          : null,
                      }
                    : acao,
                ),
              }
            : capa,
        ),
      );
      return;
    }
    iniciarTransicao(async () => {
      const resultado = await concluirAcaoCapa(acaoId, concluida);
      if (!resultado.ok) setErro(resultado.erro);
    });
  }

  function fechar(capa: Capa) {
    setErro(null);
    if (!podeFecharCapa(capa.acoes)) {
      setErro(
        "A CAPA só fecha com todas as ações concluídas — ainda há ação pendente.",
      );
      return;
    }
    if (modoDemo) {
      setCapasLocais((atuais) =>
        atuais.map((c) =>
          c.id === capa.id ? { ...c, status: "fechada" as const } : c,
        ),
      );
      return;
    }
    iniciarTransicao(async () => {
      const resultado = await fecharCapa(capa.id);
      if (!resultado.ok) setErro(resultado.erro);
    });
  }

  function aoCriar(dados: DadosNovaCapa) {
    setErro(null);
    if (modoDemo) {
      const numero = Math.max(...capasExibidas.map((c) => c.numero), 0) + 1;
      const cliente = clientes.find((c) => c.id === dados.clienteId);
      setCapasLocais((atuais) => [
        {
          id: `demo-${numero}`,
          numero,
          cliente: cliente?.nome ?? "Cliente",
          itemCodigo: dados.itemCodigo || null,
          descricao: dados.descricao,
          severidade: dados.severidade,
          responsavel: dados.responsavel,
          prazo: dados.prazo,
          status: "aberta" as const,
          origem: dados.origem,
          acoes: dados.primeiraAcao
            ? [
                {
                  id: `demo-${numero}-1`,
                  ordem: 1,
                  descricao: dados.primeiraAcao,
                  concluida: false,
                  concluidaEm: null,
                },
              ]
            : [],
        },
        ...atuais,
      ]);
      setDialogoAberto(false);
      return;
    }
    iniciarTransicao(async () => {
      const resultado = await criarCapa(dados);
      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }
      setDialogoAberto(false);
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Não conformidades
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Planos de ação — CAPA
          </h1>
        </div>
        <DialogoNovaCapa
          aberto={dialogoAberto}
          aoMudarAberto={setDialogoAberto}
          clientes={clientes}
          aoCriar={aoCriar}
          pendente={pendente}
        />
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-secondary/60 p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <p className="text-sm font-semibold text-secondary-foreground">
          Regra do sistema: uma não conformidade nunca fica sem plano de ação.
          O CAPA nasce com responsável e prazo obrigatórios, e só fecha quando
          todas as ações do plano estiverem concluídas.
        </p>
      </div>

      {erro ? (
        <p className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          {erro}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">{abertas.length}</p>
            <p className="text-xs font-semibold text-muted-foreground">
              CAPAs em aberto
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">
              {deCampo.length} / {capasExibidas.length - deCampo.length}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              campo / escritório
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">{fechadas.length}</p>
            <p className="text-xs font-semibold text-muted-foreground">
              fechadas e verificadas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CAPAs</CardTitle>
          <CardDescription>
            Clique em uma CAPA para ver o plano de ação. Marque as ações
            concluídas — o botão “Fechar CAPA” só libera sem pendências.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>CAPA / origem</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Sev.</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {capasExibidas.map((capa) => {
                const expandida = expandidas.has(capa.id);
                const pendentes = capa.acoes.filter((a) => !a.concluida).length;
                return (
                  <CapaLinhas
                    key={capa.id}
                    capa={capa}
                    expandida={expandida}
                    pendentes={pendentes}
                    ocupado={pendente}
                    modoDemo={modoDemo}
                    aoAlternar={() => alternarExpansao(capa.id)}
                    aoMarcarAcao={(acaoId, concluida) =>
                      marcarAcao(capa.id, acaoId, concluida)
                    }
                    aoFechar={() => fechar(capa)}
                  />
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gaps mais recorrentes</CardTitle>
          <CardDescription>
            Ranking calculado das CAPAs em aberto, agrupadas pela categoria do
            item da norma — sem apuração manual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {ranking.map((gap, indice) => (
            <div key={gap.categoria} className="flex items-center gap-3">
              <span className="w-6 text-sm font-extrabold text-muted-foreground">
                {indice + 1}º
              </span>
              <span className="flex-1 text-sm font-semibold">{gap.categoria}</span>
              <div className="h-2 w-40 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(gap.quantidade / maiorQuantidade) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-sm font-bold">
                {gap.quantidade}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Gatilhos automáticos: NC marcada → CAPA nasce na hora · evidência
        anexada → verificação do consultor · 7 dias do prazo → lembrete ao
        responsável · prazo estourado → escalonamento ao gestor.
      </p>
    </div>
  );
}

type PropsLinhas = {
  capa: Capa;
  expandida: boolean;
  pendentes: number;
  ocupado: boolean;
  modoDemo: boolean;
  aoAlternar: () => void;
  aoMarcarAcao: (acaoId: string, concluida: boolean) => void;
  aoFechar: () => void;
};

function CapaLinhas({
  capa,
  expandida,
  pendentes,
  ocupado,
  modoDemo,
  aoAlternar,
  aoMarcarAcao,
  aoFechar,
}: PropsLinhas) {
  return (
    <>
      <TableRow className="cursor-pointer" onClick={aoAlternar}>
        <TableCell>
          <button
            type="button"
            aria-label={`${expandida ? "Recolher" : "Expandir"} CAPA #${capa.numero}`}
            className="text-muted-foreground"
          >
            {expandida ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        </TableCell>
        <TableCell>
          <p className="font-semibold">
            #{capa.numero}
            {capa.itemCodigo ? ` — item ${capa.itemCodigo}` : null}
          </p>
          <p className="max-w-72 text-xs text-muted-foreground">
            {capa.descricao}
          </p>
        </TableCell>
        <TableCell className="text-sm">{capa.cliente}</TableCell>
        <TableCell>
          <span
            className={cn(
              "rounded-lg px-2 py-0.5 text-xs font-bold",
              COR_SEVERIDADE[capa.severidade],
            )}
          >
            {ROTULO_SEVERIDADE[capa.severidade]}
          </span>
        </TableCell>
        <TableCell className="text-sm">{capa.responsavel}</TableCell>
        <TableCell className="text-sm">
          {capa.prazo ? formatarData(new Date(`${capa.prazo}T12:00:00`)) : "—"}
        </TableCell>
        <TableCell>
          <Badge variant="outline">
            {capa.origem === "campo" ? "Campo" : "Escritório"}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant={capa.status === "fechada" ? "secondary" : "outline"}>
            {ROTULO_STATUS[capa.status]}
          </Badge>
        </TableCell>
      </TableRow>
      {expandida ? (
        <TableRow className="bg-muted/40 hover:bg-muted/40">
          <TableCell />
          <TableCell colSpan={7}>
            <div className="space-y-3 py-1">
              <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                Plano de ação
                {pendentes > 0
                  ? ` · ${pendentes} ação(ões) pendente(s)`
                  : " · tudo concluído"}
              </p>
              {capa.acoes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma ação cadastrada neste plano ainda.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {capa.acoes.map((acao) => (
                    <li key={acao.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`acao-${acao.id}`}
                        className="size-4 accent-primary"
                        checked={acao.concluida}
                        disabled={capa.status === "fechada" || ocupado}
                        onChange={(e) => aoMarcarAcao(acao.id, e.target.checked)}
                      />
                      <label
                        htmlFor={`acao-${acao.id}`}
                        className={cn(
                          "text-sm",
                          acao.concluida && "text-muted-foreground line-through",
                        )}
                      >
                        {acao.descricao}
                        {acao.concluida && acao.concluidaEm
                          ? ` (concluída em ${formatarData(new Date(`${acao.concluidaEm}T12:00:00`))})`
                          : null}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              <SecaoEvidencias
                capaId={capa.id}
                acoes={capa.acoes}
                fechada={capa.status === "fechada"}
                modoDemo={modoDemo}
              />
              {capa.status !== "fechada" ? (
                <Button
                  size="sm"
                  disabled={pendentes > 0 || ocupado}
                  onClick={aoFechar}
                >
                  Fechar CAPA
                </Button>
              ) : null}
            </div>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

type PropsDialogo = {
  aberto: boolean;
  aoMudarAberto: (aberto: boolean) => void;
  clientes: ClienteOpcao[];
  aoCriar: (dados: DadosNovaCapa) => void;
  pendente: boolean;
};

function DialogoNovaCapa({
  aberto,
  aoMudarAberto,
  clientes,
  aoCriar,
  pendente,
}: PropsDialogo) {
  const estiloCampo =
    "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none";

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAberto}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            Nova CAPA
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova CAPA</DialogTitle>
          <DialogDescription>
            Registre a não conformidade já com o plano: responsável e prazo são
            obrigatórios — NC nunca fica sem plano de ação.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const dados = new FormData(e.currentTarget);
            aoCriar({
              clienteId: String(dados.get("clienteId") ?? ""),
              itemCodigo: String(dados.get("itemCodigo") ?? ""),
              descricao: String(dados.get("descricao") ?? ""),
              severidade: String(
                dados.get("severidade") ?? "menor",
              ) as DadosNovaCapa["severidade"],
              responsavel: String(dados.get("responsavel") ?? ""),
              prazo: String(dados.get("prazo") ?? ""),
              origem: String(
                dados.get("origem") ?? "campo",
              ) as DadosNovaCapa["origem"],
              primeiraAcao: String(dados.get("primeiraAcao") ?? ""),
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="capa-cliente">Cliente</Label>
            <select
              id="capa-cliente"
              name="clienteId"
              required
              className={estiloCampo}
              defaultValue=""
            >
              <option value="" disabled>
                Escolha o cliente…
              </option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="capa-item">Item da norma</Label>
              <select id="capa-item" name="itemCodigo" className={estiloCampo}>
                <option value="">Sem item específico</option>
                {ITENS_CHECKLIST_RA.map((item) => (
                  <option key={item.codigo} value={item.codigo}>
                    {item.codigo} · {item.capitulo}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capa-severidade">Severidade</Label>
              <select
                id="capa-severidade"
                name="severidade"
                required
                className={estiloCampo}
                defaultValue="menor"
              >
                <option value="menor">Menor</option>
                <option value="maior">Maior</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="capa-descricao">Descrição da não conformidade</Label>
            <Input
              id="capa-descricao"
              name="descricao"
              required
              minLength={10}
              placeholder="O que foi encontrado?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="capa-responsavel">Responsável</Label>
              <Input
                id="capa-responsavel"
                name="responsavel"
                required
                minLength={3}
                placeholder="Quem corrige"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capa-prazo">Prazo</Label>
              <Input id="capa-prazo" name="prazo" type="date" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="capa-origem">Origem</Label>
              <select
                id="capa-origem"
                name="origem"
                required
                className={estiloCampo}
                defaultValue="campo"
              >
                <option value="campo">Campo</option>
                <option value="escritorio">Escritório</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capa-acao">1ª ação do plano (opcional)</Label>
              <Input
                id="capa-acao"
                name="primeiraAcao"
                placeholder="Ex.: instalar sinalização"
              />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button type="submit" disabled={pendente}>
              Registrar CAPA
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
