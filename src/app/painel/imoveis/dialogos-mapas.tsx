"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { MapPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { enviarMapa, removerMapa, type EstadoMapa } from "@/lib/mapas/acoes";
import { cn } from "@/lib/utils";

/** Diálogo de envio de mapa (KML/GeoJSON) e botão de remoção por mapa. */

function MensagemMapa({ estado }: { estado: EstadoMapa }) {
  if (!estado) return null;
  return (
    <p
      role="alert"
      className={cn(
        "text-sm font-medium",
        estado.ok ? "text-primary" : "text-destructive",
      )}
    >
      {estado.mensagem}
    </p>
  );
}

export function FormularioMapa({
  imovelId,
  imovelNome,
  aoConcluir,
}: {
  imovelId: string;
  imovelNome: string;
  aoConcluir?: () => void;
}) {
  const idBase = useId();
  const [estado, despachar, pendente] = useActionState<EstadoMapa, FormData>(
    (_estadoAnterior, formData) => enviarMapa(imovelId, formData),
    null,
  );

  const anterior = useRef<EstadoMapa>(null);
  useEffect(() => {
    if (estado && estado !== anterior.current && estado.ok) aoConcluir?.();
    anterior.current = estado;
  }, [estado, aoConcluir]);

  return (
    <form action={despachar} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${idBase}-arquivo`}>
          Arquivo do mapa (.kml ou .geojson)
        </Label>
        <Input
          id={`${idBase}-arquivo`}
          name="arquivo"
          type="file"
          accept=".kml,.geojson,.json,application/vnd.google-earth.kml+xml,application/geo+json"
          required
        />
        <p className="text-xs text-muted-foreground">
          Até 5 MB. No site do CAR use &ldquo;Baixar demonstrativo&rdquo;; no
          Google Earth, &ldquo;Exportar como KML&rdquo;.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idBase}-nome`}>Nome do mapa</Label>
        <Input
          id={`${idBase}-nome`}
          name="nome"
          placeholder={`Talhões — ${imovelNome}`}
        />
      </div>

      <MensagemMapa estado={estado} />

      <Button type="submit" className="w-full" disabled={pendente}>
        {pendente ? "Enviando…" : "Enviar mapa"}
      </Button>
    </form>
  );
}

export function BotaoEnviarMapa({
  imovelId,
  imovelNome,
}: {
  imovelId: string;
  imovelNome: string;
}) {
  const [aberto, setAberto] = useState(false);
  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger
        render={<Button variant="outline" size="sm" />}
        aria-label={`Enviar mapa para ${imovelNome}`}
      >
        <MapPlus data-icon="inline-start" />
        Enviar mapa (KML/GeoJSON)
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mapa de {imovelNome}</DialogTitle>
          <DialogDescription>
            Envie o KML exportado do CAR ou do Google Earth com os talhões e
            limites do imóvel — ele vira o mapa da fazenda no painel.
          </DialogDescription>
        </DialogHeader>
        <FormularioMapa
          imovelId={imovelId}
          imovelNome={imovelNome}
          aoConcluir={() => setAberto(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function BotaoRemoverMapa({
  mapaId,
  nome,
}: {
  mapaId: string;
  nome: string;
}) {
  const [estado, despachar, pendente] = useActionState<EstadoMapa, FormData>(
    () => removerMapa(mapaId),
    null,
  );

  return (
    <form action={despachar} className="inline-flex items-center gap-2">
      <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        disabled={pendente}
        aria-label={`Remover mapa ${nome}`}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 />
      </Button>
      {estado && !estado.ok ? (
        <span role="alert" className="text-xs font-medium text-destructive">
          {estado.mensagem}
        </span>
      ) : null}
    </form>
  );
}
