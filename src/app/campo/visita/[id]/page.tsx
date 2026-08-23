"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  ImageOff,
  MapPin,
  Send,
  X,
} from "lucide-react";
import { QuadroAssinatura } from "@/components/assinatura/quadro-assinatura";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { obterVisitaLocal } from "@/lib/campo/banco-local";
import { gravarVisita } from "@/lib/campo/gravacao";
import { copiarArquivosSelecionados } from "@/lib/campo/anexar-fotos";
import { capturarGps, redimensionarFoto } from "@/lib/campo/midia";
import { obterOuBaixarPacote } from "@/lib/campo/pacote";
import {
  aplicarResposta,
  divergenciaDeVersao,
  fotosDoItem,
  progressoVisita,
  validarConclusaoCampo,
  type PendenciaConclusao,
} from "@/lib/campo/regras";
import { sincronizar } from "@/lib/campo/sincronizacao";
import type { FotoLocal, VisitaLocal } from "@/lib/campo/tipos";
import { calcularConformidade, tamanhoDescricao } from "@/lib/checklists/regras";
import type { ItemVersao, Resposta } from "@/lib/checklists/tipos";
import { cn } from "@/lib/utils";

/**
 * Execução da visita — 100% offline. Cada resposta, descrição e foto é
 * gravada no IndexedDB na hora (rascunho contínuo): se o aparelho desligar,
 * nada se perde.
 */
