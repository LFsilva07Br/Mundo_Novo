import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BadgeVencimento } from "@/components/badge-vencimento";
import { Card, CardContent } from "@/components/ui/card";
import { obterCliente } from "@/lib/carteira/consultas";
import { ROTULO_NORMA } from "@/lib/carteira/tipos";
import { capasDoProdutor } from "@/lib/portal/consultas";
import { perfilPortal } from "@/lib/portal/sessao";
import { situacaoDaFazenda } from "@/lib/portal/traducao";
import { diasAte, statusVencimento } from "@/lib/vencimentos";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Meu certificado",
};

const TOM_FAIXA = {
  ok: "border-primary/30 bg-primary/10",
  atencao: "border-warning/40 bg-warning/10",
  problema: "border-destructive/40 bg-destructive/10",
} as const;

const TOM_BOTAO = {
  ok: "bg-primary text-primary-foreground",
  atencao: "bg-warning text-white",
  problema: "bg-destructive text-white",
} as const;

export default async function PaginaMeuCertificado() {
  const perfil = await perfilPortal();
  if (!perfil) redirect("/painel");

  const cliente = await obterCliente(perfil.clienteId);
  const capas = cliente ? await capasDoProdutor(cliente.nome) : [];
  const pendenciasAbertas = capas.filter((c) => c.status !== "fechada").length;
  const certificacaoPrincipal =
    cliente?.certificacoes.find((c) => c.principal) ?? cliente?.certificacoes[0];

  const vencimento = certificacaoPrincipal?.venceEm
    ? new Date(`${certificacaoPrincipal.venceEm}T12:00:00`)
    : null;

  // Uma resposta só para "está tudo certo?". Antes o topo mostrava
  // "88% CONFORMIDADE" ao lado de "Vencido" — dois recados opostos.
  const situacao = situacaoDaFazenda({
    conformidade: cliente?.conformidade,
    certificadoVencido: vencimento
      ? statusVencimento(vencimento) === "vencido"
      : false,
    diasParaVencer: vencimento ? diasAte(vencimento) : null,
    pendenciasAbertas,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">
          Meu certificado
        </h2>
        <p className="mt-1 text-base text-muted-foreground">
          Aqui você acompanha a situação das certificações da sua fazenda.
        </p>
      </div>

      <section
        aria-labelledby="faixa-situacao"
        className={cn("rounded-2xl border p-5 sm:p-6", TOM_FAIXA[situacao.tom])}
      >
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Está tudo certo com a minha fazenda?
        </p>
        <h3
          id="faixa-situacao"
          className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl"
        >
          {situacao.titulo}
        </h3>
        <p className="mt-2 text-base leading-relaxed">{situacao.explicacao}</p>
        {situacao.conformidadeEmPalavras ? (
          <p className="mt-3 rounded-xl bg-background/60 p-3 text-base font-semibold">
            {situacao.conformidadeEmPalavras}
          </p>
        ) : null}
        <Link
          href={situacao.acao.href}
          className={cn(
            "mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-base font-bold transition-opacity hover:opacity-90",
            TOM_BOTAO[situacao.tom],
          )}
        >
          {situacao.acao.rotulo}
          <ArrowRight className="size-5" />
        </Link>
      </section>

      {cliente?.certificacoes.length ? (
        <div className="space-y-4">
          {cliente.certificacoes.map((cert) => (
            <Card key={cert.norma}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Award className="size-6" />
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-lg font-extrabold">
                      {ROTULO_NORMA[cert.norma]}
                      {cert.principal ? (
                        <Badge variant="secondary">Principal</Badge>
                      ) : null}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {cert.certificadora ?? "Certificadora a definir"}
                      {cert.status === "em_implantacao"
                        ? " · em implantação"
                        : null}
                    </p>
                  </div>
                </div>
                <BadgeVencimento venceEm={cert.venceEm} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border p-6 text-base text-muted-foreground">
          As certificações da sua fazenda aparecerão aqui assim que forem
          cadastradas pela equipe.
        </p>
      )}

      {pendenciasAbertas === 0 ? (
        <p className="flex items-start gap-2.5 rounded-2xl border p-5 text-base leading-relaxed text-muted-foreground">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
          Nenhuma pendência aberta. Continue guardando os registros da fazenda
          e recebendo as visitas do consultor.
        </p>
      ) : null}
    </div>
  );
}
