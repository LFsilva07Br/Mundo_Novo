"use client";

import { useRef, useState, useTransition } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNativo } from "@/components/select-nativo";
import type { AcaoCapa } from "@/lib/certificacao/consultas";
import {
  TAMANHO_MAXIMO_MB,
  TIPOS_DE_IMAGEM_PERMITIDOS,
  validarArquivoEvidencia,
} from "@/lib/evidencias/regras";
import { enviarEvidenciaProdutor } from "@/lib/portal/acoes";

/**
 * Formulário do produtor para anexar a foto de evidência a uma pendência:
 * escolhe a ação (opcional), tira/escolhe a foto e envia para verificação.
 * A conferência e a conclusão da ação continuam com o consultor.
 */

type Props = {
  capaId: string;
  acoes: AcaoCapa[];
  modoDemo: boolean;
};

export function FormularioEvidenciaProdutor({ capaId, acoes, modoDemo }: Props) {
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, iniciarTransicao] = useTransition();
  const formularioRef = useRef<HTMLFormElement>(null);
  const pendentes = acoes.filter((acao) => !acao.concluida);

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    if (modoDemo) {
      setErro("O envio de fotos estará disponível no ambiente publicado.");
      return;
    }

    const dados = new FormData(evento.currentTarget);
    const arquivo = dados.get("arquivo");
    if (!(arquivo instanceof File) || arquivo.size === 0) {
      setErro("Escolha uma foto para enviar.");
      return;
    }
    const validacao = validarArquivoEvidencia(arquivo);
    if (!validacao.ok) {
      setErro(validacao.erro);
      return;
    }

    const acaoId = String(dados.get("acao") ?? "") || null;
    const descricao = String(dados.get("descricao") ?? "").trim();

    iniciarTransicao(async () => {
      const envio = new FormData();
      envio.append("arquivo", arquivo);
      const resultado = await enviarEvidenciaProdutor(
        capaId,
        acaoId,
        envio,
        descricao || undefined,
      );
      if (resultado.ok) {
        toast.success(resultado.mensagem);
        formularioRef.current?.reset();
      } else {
        setErro(resultado.erro);
      }
    });
  }

  return (
    <form
      ref={formularioRef}
      onSubmit={enviar}
      className="space-y-3 rounded-xl bg-secondary/50 p-4"
    >
      <p className="text-base font-bold">Enviar foto do que já foi feito</p>

      {pendentes.length > 0 ? (
        <div className="space-y-1.5">
          <Label htmlFor={`acao-${capaId}`} className="text-sm">
            Qual ação essa foto comprova? (opcional)
          </Label>
          <SelectNativo id={`acao-${capaId}`} name="acao" defaultValue="">
            <option value="">Pendência em geral</option>
            {pendentes.map((acao) => (
              <option key={acao.id} value={acao.id}>
                {acao.ordem}. {acao.descricao}
              </option>
            ))}
          </SelectNativo>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor={`arquivo-${capaId}`} className="text-sm">
          Foto (JPEG, PNG ou WebP · até {TAMANHO_MAXIMO_MB} MB)
        </Label>
        <Input
          id={`arquivo-${capaId}`}
          name="arquivo"
          type="file"
          accept={TIPOS_DE_IMAGEM_PERMITIDOS.join(",")}
          capture="environment"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`descricao-${capaId}`} className="text-sm">
          Alguma observação? (opcional)
        </Label>
        <Input
          id={`descricao-${capaId}`}
          name="descricao"
          maxLength={500}
          placeholder="Ex.: placa instalada na porta do depósito"
        />
      </div>

      {erro ? (
        <p role="alert" className="text-sm font-semibold text-destructive">
          {erro}
        </p>
      ) : null}

      <Button type="submit" disabled={enviando} className="gap-2 text-base">
        <Camera className="size-5" />
        {enviando ? "Enviando…" : "Enviar para verificação"}
      </Button>
      <p className="text-sm text-muted-foreground">
        Depois do envio, o consultor confere a foto e conclui a ação para você.
      </p>
    </form>
  );
}
