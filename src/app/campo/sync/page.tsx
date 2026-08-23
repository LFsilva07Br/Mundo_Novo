"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  PencilLine,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  listarVisitasLocais,
  obterUltimaSincronizacao,
} from "@/lib/campo/banco-local";
import { baixarPacote } from "@/lib/campo/pacote";
import { visitasNaFila } from "@/lib/campo/regras";
import { sincronizar } from "@/lib/campo/sincronizacao";
import type { ResultadoSyncVisita, VisitaLocal } from "@/lib/campo/tipos";

function formatarMomento(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/** Fila de envio: visitas do aparelho, sincronização e pacote de dados. */
export default function PaginaSincronizarCampo() {
  const [visitas, setVisitas] = useState<VisitaLocal[]>([]);
  const [ultima, setUltima] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [atualizandoPacote, setAtualizandoPacote] = useState(false);
  const [resultados, setResultados] = useState<ResultadoSyncVisita[]>([]);
  const [avisoPacote, setAvisoPacote] = useState<string | null>(null);

  const carregar = useCallback(
    () =>
      Promise.all([listarVisitasLocais(), obterUltimaSincronizacao()]).then(
        ([visitasLocais, ultimaSync]) => {
          setVisitas(visitasLocais);
          setUltima(ultimaSync);
          setCarregando(false);
        },
      ),
    [],
  );

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function sincronizarAgora() {
    setEnviando(true);
    setResultados([]);
    try {
      setResultados(await sincronizar());
      await carregar();
    } finally {
      setEnviando(false);
    }
  }

  async function atualizarPacote() {
    setAtualizandoPacote(true);
    setAvisoPacote(null);
    try {
      await baixarPacote();
      setAvisoPacote("Pacote de dados atualizado neste aparelho.");
    } catch (erro) {
      setAvisoPacote(
        erro instanceof Error ? erro.message : "Falha ao atualizar o pacote.",
      );
    } finally {
      setAtualizandoPacote(false);
    }
  }

  const fila = visitasNaFila(visitas);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Sincronizar</h1>
        <p className="text-sm text-muted-foreground">
          {ultima
            ? `Última sincronização em ${formatarMomento(ultima)}.`
            : "Nenhuma sincronização feita neste aparelho ainda."}
        </p>
      </div>

      <Button
        size="lg"
        className="h-12 w-full gap-2 rounded-xl text-base font-bold"
        onClick={sincronizarAgora}
        disabled={enviando || fila.length === 0}
      >
        <RefreshCw className={enviando ? "size-4 animate-spin" : "size-4"} />
        {enviando
          ? "Enviando…"
          : fila.length === 0
            ? "Nada aguardando envio"
            : `Sincronizar agora (${fila.length})`}
      </Button>

      {resultados.length > 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-extrabold">Resultado do envio</p>
            {resultados.map((resultado) => (
              <div
                key={resultado.idLocal}
                className="flex items-start gap-2 text-xs font-semibold"
              >
                {resultado.ok ? (
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                ) : (
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                )}
                <span>
                  {resultado.titulo}: {resultado.mensagem}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">
          Visitas no aparelho
        </h2>
        {carregando ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Abrindo a fila…
          </p>
        ) : visitas.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma visita registrada neste aparelho.
          </p>
        ) : (
          visitas.map((visita) => {
            const situacao = visita.sincronizadaEm
              ? {
                  texto: `Sincronizada em ${formatarMomento(visita.sincronizadaEm)}`,
                  classe: "text-success",
                  Icone: CheckCircle2,
                }
              : visita.concluidaEm
                ? visita.erroSincronizacao
                  ? {
                      texto: visita.erroSincronizacao,
                      classe: "text-destructive",
                      Icone: AlertTriangle,
                    }
                  : {
                      texto: "Aguardando envio",
                      classe: "text-warning",
                      Icone: Clock,
                    }
                : {
                    texto: "Em andamento — toque para continuar",
                    classe: "text-muted-foreground",
                    Icone: PencilLine,
                  };
            const cartao = (
              <Card className="rounded-2xl">
                <CardContent className="space-y-1 p-4">
                  <p className="text-sm font-bold leading-snug">{visita.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {visita.clienteNome} · iniciada em{" "}
                    {formatarMomento(visita.iniciadaEm)}
                  </p>
                  <p
                    className={`flex items-center gap-1.5 text-xs font-bold ${situacao.classe}`}
                  >
                    <situacao.Icone className="size-3.5" />
                    {situacao.texto}
                  </p>
                </CardContent>
              </Card>
            );
            return visita.concluidaEm ? (
              <div key={visita.idLocal}>{cartao}</div>
            ) : (
              <Link
                key={visita.idLocal}
                href={`/campo/visita/${visita.idLocal}`}
                className="block"
              >
                {cartao}
              </Link>
            );
          })
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">
          Pacote de dados
        </h2>
        <Button
          variant="outline"
          className="w-full gap-2 rounded-xl"
          onClick={atualizarPacote}
          disabled={atualizandoPacote}
        >
          <Download className="size-4" />
          {atualizandoPacote ? "Atualizando…" : "Atualizar pacote de dados"}
        </Button>
        {avisoPacote ? (
          <p className="text-center text-xs font-semibold text-muted-foreground">
            {avisoPacote}
          </p>
        ) : null}
      </section>
    </div>
  );
}
