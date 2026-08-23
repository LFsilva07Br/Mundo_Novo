"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import {
  BIBLIOTECA_NORMAS,
  ROTULO_NORMA_BIBLIOTECA,
  type NormaBiblioteca,
} from "@/lib/checklists/biblioteca";
import { criarChecklistDeTemplate } from "@/lib/checklists/biblioteca-acoes";
import type { ChecklistResumo } from "@/lib/checklists/consultas";
import { cn } from "@/lib/utils";

/**
 * Barra multi-normas da tela de checklists: seletor do checklist (quando há
 * mais de uma norma cadastrada) e o botão "Nova norma da biblioteca", que
 * cria um checklist em RASCUNHO a partir dos templates 4C/Orgânico.
 */
export function BarraNormas({
  checklists,
  checklistSelecionadoId,
}: {
  checklists: ChecklistResumo[];
  checklistSelecionadoId: string | null;
}) {
  const id = useId();
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-3">
      {checklists.length > 1 ? (
        <div className="flex items-center gap-2">
          <Label
            htmlFor={id}
            className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground"
          >
            Norma
          </Label>
          <select
            id={id}
            value={checklistSelecionadoId ?? ""}
            disabled={pendente}
            onChange={(evento) => {
              const checklistId = evento.target.value;
              iniciarTransicao(() => {
                router.push(
                  `/painel/checklists?checklist=${encodeURIComponent(checklistId)}`,
                );
              });
            }}
            className="h-8 min-w-64 rounded-lg border border-input bg-card px-2.5 text-sm font-semibold transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          >
            {checklists.map((checklist) => (
              <option key={checklist.id} value={checklist.id}>
                {checklist.nome}
                {checklist.versaoNorma ? ` (${checklist.versaoNorma})` : ""}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Uma norma cadastrada — crie os checklists de outras normas a partir
          da biblioteca.
        </p>
      )}
      <DialogNovaNorma />
    </div>
  );
}

function DialogNovaNorma() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [norma, setNorma] = useState<NormaBiblioteca>("quatro_c");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciarTransicao] = useTransition();

  const template = BIBLIOTECA_NORMAS[norma];

  function criar() {
    setErro(null);
    iniciarTransicao(async () => {
      const resultado = await criarChecklistDeTemplate(norma);
      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }
      setAberto(false);
      if (resultado.id) {
        router.push(
          `/painel/checklists?checklist=${encodeURIComponent(resultado.id)}`,
        );
      }
    });
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(abrir) => {
        setAberto(abrir);
        if (abrir) setErro(null);
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <BookOpen />
        Nova norma da biblioteca
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova norma da biblioteca</DialogTitle>
          <DialogDescription>
            O checklist nasce com a versão 1 em rascunho, com os itens do
            template — revise e publique quando estiver pronto. Nada chega ao
            app antes da publicação.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(BIBLIOTECA_NORMAS) as NormaBiblioteca[]).map(
            (opcao) => (
              <button
                key={opcao}
                type="button"
                onClick={() => setNorma(opcao)}
                className={cn(
                  "rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/40",
                  norma === opcao && "border-primary ring-2 ring-primary/20",
                )}
              >
                <p className="text-sm font-extrabold">
                  {ROTULO_NORMA_BIBLIOTECA[opcao]}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {BIBLIOTECA_NORMAS[opcao].descricao}
                </p>
              </button>
            ),
          )}
        </div>

        <div className="space-y-2">
          <p className="flex flex-wrap items-center gap-1.5 text-sm font-bold">
            {template.nome}
            <Badge variant="outline" className="text-[10px]">
              norma {template.versaoNorma}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {template.itens.length} itens
            </Badge>
          </p>
          <ul className="max-h-52 space-y-1.5 overflow-y-auto rounded-xl bg-muted p-3">
            {template.itens.map((item) => (
              <li key={item.codigo} className="text-xs">
                <span className="font-extrabold">{item.codigo}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {item.pergunta}
                </span>
              </li>
            ))}
          </ul>
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

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancelar
          </DialogClose>
          <Button disabled={pendente} onClick={criar}>
            Criar checklist em rascunho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
