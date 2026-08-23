"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Formulário público do canal de queixas (RA 1.5.1).
 * Anonimato ligado por padrão; contato só aparece (e só é enviado) quando
 * a pessoa escolhe se identificar. Campo "site" é honeypot anti-robô.
 */
export function FormularioQueixa({ clienteId }: { clienteId: string }) {
  const [mensagem, setMensagem] = useState("");
  const [identificar, setIdentificar] = useState(false);
  const [contato, setContato] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmacao, setConfirmacao] = useState<string | null>(null);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const resposta = await fetch("/api/queixas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId,
          mensagem,
          anonima: !identificar,
          contato: identificar ? contato : undefined,
          site: honeypot,
        }),
      });
      const dados = (await resposta.json()) as {
        ok: boolean;
        mensagem?: string;
        erro?: string;
      };
      if (!resposta.ok || !dados.ok) {
        setErro(
          dados.erro ??
            "Não foi possível enviar agora. Tente novamente em instantes.",
        );
        return;
      }
      setConfirmacao(
        dados.mensagem ?? "Recebemos o seu relato. Obrigado pela confiança.",
      );
    } catch {
      setErro("Não foi possível enviar agora. Verifique a conexão e tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  if (confirmacao) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-white/20 bg-white/10 p-6 text-center"
      >
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-[#95D5B2]/20 text-2xl">
          💚
        </div>
        <h2 className="text-lg font-extrabold text-white">
          Relato recebido com segurança
        </h2>
        <p className="mt-2 text-sm text-white/85">{confirmacao}</p>
        <p className="mt-3 text-xs text-white/60">
          Se quiser contar mais alguma coisa, é só voltar aqui a qualquer
          momento — o canal fica sempre aberto.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={enviar}
      className="space-y-4 rounded-2xl border border-white/20 bg-white/10 p-5"
    >
      <div className="space-y-2">
        <Label htmlFor="queixa-mensagem" className="text-white">
          O que você quer contar?
        </Label>
        <textarea
          id="queixa-mensagem"
          required
          rows={5}
          value={mensagem}
          onChange={(evento) => setMensagem(evento.target.value)}
          placeholder="Escreva com suas palavras, do seu jeito. Quanto mais detalhes, melhor conseguimos ajudar."
          className="w-full rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/50 focus-visible:border-[#95D5B2] focus-visible:ring-3 focus-visible:ring-[#95D5B2]/30"
        />
      </div>

      {/* Honeypot: invisível para pessoas, preenchido só por robôs. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="queixa-site">Não preencha este campo</label>
        <input
          id="queixa-site"
          type="text"
          name="site"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(evento) => setHoneypot(evento.target.value)}
        />
      </div>

      <div className="rounded-xl border border-white/15 bg-white/5 p-3">
        <label className="flex items-start gap-2 text-sm font-medium text-white">
          <input
            type="checkbox"
            className="mt-0.5 size-4"
            checked={identificar}
            onChange={(evento) => setIdentificar(evento.target.checked)}
          />
          <span>
            Quero deixar um contato para retorno
            <span className="block text-xs font-normal text-white/65">
              Opcional. Sem marcar, o relato é 100% anônimo — ninguém saberá
              quem enviou.
            </span>
          </span>
        </label>

        {identificar ? (
          <div className="mt-3 space-y-2">
            <Label htmlFor="queixa-contato" className="text-white">
              Como podemos falar com você?
            </Label>
            <Input
              id="queixa-contato"
              value={contato}
              onChange={(evento) => setContato(evento.target.value)}
              placeholder="Nome, telefone ou e-mail"
              className="border-white/25 bg-white/10 text-white placeholder:text-white/50"
            />
          </div>
        ) : null}
      </div>

      {erro ? (
        <p
          role="alert"
          className="rounded-lg bg-red-500/15 p-2 text-sm font-medium text-red-200"
        >
          {erro}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={enviando}
        className="w-full bg-[#95D5B2] font-bold text-[#081C15] hover:bg-[#B7E4C7]"
      >
        {enviando ? "Enviando…" : "Enviar relato"}
      </Button>
    </form>
  );
}
