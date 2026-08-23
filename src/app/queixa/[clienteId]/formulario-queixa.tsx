"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Formulário público do canal de queixas (RA 1.5.1).
 *
 * Tudo aqui é desenhado para uma pessoa com medo de perder o emprego:
 * o bloco de confiança vem ANTES do campo de texto, o anonimato é o padrão
 * e está escrito o que acontece agora, e a confirmação entrega um protocolo
 * curto para acompanhar sem dar nome. Campo "site" é honeypot anti-robô.
 */

type Resposta = {
  ok: boolean;
  mensagem?: string;
  erro?: string;
  protocolo?: string;
  prazoDias?: number;
};

export function FormularioQueixa({ clienteId }: { clienteId: string }) {
  const [mensagem, setMensagem] = useState("");
  const [anonimo, setAnonimo] = useState(true);
  const [contato, setContato] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmacao, setConfirmacao] = useState<Resposta | null>(null);

  // Ao confirmar, apagamos o endereço do canal da barra e do histórico:
  // se outra pessoa pegar o celular, o "voltar" não entrega o que houve.
  useEffect(() => {
    if (!confirmacao) return;
    try {
      window.history.replaceState(null, "", "/");
    } catch {
      // navegador sem history API — a confirmação continua funcionando
    }
  }, [confirmacao]);

  function sairELimpar() {
    setMensagem("");
    setContato("");
    // replace (e não href) para não deixar o canal no histórico do celular.
    window.location.replace("/");
  }

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
          anonima: anonimo,
          contato: anonimo ? undefined : contato,
          site: honeypot,
        }),
      });
      const dados = (await resposta.json()) as Resposta;
      if (!resposta.ok || !dados.ok) {
        setErro(
          dados.erro ??
            "Não foi possível enviar agora. Tente novamente em instantes.",
        );
        return;
      }
      setConfirmacao(dados);
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
        <h2 className="text-xl font-extrabold text-white">
          Relato recebido com segurança
        </h2>
        <p className="mt-2 text-base text-white/85">
          {confirmacao.mensagem ??
            "Recebemos o seu relato. Obrigado pela confiança."}
        </p>

        {confirmacao.protocolo ? (
          <div className="mt-5 rounded-xl border border-[#95D5B2]/40 bg-[#95D5B2]/10 p-4">
            <p className="text-base font-bold text-white">
              Anote este código em um papel:
            </p>
            <p
              data-testid="protocolo"
              className="mt-2 font-mono text-3xl font-extrabold tracking-widest text-[#95D5B2]"
            >
              {confirmacao.protocolo}
            </p>
            <p className="mt-3 text-base leading-relaxed text-white/85">
              Com ele você pode perguntar depois no que deu, sem precisar dizer
              seu nome. A equipe de certificação responde{" "}
              <strong className="text-white">
                em até {confirmacao.prazoDias ?? 10} dias
              </strong>
              .
            </p>
            <p className="mt-2 text-sm text-white/70">
              O código não tem nada seu — nome, telefone, nada. Só serve para
              consultar a situação do relato.
            </p>
            <Link
              href="/queixa/acompanhar"
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/30 px-4 text-base font-bold text-white transition-colors hover:bg-white/10"
            >
              Acompanhar com esse código
            </Link>
          </div>
        ) : null}

        <div className="mt-5 rounded-xl border border-white/20 bg-white/5 p-4 text-left">
          <p className="text-base font-bold text-white">
            Está usando um celular emprestado?
          </p>
          <p className="mt-1 text-base leading-relaxed text-white/80">
            Toque no botão abaixo antes de devolver. Ele limpa o que você
            escreveu e tira esta página da tela e do histórico.
          </p>
          <button
            type="button"
            onClick={sairELimpar}
            className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl bg-white/90 px-4 text-base font-extrabold text-[#081C15] transition-colors hover:bg-white"
          >
            Sair e limpar
          </button>
        </div>

        <p className="mt-4 text-sm text-white/60">
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
      {/* Bloco de confiança: vem ANTES do campo de texto de propósito —
          é a dúvida que trava a pessoa antes de começar a escrever. */}
      <section
        aria-labelledby="promessa-canal"
        className="rounded-xl border border-[#95D5B2]/40 bg-[#95D5B2]/10 p-4 text-base leading-relaxed text-white"
      >
        <p id="promessa-canal" className="text-lg font-extrabold text-white">
          Ninguém da fazenda vai saber que foi você.
        </p>
        <p className="mt-2 text-base leading-relaxed text-white/90">
          Seu relato vai direto para a equipe de certificação Mundo Novo — não
          passa pelo seu patrão, gerente ou encarregado. Você não precisa dizer
          seu nome.
        </p>
        <p className="mt-2 text-base leading-relaxed text-white/90">
          <strong className="font-extrabold text-white">
            É proibido punir quem fala.
          </strong>{" "}
          Se alguém te ameaçar por causa disso, conte aqui também.
        </p>
      </section>

      <div className="space-y-2">
        <Label htmlFor="queixa-mensagem" className="text-base text-white">
          O que você quer contar?
        </Label>
        <textarea
          id="queixa-mensagem"
          required
          rows={6}
          value={mensagem}
          onChange={(evento) => setMensagem(evento.target.value)}
          placeholder="Escreva com suas palavras, do seu jeito. Quanto mais detalhes, melhor conseguimos ajudar."
          className="w-full rounded-lg border border-white/25 bg-white/10 px-3 py-3 text-base text-white outline-none transition-colors placeholder:text-white/50 focus-visible:border-[#95D5B2] focus-visible:ring-3 focus-visible:ring-[#95D5B2]/30"
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

      <div className="rounded-xl border border-white/15 bg-white/5 p-4">
        <label
          htmlFor="queixa-anonimo"
          className="flex min-h-11 items-start gap-3 text-base font-bold text-white"
        >
          <input
            id="queixa-anonimo"
            type="checkbox"
            className="mt-0.5 size-6 shrink-0 accent-[#95D5B2]"
            checked={anonimo}
            onChange={(evento) => setAnonimo(evento.target.checked)}
          />
          <span>Quero enviar sem dizer quem eu sou</span>
        </label>

        {/* Confirmação textual do estado: a pessoa lê o que vale AGORA,
            em vez de ter que deduzir do quadradinho marcado. */}
        <p
          role="status"
          className="mt-2 rounded-lg bg-black/20 p-3 text-base leading-relaxed text-white/90"
        >
          {anonimo ? (
            <>
              <strong className="text-white">
                Agora está anônimo: você não vai deixar nome nem telefone.
              </strong>{" "}
              Nem a equipe de certificação vai saber quem enviou. Você pode
              acompanhar o relato pelo código que aparece no fim.
            </>
          ) : (
            <>
              <strong className="text-white">
                Agora NÃO está anônimo: você vai deixar um contato.
              </strong>{" "}
              Só a equipe de certificação vê esse contato — a fazenda não. Para
              voltar ao anônimo, marque o quadrado de novo.
            </>
          )}
        </p>

        {!anonimo ? (
          <div className="mt-3 space-y-2">
            <Label htmlFor="queixa-contato" className="text-base text-white">
              Como podemos falar com você?
            </Label>
            <Input
              id="queixa-contato"
              value={contato}
              onChange={(evento) => setContato(evento.target.value)}
              placeholder="Nome, telefone ou e-mail"
              className="h-11 border-white/25 bg-white/10 text-base text-white placeholder:text-white/50 md:text-base"
            />
          </div>
        ) : null}
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
        disabled={enviando}
        className="h-12 w-full bg-[#95D5B2] text-base font-bold text-[#081C15] hover:bg-[#B7E4C7]"
      >
        {enviando ? "Enviando…" : "Enviar relato"}
      </Button>
    </form>
  );
}
