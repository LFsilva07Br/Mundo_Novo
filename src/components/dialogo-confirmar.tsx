"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
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

/**
 * Confirmação de ação que não dá para desfazer sozinha.
 *
 * O padrão nasceu do diálogo "Publicar versão" do editor de checklist: além de
 * perguntar, o texto diz **o que muda** e **o que não muda** — para quem aperta
 * o botão saber exatamente o tamanho do estrago antes de confirmar.
 *
 * Pode ser usado de dois jeitos:
 * - com `gatilho`: o próprio componente abre e fecha o diálogo;
 * - com `aberto` + `aoMudarAberto`: quem chama controla a abertura.
 */
export type PropsDialogoConfirmar = {
  /** Pergunta no topo. Ex.: "Remover o contato Maria?" */
  titulo: string;
  /** O que a confirmação provoca — sempre em linguagem de negócio. */
  oQueMuda?: ReactNode;
  /** O que segue intacto — evita o medo de apertar o botão. */
  oQueNaoMuda?: ReactNode;
  /** Contexto do registro afetado (código, cliente, números). */
  descricao?: ReactNode;
  /** Consequências em lista — alternativa a `oQueMuda` para textos longos. */
  oQueAcontece?: string[];
  /** O que segue intacto, em lista. */
  oQueNaoAcontece?: string[];
  /** Texto do botão que confirma. Ex.: "Remover contato". */
  rotuloAcao?: string;
  /** Mesmo papel de `rotuloAcao` — mantido para chamadas que já usam este nome. */
  rotuloConfirmar?: string;
  /** Mesmo papel de `pendente`. */
  confirmarDesabilitado?: boolean;
  /** Texto do botão que desiste. Padrão: "Cancelar". */
  rotuloCancelar?: string;
  /** Ação perigosa (remover, desativar, fechar) — pinta o botão de vermelho. */
  destrutivo?: boolean;
  /** Bloqueia o botão enquanto a ação está em andamento. */
  pendente?: boolean;
  /** Executado quando a pessoa confirma. */
  aoConfirmar: () => void;
  /** Elemento que abre o diálogo (modo não controlado). */
  gatilho?: ReactElement;
  /** Abertura controlada por quem chama. */
  aberto?: boolean;
  /** Avisa a mudança de abertura no modo controlado. */
  aoMudarAberto?: (aberto: boolean) => void;
  /** Conteúdo extra dentro do diálogo (ex.: campo de motivo da rejeição). */
  children?: ReactNode;
};

export function DialogoConfirmar({
  titulo,
  oQueMuda,
  oQueNaoMuda,
  descricao,
  oQueAcontece,
  oQueNaoAcontece,
  rotuloAcao,
  rotuloConfirmar,
  confirmarDesabilitado = false,
  rotuloCancelar = "Cancelar",
  destrutivo = false,
  pendente = false,
  aoConfirmar,
  gatilho,
  aberto,
  aoMudarAberto,
  children,
}: PropsDialogoConfirmar) {
  const [abertoInterno, setAbertoInterno] = useState(false);
  const rotulo = rotuloAcao ?? rotuloConfirmar ?? "Confirmar";
  const bloqueado = pendente || confirmarDesabilitado;
  const controlado = aberto !== undefined;
  const estaAberto = controlado ? aberto : abertoInterno;

  function mudarAbertura(proximo: boolean) {
    if (!controlado) setAbertoInterno(proximo);
    aoMudarAberto?.(proximo);
  }

  return (
    <Dialog open={estaAberto} onOpenChange={mudarAbertura}>
      {gatilho ? <DialogTrigger render={gatilho} /> : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-2">
            {destrutivo ? (
              <AlertTriangle
                className="mt-px size-4 shrink-0 text-destructive"
                aria-hidden
              />
            ) : null}
            {titulo}
          </DialogTitle>
          <DialogDescription>{descricao ?? oQueMuda}</DialogDescription>
        </DialogHeader>

        {descricao && oQueMuda ? (
          <p className="text-sm text-muted-foreground">{oQueMuda}</p>
        ) : null}

        {oQueAcontece?.length ? (
          <div className="text-sm">
            <p className="font-bold">O que acontece</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
              {oQueAcontece.map((linha) => (
                <li key={linha}>{linha}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {oQueNaoAcontece?.length ? (
          <div className="rounded-xl bg-muted p-3 text-sm">
            <p className="font-bold">O que NÃO acontece</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
              {oQueNaoAcontece.map((linha) => (
                <li key={linha}>{linha}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {oQueNaoMuda ? (
          <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
            <span className="font-bold text-foreground">
              O que não muda:{" "}
            </span>
            {oQueNaoMuda}
          </p>
        ) : null}

        {children}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            {rotuloCancelar}
          </DialogClose>
          <Button
            variant={destrutivo ? "destructive" : "default"}
            disabled={bloqueado}
            onClick={() => {
              aoConfirmar();
              mudarAbertura(false);
            }}
          >
            {rotulo}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
