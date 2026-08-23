"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  appJaInstalado,
  conviteDispensado,
  detectarPlataforma,
  dispensarConvite,
  instrucaoInstalacao,
} from "@/lib/campo/instalacao";

/**
 * Convite discreto para instalar o App de Campo na tela de início.
 *
 * Instalado, o app abre sem a barra do navegador (mais tela para o
 * checklist) e o navegador protege melhor os dados guardados no aparelho.
 * Se o navegador oferecer o `beforeinstallprompt`, instala com um toque;
 * senão, mostra o caminho manual de iOS/Android. Dispensar é definitivo —
 * a escolha fica no IndexedDB.
 */

/** Evento do Chrome/Edge — ainda não faz parte do TypeScript padrão. */
type EventoInstalacao = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function ConviteInstalacao() {
  const [visivel, setVisivel] = useState(false);
  const [evento, setEvento] = useState<EventoInstalacao | null>(null);
  const [instrucao, setInstrucao] = useState("");

  useEffect(() => {
    if (appJaInstalado()) return;

    let ativo = true;
    function aoOferecer(e: Event) {
      // Sem o preventDefault o navegador mostra o próprio banner na hora.
      e.preventDefault();
      if (!ativo) return;
      setEvento(e as EventoInstalacao);
    }
    window.addEventListener("beforeinstallprompt", aoOferecer);

    void conviteDispensado().then((dispensado) => {
      if (!ativo || dispensado) return;
      setInstrucao(instrucaoInstalacao(detectarPlataforma(navigator.userAgent)));
      setVisivel(true);
    });

    return () => {
      ativo = false;
      window.removeEventListener("beforeinstallprompt", aoOferecer);
    };
  }, []);

  async function dispensar() {
    setVisivel(false);
    await dispensarConvite().catch(() => {
      // Sem IndexedDB o convite volta na próxima abertura — não é grave.
    });
  }

  async function instalar() {
    if (!evento) return;
    await evento.prompt();
    const escolha = await evento.userChoice;
    if (escolha.outcome === "accepted") {
      setVisivel(false);
      await dispensarConvite().catch(() => {});
    }
  }

  if (!visivel) return null;

  return (
    <Card className="rounded-2xl border-primary/30 bg-secondary/60">
      <CardContent className="flex items-start gap-3 p-4">
        <Smartphone className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-bold leading-snug">
            Instale o app na tela de início
          </p>
          <p className="text-xs text-muted-foreground">
            {evento
              ? "Abre em tela cheia e protege melhor as visitas guardadas no aparelho."
              : instrucao}
          </p>
          {evento ? (
            <Button
              onClick={instalar}
              className="h-11 w-full gap-2 rounded-xl text-sm font-bold"
            >
              <Download className="size-4" />
              Instalar agora
            </Button>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Dispensar convite de instalação"
          onClick={dispensar}
          className="-mr-1 -mt-1 flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      </CardContent>
    </Card>
  );
}
