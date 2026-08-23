import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Download, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { perfilPortal } from "@/lib/portal/sessao";

export const metadata: Metadata = {
  title: "Relatórios",
};

/**
 * Relatórios do produtor: os PDFs são gerados pelas mesmas rotas do painel,
 * que usam o client de cookies — com o banco conectado, o RLS garante que o
 * produtor só consegue gerar relatórios com os dados do próprio cliente.
 */
export default async function PaginaRelatorios() {
  const perfil = await perfilPortal();
  if (!perfil) redirect("/painel");

  const relatorios = [
    {
      titulo: "Relatório mensal",
      descricao:
        "O resumo que a consultoria prepara para você: certificações, áreas, safra, pendências e treinamentos.",
      href: `/api/relatorios/mensal?formato=pdf&cliente=${perfil.clienteId}`,
    },
    {
      titulo: "Estimativa de safra",
      descricao:
        "Talhão por talhão: área, variedade, previsão desta safra e comparação com a colheita passada.",
      href: `/api/relatorios/safra?formato=pdf&cliente=${perfil.clienteId}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Relatórios</h2>
        <p className="mt-1 text-base text-muted-foreground">
          Baixe em PDF os relatórios da sua fazenda para guardar ou imprimir.
        </p>
      </div>

      {relatorios.map((relatorio) => (
        <Card key={relatorio.href}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="size-5 text-primary" />
              {relatorio.titulo}
            </CardTitle>
            <CardDescription className="text-sm">
              {relatorio.descricao}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href={relatorio.href}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-base font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Download className="size-5" />
              Baixar PDF
            </a>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
