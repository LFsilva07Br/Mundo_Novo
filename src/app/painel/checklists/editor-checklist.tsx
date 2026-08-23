"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  Camera,
  ClipboardList,
  FileText,
  ListChecks,
  Lock,
  Minus,
  Plus,
  Trash2,
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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogoConfirmar } from "@/components/dialogo-confirmar";
import { EstadoVazio } from "@/components/estado-vazio";
import {
  adicionarItem,
  atualizarItem,
  criarRascunho,
  publicarVersao,
  removerItem,
} from "@/lib/checklists/acoes";
import type { ChecklistAtual, ItemVersao } from "@/lib/checklists/tipos";
import { cn } from "@/lib/utils";

type Props = {
  checklist: ChecklistAtual;
};

export function EditorChecklist({ checklist }: Props) {
  const { publicada, rascunho } = checklist;
  const emRascunho = rascunho !== null;
  const versaoExibida = rascunho ?? publicada;

  const [itemSelecionadoId, setItemSelecionadoId] = useState<string | null>(
    versaoExibida?.itens[0]?.id ?? null,
  );
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciarTransicao] = useTransition();

  if (!versaoExibida) {
    return (
      <EstadoVazio
        className="mx-auto max-w-3xl"
        icone={ClipboardList}
        titulo="Este checklist ainda não tem nenhuma versão."
      />
    );
  }

  const itens = versaoExibida.itens;
  const item =
    itens.find((i) => i.id === itemSelecionadoId) ?? itens[0] ?? null;

  function executar(acao: () => Promise<{ ok: boolean } & { erro?: string }>) {
    setErro(null);
    iniciarTransicao(async () => {
      const resultado = await acao();
      if (!resultado.ok) setErro(resultado.erro ?? "Não foi possível concluir a ação.");
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Configuração
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Editor de Checklist
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {checklist.nome}
            {checklist.versaoNorma ? ` · norma ${checklist.versaoNorma}` : null}
            {" · "}
            {itens.length} itens · todo item é vinculado ao capítulo da norma
            correspondente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {publicada ? (
            <Badge variant="secondary">Publicada v{publicada.numero}</Badge>
          ) : (
            <Badge variant="outline">Sem versão publicada</Badge>
          )}
          {rascunho ? (
            <Badge className="bg-warning/15 text-warning">
              Rascunho v{rascunho.numero} em edição
            </Badge>
          ) : null}

          {emRascunho ? (
            <>
              <DialogAdicionarItem
                versaoId={rascunho.id}
                pendente={pendente}
                aoSubmeter={(dados) =>
                  executar(() => adicionarItem(rascunho.id, dados))
                }
              />
              <DialogPublicar
                numero={rascunho.numero}
                numeroPublicada={publicada?.numero ?? null}
                pendente={pendente}
                aoConfirmar={() => executar(() => publicarVersao(rascunho.id))}
              />
            </>
          ) : (
            <Button
              disabled={pendente || !publicada}
              onClick={() => executar(() => criarRascunho(checklist.id))}
            >
              <Plus />
              Criar rascunho v{(publicada?.numero ?? 0) + 1}
            </Button>
          )}
        </div>
      </div>

      {erro ? (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm font-semibold text-destructive"
        >
          <AlertTriangle className="size-4 shrink-0" />
          {erro}
        </p>
      ) : null}

      {emRascunho ? (
        <p className="rounded-xl bg-warning/10 p-3 text-sm font-semibold text-warning">
          Você está editando o rascunho v{rascunho.numero}. As alterações só
          chegam ao app de campo depois de publicar esta versão.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-2">
          {itens.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => setItemSelecionadoId(i.id)}
              className={cn(
                "w-full rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40",
                item?.id === i.id && "border-primary ring-2 ring-primary/20",
              )}
            >
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                {i.codigo}
                {i.capitulo ? ` · ${i.capitulo}` : null}
              </p>
              <p className="mt-1 text-sm font-semibold leading-snug">
                {i.pergunta}
              </p>
              <p className="mt-2 flex flex-wrap gap-1.5">
                {i.obrigatorio ? (
                  <Badge variant="secondary" className="text-[10px]">
                    Obrigatório
                  </Badge>
                ) : null}
                <Badge variant="outline" className="text-[10px]">
                  Foto mín. {i.fotosMinimas}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  Descrição mín. {i.descricaoMinima} car.
                </Badge>
              </p>
            </button>
          ))}
        </div>

        {item ? (
          emRascunho ? (
            <FormularioItem
              key={item.id}
              item={item}
              pendente={pendente}
              aoSalvar={(campos) =>
                executar(() => atualizarItem(item.id, campos))
              }
              aoRemover={() => executar(() => removerItem(item.id))}
            />
          ) : (
            <PainelLeitura item={item} />
          )
        ) : (
          <Card className="h-fit">
            <CardContent className="p-6">
              <EstadoVazio
                semMoldura
                icone={ListChecks}
                titulo="Nenhum item nesta versão ainda."
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function PainelLeitura({ item }: { item: ItemVersao }) {
  return (
    <Card className="h-fit lg:sticky lg:top-6">
      <CardHeader>
        <CardTitle className="text-base">
          Propriedades do item {item.codigo}
        </CardTitle>
        <CardDescription>
          Estas regras alimentam em tempo real o formulário de NC do app de
          campo. Para alterar, crie um rascunho.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex items-start gap-3 rounded-xl bg-muted p-3">
          <Lock className="mt-0.5 size-4 text-primary" />
          <div>
            <p className="font-bold">
              {item.obrigatorio ? "Item obrigatório" : "Item opcional"}
            </p>
            <p className="text-muted-foreground">
              {item.obrigatorio
                ? "Bloqueia a conclusão da visita se não respondido."
                : "Pode ficar sem resposta na visita."}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-muted p-3">
          <Camera className="mt-0.5 size-4 text-primary" />
          <div>
            <p className="font-bold">
              Foto obrigatória em NC — mínimo {item.fotosMinimas}
            </p>
            <p className="text-muted-foreground">
              Com GPS e horário anexados automaticamente.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-muted p-3">
          <FileText className="mt-0.5 size-4 text-primary" />
          <div>
            <p className="font-bold">
              Descrição obrigatória — mínimo {item.descricaoMinima} caracteres
            </p>
            <p className="text-muted-foreground">
              O contador aparece em tempo real no app do consultor.
            </p>
          </div>
        </div>
        <p className="rounded-xl bg-accent/60 p-3 text-xs font-semibold text-accent-foreground">
          Referência na norma: {item.referenciaNorma}
        </p>
        <p className="text-xs text-muted-foreground">
          Alterações são versionadas e só chegam ao app após a publicação da
          nova versão do checklist.
        </p>
      </CardContent>
    </Card>
  );
}

type CamposFormularioItem = {
  pergunta: string;
  referenciaNorma: string;
  obrigatorio: boolean;
  fotosMinimas: number;
  descricaoMinima: number;
};

function FormularioItem({
  item,
  pendente,
  aoSalvar,
  aoRemover,
}: {
  item: ItemVersao;
  pendente: boolean;
  aoSalvar: (campos: CamposFormularioItem) => void;
  aoRemover: () => void;
}) {
  const [pergunta, setPergunta] = useState(item.pergunta);
  const [referenciaNorma, setReferenciaNorma] = useState(item.referenciaNorma);
  const [obrigatorio, setObrigatorio] = useState(item.obrigatorio);
  const [fotosMinimas, setFotosMinimas] = useState(item.fotosMinimas);
  const [descricaoMinima, setDescricaoMinima] = useState(item.descricaoMinima);

  return (
    <Card className="h-fit lg:sticky lg:top-6">
      <CardHeader>
        <CardTitle className="text-base">
          Editar item {item.codigo}
        </CardTitle>
        <CardDescription>
          As mudanças valem para o rascunho e só chegam ao app após a
          publicação.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-1.5">
          <Label htmlFor={`pergunta-${item.id}`}>Pergunta</Label>
          <textarea
            id={`pergunta-${item.id}`}
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`referencia-${item.id}`}>
            Referência na norma (obrigatória)
          </Label>
          <Input
            id={`referencia-${item.id}`}
            value={referenciaNorma}
            onChange={(e) => setReferenciaNorma(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 rounded-xl bg-muted p-3 font-semibold">
          <input
            type="checkbox"
            checked={obrigatorio}
            onChange={(e) => setObrigatorio(e.target.checked)}
            className="size-4 accent-primary"
          />
          Item obrigatório — bloqueia a conclusão da visita
        </label>

        <Contador
          rotulo="Fotos mínimas em NC"
          valor={fotosMinimas}
          passo={1}
          minimo={0}
          aoMudar={setFotosMinimas}
        />
        <Contador
          rotulo="Descrição mínima (caracteres)"
          valor={descricaoMinima}
          passo={10}
          minimo={0}
          aoMudar={setDescricaoMinima}
        />

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            disabled={pendente || pergunta.trim() === "" || referenciaNorma.trim() === ""}
            onClick={() =>
              aoSalvar({
                pergunta,
                referenciaNorma,
                obrigatorio,
                fotosMinimas,
                descricaoMinima,
              })
            }
          >
            Salvar alterações
          </Button>
          <Button variant="destructive" disabled={pendente} onClick={aoRemover}>
            <Trash2 />
            Remover item
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Contador({
  rotulo,
  valor,
  passo,
  minimo,
  aoMudar,
}: {
  rotulo: string;
  valor: number;
  passo: number;
  minimo: number;
  aoMudar: (valor: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-muted p-3">
      <span className="font-semibold">{rotulo}</span>
      <span className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={`Diminuir ${rotulo.toLowerCase()}`}
          disabled={valor - passo < minimo}
          onClick={() => aoMudar(Math.max(minimo, valor - passo))}
        >
          <Minus />
        </Button>
        <span className="min-w-8 text-center font-bold tabular-nums">
          {valor}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={`Aumentar ${rotulo.toLowerCase()}`}
          onClick={() => aoMudar(valor + passo)}
        >
          <Plus />
        </Button>
      </span>
    </div>
  );
}

function DialogAdicionarItem({
  versaoId,
  pendente,
  aoSubmeter,
}: {
  versaoId: string;
  pendente: boolean;
  aoSubmeter: (dados: {
    codigo: string;
    capitulo: string | null;
    pergunta: string;
    referenciaNorma: string;
  }) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [capitulo, setCapitulo] = useState("");
  const [pergunta, setPergunta] = useState("");
  const [referenciaNorma, setReferenciaNorma] = useState("");

  const valido =
    codigo.trim() !== "" && pergunta.trim() !== "" && referenciaNorma.trim() !== "";

  return (
    <Dialog
      open={aberto}
      onOpenChange={(abrir) => {
        setAberto(abrir);
        if (abrir) {
          setCodigo("");
          setCapitulo("");
          setPergunta("");
          setReferenciaNorma("");
        }
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <Plus />
        Adicionar item
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar item ao rascunho</DialogTitle>
          <DialogDescription>
            O item nasce com as regras padrão (obrigatório, 2 fotos, descrição
            mínima de 100 caracteres) — ajuste depois no painel de propriedades.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={`novo-codigo-${versaoId}`}>Código</Label>
            <Input
              id={`novo-codigo-${versaoId}`}
              placeholder="Ex.: 1.6.2 ou EST-5"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`novo-capitulo-${versaoId}`}>
              Capítulo (opcional)
            </Label>
            <Input
              id={`novo-capitulo-${versaoId}`}
              placeholder="Ex.: Cap. 1 · Gerência"
              value={capitulo}
              onChange={(e) => setCapitulo(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`nova-pergunta-${versaoId}`}>Pergunta</Label>
            <textarea
              id={`nova-pergunta-${versaoId}`}
              rows={3}
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`nova-referencia-${versaoId}`}>
              Referência na norma (obrigatória)
            </Label>
            <Input
              id={`nova-referencia-${versaoId}`}
              placeholder="Ex.: RA 1.4 — cap. 1.6.2"
              value={referenciaNorma}
              onChange={(e) => setReferenciaNorma(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancelar
          </DialogClose>
          <Button
            disabled={pendente || !valido}
            onClick={() => {
              aoSubmeter({
                codigo: codigo.trim(),
                capitulo: capitulo.trim() === "" ? null : capitulo.trim(),
                pergunta: pergunta.trim(),
                referenciaNorma: referenciaNorma.trim(),
              });
              setAberto(false);
            }}
          >
            Adicionar item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogPublicar({
  numero,
  numeroPublicada,
  pendente,
  aoConfirmar,
}: {
  numero: number;
  numeroPublicada: number | null;
  pendente: boolean;
  aoConfirmar: () => void;
}) {
  return (
    <DialogoConfirmar
      gatilho={<Button>Publicar versão</Button>}
      titulo={`Publicar a versão v${numero}?`}
      oQueMuda={
        <>
          A versão v{numero} passa a valer imediatamente e chega ao app de campo
          após a publicação.
          {numeroPublicada !== null
            ? ` A versão publicada atual (v${numeroPublicada}) será arquivada.`
            : ""}
        </>
      }
      oQueNaoMuda="Visitas já iniciadas continuam na versão em que começaram."
      rotuloAcao={`Publicar v${numero}`}
      pendente={pendente}
      aoConfirmar={aoConfirmar}
    />
  );
}
