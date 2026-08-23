import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, CheckCircle2, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BadgeVencimento } from "@/components/badge-vencimento";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { obterCliente } from "@/lib/carteira/consultas";
import { ROTULO_NORMA } from "@/lib/carteira/tipos";
import { capasDoProdutor } from "@/lib/portal/consultas";
import { perfilPortal } from "@/lib/portal/sessao";
import { diasAte, statusVencimento } from "@/lib/vencimentos";

export const metadata: Metadata = {
  title: "Meu certificado",
};

/** Próximos passos em linguagem simples, a partir do vencimento e das pendências. */
function proximosPassos(
  venceEm: string | undefined,
  pendencias: number,
): string[] {
  const passos: string[] = [];

  if (venceEm) {
    const data = new Date(`${venceEm}T12:00:00`);
    const status = statusVencimento(data);
    if (status === "vencido") {
      passos.push(
        "Seu certificado está vencido. A equipe Mundo Novo já está cuidando da renovação — fique atento aos contatos do seu consultor.",
      );
    } else if (status !== "ok") {
      passos.push(
        `Seu certificado vence em ${diasAte(data)} dias. A equipe Mundo Novo acompanha a renovação com você — nada de susto.`,
      );
    }
  }

  if (pendencias > 0) {
    passos.push(
      pendencias === 1
        ? "Você tem 1 pendência para resolver na fazenda. Veja o que fazer na aba Pendências."
        : `Você tem ${pendencias} pendências para resolver na fazenda. Veja o que fazer na aba Pendências.`,
    );
  }

  if (passos.length === 0) {
    passos.push(
      "Tudo em dia por aqui! Continue guardando os registros da fazenda e recebendo as visitas do consultor.",
    );
  }
  return passos;
}

export default async function PaginaMeuCertificado() {
  const perfil = await perfilPortal();
  if (!perfil) redirect("/painel");

  const cliente = await obterCliente(perfil.clienteId);
  const capas = cliente ? await capasDoProdutor(cliente.nome) : [];
  const pendenciasAbertas = capas.filter((c) => c.status !== "fechada").length;
  const certificacaoPrincipal =
    cliente?.certificacoes.find((c) => c.principal) ?? cliente?.certificacoes[0];
  const passos = proximosPassos(
    certificacaoPrincipal?.venceEm,
    pendenciasAbertas,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Meu certificado
          </h2>
          <p className="mt-1 text-base text-muted-foreground">
            Aqui você acompanha a situação das certificações da sua fazenda.
          </p>
        </div>
        {typeof cliente?.conformidade === "number" ? (
          <div className="rounded-2xl bg-secondary px-5 py-3 text-center">
            <p className="text-2xl font-extrabold text-secondary-foreground">
              {cliente.conformidade}%
            </p>
            <p className="text-xs font-bold uppercase text-secondary-foreground/70">
              conformidade
            </p>
          </div>
        ) : null}
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="size-5 text-primary" />
            Próximos passos
          </CardTitle>
          <CardDescription className="text-sm">
            O que precisa da sua atenção agora, sem complicação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {passos.map((passo) => (
            <p
              key={passo}
              className="rounded-xl bg-secondary/60 p-4 text-base leading-relaxed"
            >
              {passo}
            </p>
          ))}
          {pendenciasAbertas > 0 ? (
            <Link
              href="/portal/pendencias"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-base font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <ClipboardList className="size-5" />
              Ver minhas pendências
            </Link>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
