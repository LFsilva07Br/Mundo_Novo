import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CAPAS_DEMO, RANKING_GAPS } from "@/lib/certificacao/dados-demo";
import { formatarData } from "@/lib/vencimentos";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Planos de ação — CAPA",
};

const COR_SEVERIDADE: Record<string, string> = {
  Crítica: "bg-destructive/10 text-destructive",
  Maior: "bg-destructive/10 text-destructive",
  Menor: "bg-warning/10 text-warning",
};

export default function PaginaCapas() {
  const abertas = CAPAS_DEMO.filter((c) => c.status !== "Fechada");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Não conformidades
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Planos de ação — CAPA
        </h1>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-secondary/60 p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <p className="text-sm font-semibold text-secondary-foreground">
          Regra do sistema: uma não conformidade nunca fica sem plano de ação.
          O CAPA nasce automaticamente ao marcar o item como não conforme — com
          responsável e prazo — e o checklist não fecha sem o plano.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">{abertas.length}</p>
            <p className="text-xs font-semibold text-muted-foreground">
              CAPAs em aberto
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">
              {CAPAS_DEMO.filter((c) => c.origemRegistro === "Campo").length} /{" "}
              {CAPAS_DEMO.filter((c) => c.origemRegistro === "Escritório").length}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              campo / escritório
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">
              {CAPAS_DEMO.filter((c) => c.status === "Fechada").length}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              fechadas e verificadas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CAPAs</CardTitle>
          <CardDescription>
            Auditorias de campo e ações do escritório geram CAPAs no mesmo
            fluxo — a etiqueta de origem diferencia.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CAPA / origem</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Sev.</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CAPAS_DEMO.map((capa) => (
                <TableRow key={capa.numero}>
                  <TableCell>
                    <p className="font-semibold">
                      #{capa.numero} — item {capa.origem}
                    </p>
                    <p className="max-w-72 text-xs text-muted-foreground">
                      {capa.descricao}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">{capa.cliente}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "rounded-lg px-2 py-0.5 text-xs font-bold",
                        COR_SEVERIDADE[capa.severidade],
                      )}
                    >
                      {capa.severidade}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{capa.responsavel}</TableCell>
                  <TableCell className="text-sm">
                    {capa.prazo
                      ? formatarData(new Date(`${capa.prazo}T12:00:00`))
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{capa.origemRegistro}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={capa.status === "Fechada" ? "secondary" : "outline"}
                    >
                      {capa.status === "Fechada" ? "✓ Fechada" : capa.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gaps mais recorrentes</CardTitle>
          <CardDescription>
            Toda métrica nasce do dado estruturado do checklist e do CAPA — sem
            apuração manual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {RANKING_GAPS.map((gap, indice) => (
            <div key={gap.categoria} className="flex items-center gap-3">
              <span className="w-6 text-sm font-extrabold text-muted-foreground">
                {indice + 1}º
              </span>
              <span className="flex-1 text-sm font-semibold">
                {gap.categoria}
              </span>
              <div className="h-2 w-40 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${(gap.quantidade / Math.max(...RANKING_GAPS.map((g) => g.quantidade), 1)) * 100}%`,
                  }}
                />
              </div>
              <span className="w-6 text-right text-sm font-bold">
                {gap.quantidade}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Gatilhos automáticos: NC marcada → CAPA nasce na hora · evidência
        anexada → verificação do consultor · 7 dias do prazo → lembrete ao
        responsável · prazo estourado → escalonamento ao gestor.
      </p>
    </div>
  );
}
