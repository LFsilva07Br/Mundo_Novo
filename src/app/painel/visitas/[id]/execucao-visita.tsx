"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Loader2,
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
import { GaleriaEvidencias } from "@/components/evidencias/galeria-evidencias";
import { concluirVisita, responderItem } from "@/lib/checklists/acoes";
import { enviarFotoVisita, type FotoVisita } from "@/lib/evidencias/acoes";
import {
  TAMANHO_MAXIMO_MB,
  TIPOS_DE_IMAGEM_PERMITIDOS,
  validarArquivoEvidencia,
} from "@/lib/evidencias/regras";
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
import {
  agruparFiltrado,
  agruparPorCapitulo,
  FILTROS_ITENS,
  filtrarItens,
  proximoPendente,
  resumirExecucao,
  ROTULO_FILTRO,
  type FiltroItens,
  type MapaRespostas,
} from "./agrupamento";

type Props = {
  visita: VisitaDetalhe;
  /** Fotos já enviadas (URLs assinadas geradas no servidor). */
  fotos?: FotoVisita[];
  /** Sem Supabase conectado o upload fica desabilitado, com aviso amigável. */
  modoDemo?: boolean;
};

type RespostaLocal = { resposta: Resposta; descricao: string | null };

/** Estado de gravação de um item — feedback discreto de "salvando/salvo". */
type StatusSalvamento = "salvando" | "salvo";

/** Âncora do cartão de um item, usada pelo "Ir ao próximo pendente". */
function ancoraItem(itemId: string): string {
  return `item-${itemId}`;
}

