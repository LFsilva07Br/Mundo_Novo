"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatarProtocolo, normalizarProtocolo } from "@/lib/portal/protocolo";

/**
 * Consulta anônima da situação de um relato pelo código de protocolo.
 * Não pede nome, telefone nem e-mail — só o código anotado no papel.
 */

type Consulta = {
  protocolo: string;
  rotulo: string;
  explicacao: string;
  recebidoEm: string | null;
};

export function FormularioAcompanhar() {
  const [codigo, setCodigo] = useState("");
  const [consultando, setConsultando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [consulta, setConsulta] = useState<Consulta | null>(null);

  const valido = normalizarProtocolo(codigo) !== null;

  async function consultar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setConsulta(null);
    if (!valido) {
      setErro(
        "O código tem 8 letras e números, como K7QM-3XZ2. Confira o que você anotou.",
      );
      return;
    }
    setConsultando(true);
    try {
      const resposta = await fetch(
        `/api/queixas?protocolo=${encodeURIComponent(codigo)}`,
      );
      const dados = (await resposta.json()) as {
        ok: boolean;
        consulta?: Consulta;
        erro?: string;
      };
      if (!resposta.ok || !dados.ok || !dados.consulta) {
        setErro(dados.erro ?? "Não foi possível consultar agora.");
        return;
      }
      setConsulta(dados.consulta);
    } catch {
      setErro("Não foi possível consultar agora. Verifique a conexão.");
    } finally {
      setConsultando(false);
    }
  }

  function sairELimpar() {
    setCodigo("");
    setConsulta(null);
    window.location.replace("/");
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={consultar}
        className="space-y-4 rounded-2xl border border-white/20 bg-white/10 p-5"
      >
        <div className="space-y-2">
          <Label htmlFor="protocolo" className="text-base text-white">
            Código do seu relato
          </Label>
          <input
            id="protocolo"
            name="protocolo"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={12}
            value={codigo}
            onChange={(evento) => setCodigo(evento.target.value.toUpperCase())}
            placeholder="K7QM-3XZ2"
            className="h-12 w-full rounded-lg border border-white/25 bg-white/10 px-3 font-mono text-xl tracking-widest text-white outline-none transition-colors placeholder:text-white/40 focus-visible:border-[#95D5B2] focus-visible:ring-3 focus-visible:ring-[#95D5B2]/30"
          />
          <p className="text-base leading-relaxed text-white/70">
            São as 8 letras e números que apareceram quando você enviou o
            relato. Pode digitar com ou sem o traço.
          </p>
        </div>

        {erro ? (
          <p
            role="alert"
            className="rounded-lg bg-red-500/15 p-3 text-base font-medium text-red-200"
          >
            {erro}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={consultando}
          className="h-12 w-full bg-[#95D5B2] text-base font-bold text-[#081C15] hover:bg-[#B7E4C7]"
        >
          {consultando ? "Consultando…" : "Ver a situação do meu relato"}
        </Button>
      </form>

      {consulta ? (
        <div
          role="status"
          className="rounded-2xl border border-[#95D5B2]/40 bg-[#95D5B2]/10 p-5 text-white"
        >
          <p className="text-base text-white/70">
            Relato {formatarProtocolo(consulta.protocolo)}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-[#95D5B2]">
            {consulta.rotulo}
          </p>
          <p className="mt-2 text-base leading-relaxed text-white/85">
            {consulta.explicacao}
          </p>
          <button
            type="button"
            onClick={sairELimpar}
            className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-white/90 px-4 text-base font-extrabold text-[#081C15] transition-colors hover:bg-white"
          >
            Sair e limpar
          </button>
        </div>
      ) : null}
    </div>
  );
}
