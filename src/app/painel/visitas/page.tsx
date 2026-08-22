import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Visitas & Ações",
};

type RegistroTrabalho = {
  data: string;
  titulo: string;
  cliente: string;
  responsavel: string;
  origem: "Campo" | "Escritório";
  detalhe: string;
};

const REGISTROS_DEMO: RegistroTrabalho[] = [
  {
    data: "22 ago 2026 · 10:30",
    titulo: "Auditoria interna RA 1.4",
    cliente: "Fazenda Alto da Serra",
    responsavel: "Carlos Mendes",
    origem: "Campo",
    detalhe:
      "Checklist de 10 itens · 1 NC registrada (depósito de defensivos) · CAPA #131 criado automaticamente",
  },
  {
    data: "21 ago 2026 · 14:00",
    titulo: "Auditoria documental — registros de aplicação",
    cliente: "Fazenda Chapadão de Ferro",
    responsavel: "Raiane Gomes Borges",
    origem: "Escritório",
    detalhe:
      "Conferência dos registros do último ciclo · pendência aberta como CAPA #129",
  },
  {
    data: "20 ago 2026 · 09:00",
    titulo: "Verificação de evidência — CAPA #127",
    cliente: "Fazenda Lambari",
    responsavel: "Adriano Carvalho",
    origem: "Escritório",
    detalhe: "Evidência fotográfica aprovada · CAPA fechada e verificada",
  },
  {
    data: "19 ago 2026 · 13:30",
    titulo: "Checklist ambiental trimestral",
    cliente: "Fazendas Guatambu",
    responsavel: "Winicius Baquião Dutra",
    origem: "Campo",
    detalhe: "28 itens · sem novas NCs · relatório disponível ao grupo Expocaccer",
  },
];

export default function PaginaVisitas() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Trabalho realizado
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Visitas & Ações
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          O sistema registra as visitas de campo <b>e</b> as ações do
          escritório (auditorias documentais, verificações) — para demonstrar
          ao cliente todo o volume de trabalho da consultoria.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registros recentes</CardTitle>
          <CardDescription>
            No app de campo, cada checklist grava automaticamente o horário e a
            localização (GPS) de início e fim — permitindo acompanhar o tempo
            gasto por tarefa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {REGISTROS_DEMO.map((r) => (
            <div key={`${r.data}-${r.titulo}`} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{r.titulo}</p>
                <Badge
                  variant={r.origem === "Campo" ? "secondary" : "outline"}
                >
                  {r.origem === "Campo" ? "🌱 Campo" : "🏢 Escritório"}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {r.cliente} · {r.responsavel} · {r.data}
              </p>
              <p className="mt-1.5 text-sm">{r.detalhe}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Com o app de campo (Fase 4), as visitas serão registradas offline na
        fazenda e sincronizadas automaticamente, com fotos, assinatura do
        produtor e escopo de talhões.
      </p>
    </div>
  );
}
