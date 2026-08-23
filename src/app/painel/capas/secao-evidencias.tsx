"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AlertTriangle, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GaleriaEvidencias } from "@/components/evidencias/galeria-evidencias";
import { concluirAcaoCapa } from "@/lib/certificacao/acoes";
import type { AcaoCapa } from "@/lib/certificacao/consultas";
import {
  enviarEvidenciaCapa,
  listarEvidenciasCapa,
  type EvidenciaCapa,
} from "@/lib/evidencias/acoes";
import {
  TAMANHO_MAXIMO_MB,
  TIPOS_DE_IMAGEM_PERMITIDOS,
  validarArquivoEvidencia,
} from "@/lib/evidencias/regras";

/**
 * Seção "Evidências" da área expandida de uma CAPA: miniaturas com URL
 * assinada e formulário de anexo vinculado à CAPA ou a uma ação do plano.
 * Ao anexar em uma ação, dá para marcá-la como concluída na mesma jogada.
 */

type Props = {
  capaId: string;
  acoes: AcaoCapa[];
  fechada: boolean;
  modoDemo: boolean;
};

export function SecaoEvidencias({ capaId, acoes, fechada, modoDemo }: Props) {
  const [evidencias, setEvidencias] = useState<EvidenciaCapa[]>([]);
  const [carregando, setCarregando] = useState(!modoDemo);
  const [erro, setErro] = useState<string | null>(null);
  const [acaoSelecionada, setAcaoSelecionada] = useState("");
  const [marcarConcluida, setMarcarConcluida] = useState(false);
  const [enviando, iniciarTransicao] = useTransition();
  const formularioRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (modoDemo) return;
    let ativo = true;
    listarEvidenciasCapa(capaId)
      .then((itens) => {
        if (ativo) setEvidencias(itens);
      })
      .catch(() => {
        if (ativo) setErro("Não foi possível carregar as evidências.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [capaId, modoDemo]);

  const acaoAlvo = acoes.find((a) => a.id === acaoSelecionada) ?? null;

  function anexar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    const dados = new FormData(evento.currentTarget);
    const arquivo = dados.get("arquivo");
    if (!(arquivo instanceof File) || arquivo.size === 0) {
      setErro("Escolha uma foto para anexar.");
      return;
    }
    const validacao = validarArquivoEvidencia(arquivo);
    if (!validacao.ok) {
      setErro(validacao.erro);
      return;
    }

    const descricao = String(dados.get("descricao") ?? "").trim();
    const acaoId = acaoSelecionada || null;
    const concluirJunto = marcarConcluida && acaoAlvo !== null && !acaoAlvo.concluida;

    iniciarTransicao(async () => {
      const envio = new FormData();
      envio.append("arquivo", arquivo);
      const resultado = await enviarEvidenciaCapa(
        capaId,
        acaoId,
        envio,
        descricao || undefined,
      );
      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }
      if (concluirJunto && acaoId) {
        const conclusao = await concluirAcaoCapa(acaoId, true);
        if (!conclusao.ok) {
          setErro(`Evidência anexada, mas a ação não foi concluída: ${conclusao.erro}`);
        }
      }
      formularioRef.current?.reset();
      setAcaoSelecionada("");
      setMarcarConcluida(false);
      setEvidencias(await listarEvidenciasCapa(capaId));
    });
  }

  return (
    <div className="space-y-2 border-t pt-3">
      <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
        <Paperclip className="size-3.5" aria-hidden />
        Evidências
        {evidencias.length > 0 ? ` · ${evidencias.length}` : null}
      </p>

      {erro ? (
        <p className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2 text-xs font-semibold text-destructive">
          <AlertTriangle className="size-3.5 shrink-0" />
          {erro}
        </p>
      ) : null}

      {modoDemo ? (
        <p className="text-xs font-semibold text-muted-foreground">
          Modo demonstração — conecte o Supabase para anexar e ver evidências.
        </p>
      ) : carregando ? (
        <p className="text-xs text-muted-foreground">Carregando evidências…</p>
      ) : (
        <GaleriaEvidencias
          itens={evidencias.map((evidencia) => ({
            id: evidencia.id,
            url: evidencia.url,
            descricao: evidencia.descricao,
            data: evidencia.criadoEm,
          }))}
          vazio="Nenhuma evidência anexada a esta CAPA ainda."
        />
      )}

      {!modoDemo && !fechada ? (
        <form
          ref={formularioRef}
          onSubmit={anexar}
          className="grid gap-2 rounded-xl border border-dashed p-3 sm:grid-cols-2"
        >
          <div className="space-y-1">
            <Label htmlFor={`evidencia-arquivo-${capaId}`} className="text-xs">
              Foto da evidência
            </Label>
            <input
              id={`evidencia-arquivo-${capaId}`}
              name="arquivo"
              type="file"
              accept={TIPOS_DE_IMAGEM_PERMITIDOS.join(",")}
              disabled={enviando}
              className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-secondary-foreground hover:file:bg-secondary/80"
            />
            <p className="text-[11px] text-muted-foreground">
              JPEG, PNG ou WebP, até {TAMANHO_MAXIMO_MB} MB.
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`evidencia-descricao-${capaId}`} className="text-xs">
              Descrição (opcional)
            </Label>
            <Input
              id={`evidencia-descricao-${capaId}`}
              name="descricao"
              maxLength={500}
              placeholder="O que a foto comprova?"
              disabled={enviando}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`evidencia-acao-${capaId}`} className="text-xs">
              Vincular a
            </Label>
            <select
              id={`evidencia-acao-${capaId}`}
              value={acaoSelecionada}
              disabled={enviando}
              onChange={(e) => {
                setAcaoSelecionada(e.target.value);
                setMarcarConcluida(false);
              }}
              className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs outline-none"
            >
              <option value="">CAPA como um todo</option>
              {acoes.map((acao) => (
                <option key={acao.id} value={acao.id}>
                  Ação {acao.ordem} — {acao.descricao}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end justify-between gap-2">
            {acaoAlvo && !acaoAlvo.concluida ? (
              <label className="flex items-center gap-1.5 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={marcarConcluida}
                  disabled={enviando}
                  onChange={(e) => setMarcarConcluida(e.target.checked)}
                  className="size-3.5 accent-primary"
                />
                Marcar a ação como concluída
              </label>
            ) : (
              <span />
            )}
            <Button type="submit" size="sm" disabled={enviando}>
              {enviando ? "Enviando…" : "Anexar evidência"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