export default function PaginaVisita({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const roteador = useRouter();

  const [visita, setVisita] = useState<VisitaLocal | null>(null);
  // Espelho síncrono da visita: mudanças em sequência rápida (toques
  // seguidos) nunca leem um estado defasado do React.
  const visitaRef = useRef<VisitaLocal | null>(null);
  const [itens, setItens] = useState<ItemVersao[]>([]);
  const [versaoAtualId, setVersaoAtualId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  // Falha de gravação no aparelho: fica na tela até salvar de novo.
  const [falhaGravacao, setFalhaGravacao] = useState<string | null>(null);
  const [etapa, setEtapa] = useState<"execucao" | "resumo">("execucao");
  const [pendencias, setPendencias] = useState<PendenciaConclusao[]>([]);
  const [gpsFim, setGpsFim] = useState<string | null>(null);
  const [nomeAssinante, setNomeAssinante] = useState("");
  const [assinaturaDataUrl, setAssinaturaDataUrl] = useState<string | null>(null);
  const [finalizando, setFinalizando] = useState(false);

  useEffect(() => {
    void Promise.all([obterVisitaLocal(id), obterOuBaixarPacote()]).then(
      ([visitaLocal, pacote]) => {
        visitaRef.current = visitaLocal;
        setVisita(visitaLocal);
        setItens(pacote?.checklist?.publicada?.itens ?? []);
        setVersaoAtualId(pacote?.checklist?.publicada?.id ?? null);
        setCarregando(false);
      },
    );
  }, [id]);

  /**
   * Grava no IndexedDB a cada mudança — o rascunho é contínuo. Toda falha
   * de gravação vira aviso permanente na tela: nunca falha em silêncio.
   */
  function atualizar(mudar: (atual: VisitaLocal) => VisitaLocal) {
    const atual = visitaRef.current;
    if (!atual) return;
    const nova = mudar(atual);
    visitaRef.current = nova;
    setVisita(nova);
    void gravarVisita(nova).then((resultado) => {
      setFalhaGravacao(resultado.ok ? null : resultado.mensagem);
    });
  }

  function responder(item: ItemVersao, resposta: Resposta) {
    atualizar((atual) => ({
      ...atual,
      respostas: aplicarResposta(atual.respostas, item.id, resposta),
    }));
  }

  function descrever(item: ItemVersao, descricao: string) {
    atualizar((atual) => ({
      ...atual,
      respostas: atual.respostas.map((r) =>
        r.itemId === item.id ? { ...r, descricao } : r,
      ),
    }));
  }

  async function anexarFotos(item: ItemVersao, arquivos: FileList | null) {
    if (!arquivos?.length) return;
    const selecionados = copiarArquivosSelecionados(arquivos);
    const gps = await capturarGps();
    const novas: FotoLocal[] = [];
    for (const arquivo of selecionados) {
      try {
        novas.push({
          itemId: item.id,
          dataUrl: await redimensionarFoto(arquivo),
          gps,
          tiradaEm: new Date().toISOString(),
        });
      } catch {
        // Foto ilegível — segue para a próxima sem travar a visita.
      }
    }
    if (novas.length) {
      atualizar((atual) => ({ ...atual, fotos: [...atual.fotos, ...novas] }));
    }
  }

  function removerFoto(item: ItemVersao, indice: number) {
    atualizar((atual) => {
      const alvo = fotosDoItem(atual.fotos, item.id)[indice];
      return { ...atual, fotos: atual.fotos.filter((f) => f !== alvo) };
    });
  }

  async function irParaResumo() {
    if (!visita) return;
    const resultado = validarConclusaoCampo(itens, visita.respostas, visita.fotos);
    if (!resultado.ok) {
      setPendencias(resultado.pendencias);
      return;
    }
    setPendencias([]);
    setEtapa("resumo");
    window.scrollTo({ top: 0 });
    setGpsFim(await capturarGps());
  }

  async function finalizarVisita() {
    if (!visita || !assinaturaDataUrl || !nomeAssinante.trim()) return;
    setFinalizando(true);
    const concluida: VisitaLocal = {
      ...visita,
      concluidaEm: new Date().toISOString(),
      gpsFim,
      assinatura: { dataUrl: assinaturaDataUrl, nome: nomeAssinante.trim() },
    };
    const gravou = await gravarVisita(concluida);
    if (!gravou.ok) {
      // Sem gravação não há fila de envio: não deixe o consultor sair da
      // tela achando que a visita foi fechada.
      setFalhaGravacao(gravou.mensagem);
      setFinalizando(false);
      return;
    }
    setFalhaGravacao(null);
    visitaRef.current = concluida;
    setVisita(concluida);
    if (typeof navigator !== "undefined" && navigator.onLine) {
      await sincronizar();
    }
    roteador.push("/campo/sync");
  }

  if (carregando) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Abrindo a visita…
      </p>
    );
  }

  if (!visita) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Visita não encontrada neste aparelho.
      </p>
    );
  }

  if (visita.concluidaEm) {
    return (
      <Card className="rounded-3xl">
        <CardContent className="space-y-3 p-6 text-center">
          <CheckCircle2 className="mx-auto size-10 text-success" />
          <p className="text-lg font-extrabold">Visita concluída</p>
          <p className="text-sm text-muted-foreground">
            {visita.titulo} — {visita.clienteNome}.{" "}
            {visita.sincronizadaEm
              ? "Já enviada ao escritório."
              : "Aguardando sincronização."}
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => roteador.push("/campo/sync")}
          >
            Ver fila de envio
          </Button>
        </CardContent>
      </Card>
    );
  }

  const progresso = progressoVisita(itens, visita.respostas);
  const divergencia = divergenciaDeVersao(visita, versaoAtualId, itens);

  /**
   * Aviso permanente de falha ao salvar no aparelho. Não é um toast que some:
   * fica na tela até a próxima gravação dar certo.
   */
  const avisoGravacao = falhaGravacao ? (
    <div
      role="alert"
      aria-live="assertive"
      className="sticky top-[57px] z-30 -mx-4 flex items-start gap-2 border-y border-destructive bg-destructive px-4 py-3 text-sm font-bold text-white"
    >
      <AlertTriangle className="mt-0.5 size-5 shrink-0" />
      <span>{falhaGravacao}</span>
    </div>
  ) : null;

  const avisoVersao = divergencia.divergente ? (
    <div
      role="alert"
      className="rounded-2xl border border-warning bg-warning/15 p-4 text-xs font-bold text-warning"
    >
      <p className="flex items-center gap-2 text-sm">
        <AlertTriangle className="size-4 shrink-0" />
        O checklist mudou depois que esta visita começou
      </p>
      <p className="mt-1.5 font-semibold">
        {divergencia.respostasOrfas > 0 || divergencia.fotosOrfas > 0
          ? `${divergencia.respostasOrfas} resposta${divergencia.respostasOrfas === 1 ? "" : "s"} e ${divergencia.fotosOrfas} foto${divergencia.fotosOrfas === 1 ? "" : "s"} desta visita são de itens da versão anterior. Nada foi apagado do aparelho, mas esses itens não aparecem na lista abaixo.`
          : "A lista de itens abaixo é de uma versão mais nova que a usada no início da visita."}{" "}
        Conclua e sincronize esta visita antes de começar outra, e avise o
        escritório.
      </p>
    </div>
  ) : null;

  if (etapa === "resumo") {
    const conformidade = calcularConformidade(visita.respostas);
    const ncs = visita.respostas.filter((r) => r.resposta === "nao_conforme");
    return (
      <div className="space-y-4">
        {avisoGravacao}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Resumo da visita</h1>
          <p className="text-sm text-muted-foreground">
            {visita.titulo} — {visita.clienteNome}
          </p>
        </div>
        {avisoVersao}

        <div className="grid grid-cols-3 gap-3">
          <Card className="rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-extrabold text-primary">
                {conformidade === null ? "—" : `${conformidade}%`}
              </p>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Conformidade
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-extrabold">{visita.respostas.length}</p>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Respondidos
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-extrabold text-destructive">{ncs.length}</p>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Não conform.
              </p>
            </CardContent>
          </Card>
        </div>

        {ncs.length > 0 ? (
          <p className="rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            Cada não conformidade abre um plano de ação (CAPA) automaticamente
            na sincronização.
          </p>
        ) : null}

        <div className="flex items-center gap-2 rounded-xl bg-muted p-3 text-xs font-semibold">
          <MapPin className="size-4 shrink-0 text-primary" />
          {gpsFim
            ? `GPS de encerramento registrado (${gpsFim})`
            : "Sem GPS de encerramento — a visita segue mesmo assim."}
        </div>

        <Card className="rounded-3xl">
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="text-sm font-extrabold">Assinatura do produtor</p>
              <p className="text-xs text-muted-foreground">
                Quem acompanhou a visita assina aqui, direto na tela.
              </p>
            </div>
            <QuadroAssinatura onChange={setAssinaturaDataUrl} />
            <div className="space-y-1.5">
              <Label htmlFor="nome-assinante">Nome de quem assina</Label>
              <Input
                id="nome-assinante"
                value={nomeAssinante}
                onChange={(e) => setNomeAssinante(e.target.value)}
                placeholder="Nome completo"
                className="h-11 rounded-xl"
              />
            </div>
            <Button
              size="lg"
              className="h-12 w-full gap-2 rounded-xl text-base font-bold"
              disabled={!assinaturaDataUrl || !nomeAssinante.trim() || finalizando}
              onClick={finalizarVisita}
            >
              <Send className="size-4" />
              {finalizando ? "Finalizando…" : "Finalizar visita"}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setEtapa("execucao")}
              disabled={finalizando}
            >
              Voltar ao checklist
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {avisoGravacao}
      <div>
        <h1 className="text-xl font-extrabold leading-tight tracking-tight">
          {visita.titulo}
        </h1>
        <p className="text-sm text-muted-foreground">{visita.clienteNome}</p>
      </div>
      {avisoVersao}

      <div className="sticky top-[57px] z-20 -mx-4 space-y-1 border-b border-border bg-background/95 px-4 py-2 backdrop-blur">
        <div className="flex items-center justify-between text-xs font-bold">
          <span>
            {visita.respostas.length} de {itens.length} itens
          </span>
          <span className="text-primary">{progresso}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={progresso}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {itens.map((item) => (
          <CartaoItem
            key={item.id}
            item={item}
            visita={visita}
            aoResponder={responder}
            aoDescrever={descrever}
            aoAnexarFotos={anexarFotos}
            aoRemoverFoto={removerFoto}
          />
        ))}
      </div>

      {pendencias.length > 0 ? (
        <Card className="rounded-2xl border-destructive/40 bg-destructive/10">
          <CardContent className="space-y-1.5 p-4">
            <p className="text-sm font-extrabold text-destructive">
              Antes de concluir, resolva:
            </p>
            <ul className="space-y-1 text-xs font-semibold text-destructive">
              {pendencias.map((p, indice) => (
                <li key={`${p.codigoItem}-${indice}`}>
                  Item {p.codigoItem}: {p.motivo}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Button
        size="lg"
        className="h-12 w-full gap-2 rounded-xl text-base font-bold"
        onClick={irParaResumo}
      >
        <Check className="size-4" />
        Concluir visita
      </Button>
    </div>
  );
}

const OPCOES: { valor: Resposta; rotulo: string }[] = [
  { valor: "conforme", rotulo: "Conforme" },
  { valor: "nao_conforme", rotulo: "Não conforme" },
  { valor: "nao_aplicavel", rotulo: "N.A." },
];

function CartaoItem({
  item,
  visita,
  aoResponder,
  aoDescrever,
  aoAnexarFotos,
  aoRemoverFoto,
}: {
  item: ItemVersao;
  visita: VisitaLocal;
  aoResponder: (item: ItemVersao, resposta: Resposta) => void;
  aoDescrever: (item: ItemVersao, descricao: string) => void;
  aoAnexarFotos: (item: ItemVersao, arquivos: FileList | null) => void;
  aoRemoverFoto: (item: ItemVersao, indice: number) => void;
}) {
  const [confirmandoRemocao, setConfirmandoRemocao] = useState<number | null>(
    null,
  );
  const resposta = visita.respostas.find((r) => r.itemId === item.id);
  const fotos = fotosDoItem(visita.fotos, item.id);
  const ehNc = resposta?.resposta === "nao_conforme";
  const tamanho = tamanhoDescricao(resposta?.descricao);
  // Fora da NC, descrição e fotos ficam guardadas no aparelho — o consultor
  // precisa saber que elas existem e que NÃO serão enviadas assim.
  const descricaoGuardada = !ehNc ? (resposta?.descricaoGuardada ?? null) : null;
  const guardadas = !ehNc && (fotos.length > 0 || Boolean(descricaoGuardada));

  return (
    <Card
      className={cn(
        "rounded-2xl",
        ehNc && "border-destructive/40",
        resposta?.resposta === "conforme" && "border-success/40",
      )}
    >
      <CardContent className="space-y-3 p-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {item.codigo} · {item.referenciaNorma}
            {item.obrigatorio ? " · obrigatório" : ""}
          </p>
          <p className="mt-0.5 text-sm font-bold leading-snug">{item.pergunta}</p>
        </div>

        <div className="grid grid-cols-3 gap-2" role="group" aria-label={`Resposta do item ${item.codigo}`}>
          {OPCOES.map((opcao) => {
            const desabilitada =
              opcao.valor === "nao_aplicavel" && !item.permiteNa;
            const ativa = resposta?.resposta === opcao.valor;
            return (
              <button
                key={opcao.valor}
                type="button"
                disabled={desabilitada}
                aria-pressed={ativa}
                onClick={() => aoResponder(item, opcao.valor)}
                className={cn(
                  // Alvo de toque de 48px: dedo com luva, sob sol, em pé.
                  "min-h-12 rounded-xl border px-2 py-2.5 text-sm font-bold transition-colors disabled:opacity-40",
                  ativa
                    ? opcao.valor === "nao_conforme"
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : opcao.valor === "conforme"
                        ? "border-success bg-success/10 text-success"
                        : "border-primary bg-secondary text-secondary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                {opcao.rotulo}
              </button>
            );
          })}
        </div>

        {ehNc ? (
          <div className="space-y-3 rounded-xl bg-destructive/5 p-3">
            <div className="space-y-1">
              <Label htmlFor={`descricao-${item.id}`} className="text-xs">
                Descreva a não conformidade
              </Label>
              <textarea
                id={`descricao-${item.id}`}
                value={resposta?.descricao ?? ""}
                onChange={(e) => aoDescrever(item, e.target.value)}
                rows={4}
                placeholder="O que foi encontrado, onde e qual o risco…"
                className="w-full rounded-xl border border-input bg-card p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <p
                className={cn(
                  "text-[11px] font-semibold",
                  tamanho >= item.descricaoMinima
                    ? "text-success"
                    : "text-muted-foreground",
                )}
              >
                {tamanho} de {item.descricaoMinima} caracteres mínimos
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor={`fotos-${item.id}`}
                className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card text-xs font-bold text-muted-foreground hover:bg-muted"
              >
                <Camera className="size-4" />
                Tirar/anexar fotos ({fotos.length} de {item.fotosMinimas} mínimas)
              </Label>
              <input
                id={`fotos-${item.id}`}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="sr-only"
                onChange={(e) => {
                  aoAnexarFotos(item, e.target.files);
                  e.target.value = "";
                }}
              />
              {fotos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {fotos.map((foto, indice) => (
                    <div key={`${item.id}-${indice}`} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={foto.dataUrl}
                        alt={`Evidência ${indice + 1} do item ${item.codigo}`}
                        className="aspect-square w-full rounded-lg object-cover"
                      />
                      {confirmandoRemocao === indice ? (
                        // Apagar evidência é irreversível: confirma antes.
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-lg bg-background/95 p-1">
                          <p className="text-center text-[10px] font-bold leading-tight">
                            Apagar esta foto?
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmandoRemocao(null);
                              aoRemoverFoto(item, indice);
                            }}
                            className="min-h-8 w-full rounded-md bg-destructive px-1 text-[11px] font-bold text-white"
                          >
                            Apagar
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmandoRemocao(null)}
                            className="min-h-8 w-full rounded-md border border-border bg-card px-1 text-[11px] font-bold"
                          >
                            Manter
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          aria-label={`Remover evidência ${indice + 1}`}
                          onClick={() => setConfirmandoRemocao(indice)}
                          className="absolute right-0.5 top-0.5 flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow"
                        >
                          <X className="size-4" />
                        </button>
                      )}
                      {foto.gps ? (
                        <span className="absolute bottom-1 left-1 rounded bg-background/80 px-1 text-[9px] font-bold">
                          GPS ✓
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : guardadas ? (
          <div
            role="status"
            className="flex items-start gap-2 rounded-xl border border-warning/50 bg-warning/10 p-3 text-xs font-semibold text-warning"
          >
            <ImageOff className="mt-0.5 size-4 shrink-0" />
            <span>
              {fotos.length > 0
                ? `${fotos.length} foto${fotos.length === 1 ? "" : "s"} ${descricaoGuardada ? "e a descrição escrita " : ""}deste item continuam guardadas no aparelho`
                : "A descrição escrita continua guardada no aparelho"}
              , mas não serão enviadas ao escritório enquanto a resposta não
              for “Não conforme”. Volte para “Não conforme” para usá-las.
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
