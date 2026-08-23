import { Mail, MessageCircle, Phone } from "lucide-react";
import {
  CONTATO_PORTAL,
  CONTATO_QUEIXAS,
  linkTelefone,
  linkWhatsapp,
  type ContatoAjuda,
} from "@/lib/portal/contato";
import { cn } from "@/lib/utils";

/**
 * Rodapé de ajuda: "travei, e agora?" resolvido em qualquer tela do portal,
 * das telas de acesso e do canal de queixas — sem o produtor precisar
 * procurar telefone em outro lugar.
 *
 * Alvos de toque de 44px (dedo de quem trabalha na roça, celular ao sol) e
 * texto de 16px.
 */

type Props = {
  /**
   * "portal" = consultor da fazenda (dia a dia da certificação).
   * "queixas" = equipe de certificação, NUNCA o consultor da fazenda.
   */
  canal?: "portal" | "queixas";
  /** Escuro = fundo verde das telas de acesso e do canal de queixas. */
  tema?: "claro" | "escuro";
  className?: string;
};

export function RodapeAjuda({
  canal = "portal",
  tema = "claro",
  className,
}: Props) {
  const contato: ContatoAjuda =
    canal === "queixas" ? CONTATO_QUEIXAS : CONTATO_PORTAL;
  const escuro = tema === "escuro";

  const linha = cn(
    "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-base font-semibold transition-colors",
    escuro
      ? "text-white hover:bg-white/10"
      : "text-foreground hover:bg-secondary",
  );

  return (
    <section
      id={canal === "queixas" ? "ajuda-queixas" : "ajuda-portal"}
      aria-labelledby={`titulo-ajuda-${canal}`}
      className={cn(
        "rounded-2xl border p-4",
        escuro ? "border-white/20 bg-white/5" : "border-border bg-card",
        className,
      )}
    >
      <h2
        id={`titulo-ajuda-${canal}`}
        className={cn(
          "text-base font-extrabold",
          escuro ? "text-white" : "text-foreground",
        )}
      >
        {canal === "queixas"
          ? "Prefere falar com uma pessoa?"
          : "Precisa de ajuda? Fale com a gente"}
      </h2>
      <p
        className={cn(
          "mt-1 text-base leading-relaxed",
          escuro ? "text-white/80" : "text-muted-foreground",
        )}
      >
        <strong className={escuro ? "text-white" : "text-foreground"}>
          {contato.nome}
        </strong>{" "}
        — {contato.papel}.
      </p>

      <div className="mt-3 grid gap-1 sm:grid-cols-2">
        <a href={linkWhatsapp(contato.whatsapp)} className={linha}>
          <MessageCircle className="size-6 shrink-0" aria-hidden="true" />
          <span>
            WhatsApp
            <span
              className={cn(
                "block text-sm font-normal",
                escuro ? "text-white/70" : "text-muted-foreground",
              )}
            >
              {contato.whatsapp}
            </span>
          </span>
        </a>
        <a href={linkTelefone(contato.telefone)} className={linha}>
          <Phone className="size-6 shrink-0" aria-hidden="true" />
          <span>
            Telefone
            <span
              className={cn(
                "block text-sm font-normal",
                escuro ? "text-white/70" : "text-muted-foreground",
              )}
            >
              {contato.telefone}
            </span>
          </span>
        </a>
        <a href={`mailto:${contato.email}`} className={cn(linha, "sm:col-span-2")}>
          <Mail className="size-6 shrink-0" aria-hidden="true" />
          <span>
            E-mail
            <span
              className={cn(
                "block text-sm font-normal",
                escuro ? "text-white/70" : "text-muted-foreground",
              )}
            >
              {contato.email}
            </span>
          </span>
        </a>
      </div>

      {canal === "queixas" ? (
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          Este contato é da certificadora. Ele não é o consultor que atende a
          sua fazenda e não é ninguém da administração dela.
        </p>
      ) : null}
    </section>
  );
}
