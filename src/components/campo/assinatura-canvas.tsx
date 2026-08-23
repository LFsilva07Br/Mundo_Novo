"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Canvas de assinatura do produtor — desenho a dedo (touch) ou mouse.
 * A cada traço terminado, devolve o PNG (data URL) pelo onChange;
 * null enquanto estiver em branco.
 */
export function AssinaturaCanvas({
  onChange,
}: {
  onChange: (dataUrl: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const desenhandoRef = useRef(false);
  const [temTraco, setTemTraco] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Ajusta o buffer ao tamanho real do elemento (nitidez em telas densas).
    const escala = window.devicePixelRatio || 1;
    const retangulo = canvas.getBoundingClientRect();
    canvas.width = Math.round(retangulo.width * escala);
    canvas.height = Math.round(retangulo.height * escala);
    const contexto = canvas.getContext("2d");
    if (!contexto) return;
    contexto.scale(escala, escala);
    contexto.lineWidth = 2.5;
    contexto.lineCap = "round";
    contexto.lineJoin = "round";
    // Tinta da assinatura: cor de texto do tema (sem hex solto).
    contexto.strokeStyle =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--foreground")
        .trim() || "black";
  }, []);

  function posicao(evento: React.PointerEvent<HTMLCanvasElement>) {
    const retangulo = evento.currentTarget.getBoundingClientRect();
    return {
      x: evento.clientX - retangulo.left,
      y: evento.clientY - retangulo.top,
    };
  }

  function iniciar(evento: React.PointerEvent<HTMLCanvasElement>) {
    const contexto = canvasRef.current?.getContext("2d");
    if (!contexto) return;
    evento.currentTarget.setPointerCapture(evento.pointerId);
    desenhandoRef.current = true;
    const { x, y } = posicao(evento);
    contexto.beginPath();
    contexto.moveTo(x, y);
  }

  function desenhar(evento: React.PointerEvent<HTMLCanvasElement>) {
    if (!desenhandoRef.current) return;
    const contexto = canvasRef.current?.getContext("2d");
    if (!contexto) return;
    const { x, y } = posicao(evento);
    contexto.lineTo(x, y);
    contexto.stroke();
  }

  function terminar() {
    if (!desenhandoRef.current) return;
    desenhandoRef.current = false;
    setTemTraco(true);
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL("image/png"));
  }

  function limpar() {
    const canvas = canvasRef.current;
    const contexto = canvas?.getContext("2d");
    if (!canvas || !contexto) return;
    contexto.clearRect(0, 0, canvas.width, canvas.height);
    setTemTraco(false);
    onChange(null);
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        data-testid="canvas-assinatura"
        className="h-40 w-full touch-none rounded-2xl border-2 border-dashed border-border bg-card"
        onPointerDown={iniciar}
        onPointerMove={desenhar}
        onPointerUp={terminar}
        onPointerCancel={terminar}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {temTraco ? "Assinatura registrada." : "Assine no quadro acima."}
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={limpar}>
          <Eraser className="size-3.5" /> Limpar
        </Button>
      </div>
    </div>
  );
}
