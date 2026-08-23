"use client";

import { useState } from "react";
import { Camera, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatarData } from "@/lib/vencimentos";

/**
 * Galeria simples de evidências fotográficas: miniaturas em grade e, ao
 * clicar, um diálogo com a imagem maior + metadados (data, GPS, descrição).
 * As URLs chegam assinadas do servidor — o bucket é privado.
 */

export type EvidenciaExibicao = {
  id: string;
  /** URL assinada; null quando a assinatura falhou (mostra reserva). */
  url: string | null;
  descricao?: string | null;
  gps?: string | null;
  /** ISO — momento em que a foto foi tirada/anexada. */
  data?: string | null;
};

type Props = {
  itens: EvidenciaExibicao[];
  /** Texto exibido quando não há evidências. */
  vazio?: string;
};

export function GaleriaEvidencias({ itens, vazio }: Props) {
  const [selecionada, setSelecionada] = useState<EvidenciaExibicao | null>(null);

  if (itens.length === 0) {
    return vazio ? (
      <p className="text-xs text-muted-foreground">{vazio}</p>
    ) : null;
  }

  return (
    <>
      <ul className="flex flex-wrap gap-2">
        {itens.map((item, indice) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setSelecionada(item)}
              aria-label={`Ver evidência ${indice + 1}${item.descricao ? ` — ${item.descricao}` : ""}`}
              className="block size-16 overflow-hidden rounded-lg border bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {item.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL assinada temporária; next/image não otimiza bucket privado.
                <img
                  src={item.url}
                  alt={item.descricao ?? `Evidência ${indice + 1}`}
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-muted-foreground">
                  <Camera className="size-5" aria-hidden />
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <Dialog
        open={selecionada !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setSelecionada(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Evidência fotográfica</DialogTitle>
            <DialogDescription>
              {selecionada?.descricao ?? "Sem descrição registrada."}
            </DialogDescription>
          </DialogHeader>
          {selecionada ? (
            <div className="space-y-3">
              {selecionada.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL assinada temporária; next/image não otimiza bucket privado.
                <img
                  src={selecionada.url}
                  alt={selecionada.descricao ?? "Evidência fotográfica"}
                  className="max-h-[60vh] w-full rounded-lg border object-contain"
                />
              ) : (
                <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                  Não foi possível carregar a imagem — recarregue a página para
                  gerar um novo link.
                </p>
              )}
              <div className="space-y-1 text-xs text-muted-foreground">
                {selecionada.data ? (
                  <p>
                    <span className="font-bold">Data:</span>{" "}
                    {formatarData(new Date(selecionada.data))}
                  </p>
                ) : null}
                {selecionada.gps ? (
                  <p className="flex items-center gap-1">
                    <MapPin className="size-3.5 shrink-0" aria-hidden />
                    <span className="font-bold">GPS:</span> {selecionada.gps}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
