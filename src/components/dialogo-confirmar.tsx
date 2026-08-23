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
  oQueMuda: ReactNode;
  /** O que segue intacto — evita o medo de apertar o botão. */
  oQueNaoMuda?: ReactNode;
  /** Texto do botão que confirma. Ex.: "Remover contato". */
  rotuloAcao: string;
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
};

export function DialogoConfirmar({
  titulo,
  oQueMuda,
  oQueNaoMuda,
  rotuloAcao,
  rotuloCancelar = "Cancelar",
  destrutivo = false,
  pendente = false,
  aoConfirmar,
  gatilho,
  aberto,
  aoMudarAberto,
}: PropsDialogoConfirmar) {
  const [abertoInterno, setAbertoInterno] = useState(false);
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
          <DialogDescription>{oQueMuda}</DialogDescription>
        </DialogHeader>

        {oQueNaoMuda ? (
          <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
            <span className="font-bold text-foreground">
              O que não muda:{" "}
            </span>
            {oQueNaoMuda}
          </p>
        ) : null}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            {rotuloCancelar}
          </DialogClose>
          <Button
            variant={destrutivo ? "destructive" : "default"}
            disabled={pendente}
            onClick={() => {
              aoConfirmar();
              mudarAbertura(false);
            }}
          >
            {rotuloAcao}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