export function ExecucaoVisita({ visita, fotos = [], modoDemo = false }: Props) {
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
  const [filtro, setFiltro] = useState<FiltroItens>("todos");
  const [confirmandoConclusao, setConfirmandoConclusao] = useState(false);
  const [salvamento, setSalvamento] = useState<
    Record<string, StatusSalvamento | undefined>
  >({});
  // Rolagem pedida pelo sumário / "próximo pendente": o contador força o
  // efeito a rodar de novo mesmo quando o destino é o mesmo de antes.
  const ancoraAlvo = useRef<string | null>(null);
  const [pedidoRolagem, setPedidoRolagem] = useState(0);
  const [pendente, iniciarTransicao] = useTransition();

  const mapaRespostas: MapaRespostas = respostas;
  const resumo = useMemo(
    () => resumirExecucao(visita.itens, mapaRespostas),
    [visita.itens, mapaRespostas],
  );
  const conformidade = useMemo(
    () => calcularConformidade(Object.values(respostas)),
    [respostas],
  );

  /** Capítulos completos — alimentam o sumário e os contadores por seção. */
  const capitulos = useMemo(
    () => agruparPorCapitulo(visita.itens, mapaRespostas),
    [visita.itens, mapaRespostas],
  );
  /** Capítulos com o filtro aplicado — o que realmente aparece na lista. */
  const capitulosVisiveis = useMemo(
    () => agruparFiltrado(visita.itens, mapaRespostas, filtro),
    [visita.itens, mapaRespostas, filtro],
  );

  const totaisPorFiltro = useMemo(
    () =>
      Object.fromEntries(
        FILTROS_ITENS.map((f) => [
          f,
          filtrarItens(visita.itens, mapaRespostas, f).length,
        ]),
      ) as Record<FiltroItens, number>,
    [visita.itens, mapaRespostas],
  );

  // Rolagem só depois que a seção/o item alvo já está no DOM: a troca de
  // filtro e o pedido de rolagem acontecem no mesmo evento, então quando o
  // efeito roda a lista já foi redesenhada.
  useEffect(() => {
    if (!pedidoRolagem || !ancoraAlvo.current) return;
    const alvo = document.getElementById(ancoraAlvo.current);
    alvo?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }, [pedidoRolagem]);

  const fotosPorItem = useMemo(() => {
    const mapa = new Map<string, FotoVisita[]>();
    for (const foto of fotos) {
      if (!foto.itemId) continue;
      const lista = mapa.get(foto.itemId) ?? [];
      lista.push(foto);
      mapa.set(foto.itemId, lista);
    }
    return mapa;
  }, [fotos]);

  // Itens NC abaixo do mínimo de fotos: aviso apenas — a conclusão no
  // navegador não é bloqueada (o bloqueio pelo mínimo é do app de campo).
  const itensAbaixoDoMinimo = visita.itens.filter(
    (item) =>
      respostas[item.id]?.resposta === "nao_conforme" &&
      item.fotosMinimas > 0 &&
      (fotosPorItem.get(item.id)?.length ?? 0) < item.fotosMinimas,
  );

  function marcarSalvamento(itemId: string, status?: StatusSalvamento) {
    setSalvamento((atuais) => ({ ...atuais, [itemId]: status }));
  }

  function responder(item: ItemVersao, resposta: Resposta, descricao?: string) {
    setErro(null);
    marcarSalvamento(item.id, "salvando");
    iniciarTransicao(async () => {
      const resultado = await responderItem({
        visitaId: visita.id,
        itemId: item.id,
        resposta,
        descricao,
      });
      if (!resultado.ok) {
        marcarSalvamento(item.id, undefined);
        setErro(resultado.erro);
        toast.error(`Item ${item.codigo} não foi salvo`, {
          description: resultado.erro,
        });
        return;
      }
      marcarSalvamento(item.id, "salvo");
      setRespostas((atuais) => ({
        ...atuais,
        [item.id]: {
          resposta,
          descricao: resposta === "nao_conforme" ? (descricao ?? null) : null,
        },
      }));
    });
  }

  function enviarFotos(itemId: string, arquivos: File[]) {
    setErro(null);
    for (const arquivo of arquivos) {
      const validacao = validarArquivoEvidencia(arquivo);
      if (!validacao.ok) {
        setErro(validacao.erro);
        toast.error("Foto recusada", { description: validacao.erro });
        return;
      }
    }
    marcarSalvamento(itemId, "salvando");
    iniciarTransicao(async () => {
      for (const arquivo of arquivos) {
        const dados = new FormData();
        dados.append("arquivo", arquivo);
        const resultado = await enviarFotoVisita(visita.id, itemId, dados);
        if (!resultado.ok) {
          marcarSalvamento(itemId, undefined);
          setErro(resultado.erro);
          toast.error("Foto não foi enviada", { description: resultado.erro });
          return;
        }
      }
      marcarSalvamento(itemId, "salvo");
    });
  }

  /** Valida antes de abrir a confirmação — nada de perguntar em vão. */
  function pedirConfirmacaoConclusao() {
    setErro(null);
    const validacao = validarConclusaoVisita(
      visita.itens,
      Object.keys(respostas).map((itemId) => ({ itemId })),
    );
    if (!validacao.ok) {
      setErro(validacao.erro);
      toast.error("Ainda não dá para concluir", { description: validacao.erro });
      return;
    }
    setConfirmandoConclusao(true);
  }

  function concluir() {
    setConfirmandoConclusao(false);
    setErro(null);
    iniciarTransicao(async () => {
      const resultado = await concluirVisita(visita.id);
      if (!resultado.ok) {
        setErro(resultado.erro);
        toast.error("Visita não foi concluída", { description: resultado.erro });
        return;
      }
      setConcluida(true);
      toast.success("Visita concluída", {
        description:
          resumo.naoConformes > 0
            ? `${resumo.naoConformes} não conformidade${resumo.naoConformes > 1 ? "s" : ""} — CAPAs criadas automaticamente.`
            : "Nenhuma não conformidade registrada.",
      });
    });
  }

  function rolarAte(ancora: string) {
    ancoraAlvo.current = ancora;
    setPedidoRolagem((n) => n + 1);
  }

  function irAoProximoPendente() {
    const alvo = proximoPendente(visita.itens, mapaRespostas);
    if (!alvo) return;
    // O item pendente não aparece no filtro de NCs — troca para "Pendentes".
    if (filtro === "nao_conformes") setFiltro("pendentes");
    rolarAte(ancoraItem(alvo.id));
  }

  function irAoCapitulo(ancora: string, visivel: boolean) {
    // Capítulo escondido pelo filtro: volta para "Todos" antes de rolar.
    if (!visivel) setFiltro("todos");
    rolarAte(ancora);
  }

  const ancorasVisiveis = new Set(capitulosVisiveis.map((g) => g.ancora));
  const salvandoAlgo = Object.values(salvamento).some((s) => s === "salvando");
  const salvouAlgo = Object.values(salvamento).some((s) => s === "salvo");

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

      {/* Barra fixa: progresso, NCs e "Concluir visita" sempre à mão. */}
      <div className="sticky top-0 z-30 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="min-w-[14rem] flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
              <span>
                Progresso: {resumo.respondidos}/{resumo.total} itens respondidos
              </span>
              <span className="flex items-center gap-3">
                <span
                  className={cn(
                    "tabular-nums",
                    resumo.naoConformes > 0
                      ? "font-bold text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {resumo.naoConformes} NC
                  {resumo.naoConformes === 1 ? "" : "s"}
                </span>
                <span className="tabular-nums">{resumo.progresso}%</span>
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Progresso da visita"
              aria-valuenow={resumo.progresso}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${resumo.progresso}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <IndicadorSalvamento
              salvando={salvandoAlgo}
              salvo={salvouAlgo}
              concluida={concluida}
            />
            {!concluida ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={resumo.pendentes === 0}
                  onClick={irAoProximoPendente}
                >
                  Ir ao próximo pendente
                  <ChevronRight data-icon="inline-end" />
                </Button>
                <Button size="sm" disabled={pendente} onClick={pedirConfirmacaoConclusao}>
                  Concluir visita
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {!concluida ? (
        <p className="flex items-start gap-2 text-xs font-semibold text-warning">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          Toda resposta “Não conforme” abre uma CAPA automaticamente, com prazo
          padrão de 30 dias — a NC nunca fica sem plano de ação.
        </p>
      ) : null}

      {concluida ? (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="size-5 text-primary" />
              Visita concluída
            </CardTitle>
            <CardDescription>
              {resumo.naoConformes > 0
                ? `${resumo.naoConformes} NC${resumo.naoConformes > 1 ? "s" : ""} registrada${resumo.naoConformes > 1 ? "s" : ""} — CAPAs criadas automaticamente.`
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

      {/* Sumário por capítulo — pular direto para a seção da norma. */}
      <nav
        aria-label="Sumário por capítulo da norma"
        className="rounded-xl border bg-card p-4"
      >
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Capítulos da norma
        </p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {capitulos.map((grupo) => (
            <li key={grupo.ancora}>
              <button
                type="button"
                onClick={() =>
                  irAoCapitulo(grupo.ancora, ancorasVisiveis.has(grupo.ancora))
                }
                className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted"
              >
                {grupo.capitulo}
                <span className="tabular-nums text-muted-foreground">
                  {grupo.respondidos}/{grupo.total}
                </span>
                {grupo.naoConformes > 0 ? (
                  <span className="tabular-nums font-bold text-destructive">
                    {grupo.naoConformes} NC
                    {grupo.naoConformes === 1 ? "" : "s"}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Filtro: com 200 itens, rolar tudo são ~30 telas. */}
      <div
        role="group"
        aria-label="Filtrar itens do checklist"
        className="flex flex-wrap gap-2"
      >
        {FILTROS_ITENS.map((opcao) => (
          <button
            key={opcao}
            type="button"
            aria-pressed={filtro === opcao}
            onClick={() => setFiltro(opcao)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors",
              filtro === opcao
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {ROTULO_FILTRO[opcao]}{" "}
            <span className="tabular-nums font-semibold">
              ({totaisPorFiltro[opcao]})
            </span>
          </button>
        ))}
      </div>

      {capitulosVisiveis.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {filtro === "pendentes"
            ? "Nenhum item pendente — todos os itens já foram respondidos."
            : "Nenhuma não conformidade registrada nesta visita."}
        </p>
      ) : null}

      {capitulosVisiveis.map((grupo) => (
        <section
          key={grupo.ancora}
          id={grupo.ancora}
          aria-labelledby={`${grupo.ancora}-titulo`}
          className="space-y-3 scroll-mt-28"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-1">
            <h2
              id={`${grupo.ancora}-titulo`}
              className="text-sm font-extrabold uppercase tracking-wide"
            >
              {grupo.capitulo}
            </h2>
            <p className="text-xs font-semibold tabular-nums text-muted-foreground">
              {grupo.respondidos}/{grupo.total} respondidos
              {grupo.naoConformes > 0 ? (
                <span className="ml-2 font-bold text-destructive">
                  {grupo.naoConformes} NC{grupo.naoConformes === 1 ? "" : "s"}
                </span>
              ) : null}
            </p>
          </div>

          {grupo.itens.map((item) => (
            <ItemDaVisita
              key={item.id}
              item={item}
              resposta={respostas[item.id] ?? null}
              fotos={fotosPorItem.get(item.id) ?? []}
              travado={concluida}
              pendente={pendente}
              modoDemo={modoDemo}
              status={salvamento[item.id]}
              aoResponder={(resposta, descricao) =>
                responder(item, resposta, descricao)
              }
              aoEnviarFotos={(arquivos) => enviarFotos(item.id, arquivos)}
            />
          ))}
        </section>
      ))}

      {!concluida ? (
        <div className="space-y-3 rounded-xl border p-4">
          {itensAbaixoDoMinimo.length > 0 ? (
            <p className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-xs font-semibold text-warning">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              {itensAbaixoDoMinimo.length === 1
                ? `O item ${itensAbaixoDoMinimo[0].codigo} está abaixo do mínimo de fotos.`
                : `${itensAbaixoDoMinimo.length} itens estão abaixo do mínimo de fotos (${itensAbaixoDoMinimo.map((i) => i.codigo).join(", ")}).`}{" "}
              Isso não impede a conclusão aqui no navegador — o mínimo é exigido
              pelo app de campo.
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            A visita só pode ser concluída com todos os itens obrigatórios
            respondidos — o botão “Concluir visita” fica sempre à mão na barra
            do topo.
            {conformidade !== null
              ? ` Conformidade parcial: ${conformidade}%.`
              : ""}
          </p>
        </div>
      ) : null}

      <DialogoConfirmar
        aberto={confirmandoConclusao}
        aoMudarAberto={setConfirmandoConclusao}
        titulo="Concluir esta visita?"
        descricao={`${visita.titulo} — ${visita.clienteNome}. ${resumo.respondidos} de ${resumo.total} itens respondidos, ${resumo.naoConformes} não conformidade${resumo.naoConformes === 1 ? "" : "s"}.`}
        oQueAcontece={[
          "As respostas ficam travadas — ninguém mais edita esta visita pelo painel.",
          "Cada não conformidade abre uma CAPA automaticamente, com prazo padrão de 30 dias.",
          "A conformidade do cliente é recalculada com esta visita.",
        ]}
        oQueNaoAcontece={[
          "Nada é enviado à certificadora nem ao produtor por esta tela.",
          "As CAPAs abertas não são fechadas — elas seguem no módulo de CAPAs.",
          "O contrato e o cadastro do cliente não mudam de situação.",
        ]}
        rotuloConfirmar="Sim, concluir visita"
        confirmarDesabilitado={pendente}
        aoConfirmar={concluir}
      />
    </div>
  );
}

/** Feedback discreto de gravação — some assim que a visita é concluída. */
function IndicadorSalvamento({
  salvando,
  salvo,
  concluida,
}: {
  salvando: boolean;
  salvo: boolean;
  concluida: boolean;
}) {
  if (concluida) return null;
  if (salvando) {
    return (
      <span
        role="status"
        className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
      >
        <Loader2 className="size-3.5 animate-spin" />
        Salvando…
      </span>
    );
  }
  if (!salvo) return null;
  return (
    <span
      role="status"
      className="flex items-center gap-1.5 text-xs font-semibold text-primary"
    >
      <Check className="size-3.5" />
      Salvo
    </span>
  );
}

const OPCOES_RESPOSTA: { valor: Resposta; rotulo: string }[] = [
  { valor: "conforme", rotulo: "Conforme" },
  { valor: "nao_conforme", rotulo: "Não conforme" },
  { valor: "nao_aplicavel", rotulo: "N.A." },
];

function ItemDaVisita({
  item,
  resposta,
  fotos,
  travado,
  pendente,
  modoDemo,
  status,
  aoResponder,
  aoEnviarFotos,
}: {
  item: ItemVersao;
  resposta: RespostaLocal | null;
  fotos: FotoVisita[];
  travado: boolean;
  pendente: boolean;
  modoDemo: boolean;
  status: StatusSalvamento | undefined;
  aoResponder: (resposta: Resposta, descricao?: string) => void;
  aoEnviarFotos: (arquivos: File[]) => void;
}) {
  const [editandoNc, setEditandoNc] = useState(false);
  const [descricao, setDescricao] = useState(resposta?.descricao ?? "");

  const tamanho = tamanhoDescricao(descricao);
  const faltam = Math.max(0, item.descricaoMinima - tamanho);
  const atual = resposta?.resposta ?? null;

  return (
    <div
      id={ancoraItem(item.id)}
      className={cn(
        "scroll-mt-28 rounded-xl border bg-card p-4",
        atual === "nao_conforme" && "border-destructive/40",
      )}
    >
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
        {item.codigo}
        {item.obrigatorio ? " · obrigatório" : ""}
      </p>
      <p className="mt-1 text-sm font-semibold leading-snug">{item.pergunta}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Referência: {item.referenciaNorma}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/*
          Acessibilidade: a seleção não pode ser indicada só pela cor. Cada
          botão carrega o código do item no rótulo (o leitor de tela não lê
          30 botões idênticos) e o estado vai em aria-pressed.
        */}
        <div
          role="group"
          aria-label={`Resposta do item ${item.codigo}`}
          className="flex flex-wrap gap-2"
        >
          {OPCOES_RESPOSTA.map((opcao) => {
            const ativa = atual === opcao.valor;
            const desabilitada =
              travado ||
              pendente ||
              (opcao.valor === "nao_aplicavel" && !item.permiteNa);
            return (
              <Button
                key={opcao.valor}
                size="sm"
                type="button"
                aria-pressed={ativa}
                variant={
                  ativa
                    ? opcao.valor === "nao_conforme"
                      ? "destructive"
                      : opcao.valor === "conforme"
                        ? "default"
                        : "secondary"
                    : "outline"
                }
                className={cn(ativa && "ring-2 ring-ring/50")}
                disabled={desabilitada}
                onClick={() => {
                  if (opcao.valor === "nao_conforme") {
                    setEditandoNc(true);
                    return;
                  }
                  setEditandoNc(false);
                  aoResponder(opcao.valor);
                }}
              >
                {ativa ? <Check data-icon="inline-start" /> : null}
                {opcao.rotulo}
              </Button>
            );
          })}
        </div>

        {atual ? (
          <Badge
            variant={atual === "nao_conforme" ? "destructive" : "secondary"}
            className="ml-auto self-center"
          >
            {ROTULO_RESPOSTA[atual]}
          </Badge>
        ) : null}

        {status && !travado ? (
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-semibold",
              status === "salvo" ? "text-primary" : "text-muted-foreground",
            )}
          >
            {status === "salvo" ? (
              <>
                <Check className="size-3.5" />
                Salvo
              </>
            ) : (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Salvando…
              </>
            )}
          </span>
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

      {atual === "nao_conforme" || editandoNc ? (
        <FotosDoItem
          item={item}
          fotos={fotos}
          travado={travado}
          pendente={pendente}
          modoDemo={modoDemo}
          aoEnviar={aoEnviarFotos}
        />
      ) : null}
    </div>
  );
}

function FotosDoItem({
  item,
  fotos,
  travado,
  pendente,
  modoDemo,
  aoEnviar,
}: {
  item: ItemVersao;
  fotos: FotoVisita[];
  travado: boolean;
  pendente: boolean;
  modoDemo: boolean;
  aoEnviar: (arquivos: File[]) => void;
}) {
  const abaixoDoMinimo = item.fotosMinimas > 0 && fotos.length < item.fotosMinimas;

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-dashed p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={`fotos-${item.id}`} className="text-sm font-bold">
          Fotos da evidência
        </label>
        <span
          className={cn(
            "text-xs font-semibold tabular-nums",
            abaixoDoMinimo ? "text-warning" : "text-primary",
          )}
        >
          {fotos.length}/{item.fotosMinimas} foto
          {item.fotosMinimas === 1 ? "" : "s"}
        </span>
      </div>

      <GaleriaEvidencias
        itens={fotos.map((foto) => ({
          id: foto.id,
          url: foto.url,
          gps: foto.gps,
          data: foto.tiradaEm,
        }))}
        vazio="Nenhuma foto anexada a este item ainda."
      />

      {modoDemo ? (
        <p className="text-xs font-semibold text-muted-foreground">
          Modo demonstração — conecte o Supabase para anexar fotos.
        </p>
      ) : (
        <input
          id={`fotos-${item.id}`}
          type="file"
          multiple
          accept={TIPOS_DE_IMAGEM_PERMITIDOS.join(",")}
          disabled={travado || pendente}
          onChange={(e) => {
            const arquivos = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (arquivos.length > 0) aoEnviar(arquivos);
          }}
          className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-secondary-foreground hover:file:bg-secondary/80"
        />
      )}

      <p className="text-xs text-muted-foreground">
        JPEG, PNG ou WebP, até {TAMANHO_MAXIMO_MB} MB por foto.
        {abaixoDoMinimo
          ? " Abaixo do mínimo do item — aqui no navegador a visita ainda pode ser concluída; o bloqueio pelo mínimo é do app de campo."
          : ""}
      </p>
    </div>
  );
}
