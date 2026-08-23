import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ABAS_DOCS, carregarDoc, type AbaDocs } from "@/lib/docs";
import { cn } from "@/lib/utils";
import { RenderMermaid } from "./render-mermaid";

export const metadata: Metadata = {
  title: "Documentação",
};

export default async function PaginaDocs({
  searchParams,
}: PageProps<"/docs">) {
  const params = await searchParams;
  const abaAtiva: AbaDocs = params.aba === "tecnica" ? "tecnica" : "funcional";
  const html = await carregarDoc(abaAtiva);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/painel"
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar ao painel
        </Link>

        <nav className="flex gap-1 rounded-xl bg-muted p-1">
          {ABAS_DOCS.map((aba) => (
            <Link
              key={aba.id}
              href={`/docs?aba=${aba.id}`}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-semibold text-muted-foreground transition-colors",
                abaAtiva === aba.id &&
                  "bg-primary text-primary-foreground shadow-sm",
              )}
            >
              {aba.rotulo}
            </Link>
          ))}
        </nav>
      </div>

      <article
        className="prose prose-neutral max-w-none dark:prose-invert prose-headings:tracking-tight prose-a:text-primary prose-th:text-left"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <RenderMermaid />
    </div>
  );
}
