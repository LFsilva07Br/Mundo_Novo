"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AlertTriangle, MapPin, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNativo } from "@/components/select-nativo";
import { gravarVisita } from "@/lib/campo/gravacao";
import { capturarGps } from "@/lib/campo/midia";
import { obterOuBaixarPacote } from "@/lib/campo/pacote";
import type { PacoteCampo } from "@/lib/campo/tipos";

/**
 * Nova visita: confirma o cliente, dá um título e captura o GPS inicial.
 * A visita nasce no IndexedDB — funciona 100% offline.
 */
export default function PaginaNovaVisita() {
  return (
    <Suspense
      fallback={
        <p className="py-10 text-center text-sm text-muted-foreground">
          Abrindo…
        </p>
      }
    >
      <FormularioNovaVisita />
    </Suspense>
  );
}

function tituloPadrao(): string {
  return `Visita de campo — ${new Date().toLocaleDateString("pt-BR")}`;
}

function FormularioNovaVisita() {
  const roteador = useRouter();
  const parametros = useSearchParams();
  const clientePreSelecionado = parametros.get("cliente") ?? "";

  const [pacote, setPacote] = useState<PacoteCampo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [clienteId, setClienteId] = useState(clientePreSelecionado);
  const [titulo, setTitulo] = useState(tituloPadrao);
  const [gps, setGps] = useState<string | null>(null);
  const [statusGps, setStatusGps] = useState<"buscando" | "ok" | "sem-gps">(
    "buscando",
  );
  const [iniciando, setIniciando] = useState(false);
  const [falhaGravacao, setFalhaGravacao] = useState<string | null>(null);

  useEffect(() => {
    void obterOuBaixarPacote().then((p) => {
      setPacote(p);
      setCarregando(false);
    });
    void capturarGps().then((posicao) => {
      setGps(posicao);
      setStatusGps(posicao ? "ok" : "sem-gps");
    });
  }, []);

  const cliente = pacote?.clientes.find((c) => c.id === clienteId) ?? null;
  const versaoPublicada = pacote?.checklist?.publicada ?? null;

  async function iniciarVisita() {
    if (!cliente) return;
    setIniciando(true);
    setFalhaGravacao(null);
    const idLocal = crypto.randomUUID();
    const gravou = await gravarVisita({
      idLocal,
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      titulo: titulo.trim() || tituloPadrao(),
      versaoChecklistId: versaoPublicada?.id ?? null,
      iniciadaEm: new Date().toISOString(),
      gpsInicio: gps,
      respostas: [],
      fotos: [],
      assinatura: null,
      concluidaEm: null,
      gpsFim: null,
      sincronizadaEm: null,
      erroSincronizacao: null,
    });
    if (!gravou.ok) {
      // Sem gravação a visita não existe: melhor barrar aqui do que deixar
      // o consultor preencher um checklist inteiro que não será salvo.
      setFalhaGravacao(gravou.mensagem);
      setIniciando(false);
      return;
    }
    roteador.push(`/campo/visita/${idLocal}`);
  }

  if (carregando) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Abrindo os dados do aparelho…
      </p>
    );
  }

  if (!pacote) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Sem pacote de dados no aparelho — baixe na tela Início antes de
        iniciar uma visita.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Nova visita</h1>
        <p className="text-sm text-muted-foreground">
          Confirme o cliente e o título — o checklist{" "}
          {versaoPublicada
            ? `(versão ${versaoPublicada.numero} publicada)`
            : "publicado"}{" "}
          já está no aparelho.
        </p>
      </div>

      <Card className="rounded-3xl">
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="cliente">Cliente</Label>
            <SelectNativo
              id="cliente"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="h-11 rounded-xl"
            >
              <option value="">Escolha o cliente…</option>
              {pacote.clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </SelectNativo>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="titulo">Título da visita</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-muted p-3 text-xs font-semibold">
            <MapPin className="size-4 shrink-0 text-primary" />
            {statusGps === "buscando"
              ? "Capturando posição GPS…"
              : statusGps === "ok"
                ? `GPS de início registrado (${gps})`
                : "Sem GPS — a visita segue sem a posição inicial."}
          </div>

          {!versaoPublicada ? (
            <p className="rounded-xl bg-warning/10 p-3 text-xs font-semibold text-warning">
              Nenhuma versão publicada do checklist no pacote — atualize o
              pacote de dados na tela Sincronizar.
            </p>
          ) : null}

          {falhaGravacao ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-destructive bg-destructive p-3 text-xs font-bold text-white"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {falhaGravacao}
            </p>
          ) : null}

          <Button
            size="lg"
            className="h-12 w-full gap-2 rounded-xl text-base font-bold"
            disabled={!cliente || !versaoPublicada || iniciando}
            onClick={iniciarVisita}
          >
            <Play className="size-4" />
            {iniciando ? "Criando visita…" : "Iniciar visita"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
