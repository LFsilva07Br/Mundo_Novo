import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { existsSync } from "node:fs";
import path from "node:path";
import { ArrowLeft, Lightbulb } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TELAS_MANUAL } from "@/lib/manual";

export const metadata: Metadata = {
  title: "Manual do Usuário",
};

function temPrint(id: string): boolean {
  return existsSync(path.join(process.cwd(), "public", "manual", `${id}.png`));
}

export default function PaginaManual() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/painel"
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar ao painel
        </Link>
        <nav className="flex gap-2 text-sm font-semibold">
          {TELAS_MANUAL.map((tela) => (
            <a
              key={tela.id}
              href={`#${tela.id}`}
              className="rounded-lg bg-muted px-3 py-1.5 text-muted-foreground hover:text-foreground"
            >
              {tela.titulo}
            </a>
          ))}
        </nav>
      </div>

      <header className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Manual do Usuário
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Guia de uso do sistema, tela por tela, com imagens reais. Este manual
          é regenerado automaticamente a cada nova versão publicada — as
          imagens sempre refletem o sistema no ar.
        </p>
      </header>

      <div className="space-y-10">
        {TELAS_MANUAL.map((tela) => (
          <Card key={tela.id} id={tela.id} className="scroll-mt-6 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">{tela.titulo}</CardTitle>
              <CardDescription>{tela.resumo}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {temPrint(tela.id) ? (
                <Image
                  src={`/manual/${tela.id}.png`}
                  alt={`Tela: ${tela.titulo}`}
                  width={1280}
                  height={800}
                  className="w-full rounded-xl border shadow-sm"
                  unoptimized
                />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
                  Print gerado no próximo deploy
                </div>
              )}

              <div>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  Como usar
                </h3>
                <ol className="list-decimal space-y-1.5 pl-5 text-[15px]">
                  {tela.passos.map((passo) => (
                    <li key={passo}>{passo}</li>
                  ))}
                </ol>
              </div>

              {tela.dicas?.length ? (
                <div className="rounded-xl bg-accent/60 p-4">
                  <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-accent-foreground">
                    <Lightbulb className="size-4" />
                    Dicas
                  </h3>
                  <ul className="list-disc space-y-1 pl-5 text-[14px] text-accent-foreground/90">
                    {tela.dicas.map((dica) => (
                      <li key={dica}>{dica}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
