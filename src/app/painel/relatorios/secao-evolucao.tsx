import { TrendingUp } from "lucide-react";
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
import { EstadoVazio, EstadoVazioLinha } from "@/components/estado-vazio";
import type { SerieConformidade } from "@/lib/prontidao/historico";

export type ClienteBenchmark = {
  id: string;
  nome: string;
  conformidade?: number;
};

/**
 * Evolução da conformidade por cliente (mini-gráfico de barras em CSS,
 * agregado por mês das visitas concluídas) + benchmarking da carteira:
 * ranking da conformidade atual contra a média.
 */
export function SecaoEvolucao({
  series,
  clientes,
}: {
  series: SerieConformidade[];
  clientes: ClienteBenchmark[];
}) {
  const comConformidade = clientes.filter(
    (c): c is ClienteBenchmark & { conformidade: number } =>
      typeof c.conformidade === "number",
  );
  const media =
    comConformidade.length > 0
      ? Math.round(
          comConformidade.reduce((s, c) => s + c.conformidade, 0) /
            comConformidade.length,
        )
      : 0;
  const ranking = [...comConformidade].sort(
    (a, b) => b.conformidade - a.conformidade,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução da conformidade</CardTitle>
        <CardDescription>
          Conformidade das visitas concluídas ao longo do tempo, por cliente,
          e o benchmarking da carteira contra a média ({media}%).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {series.length === 0 ? (
          <EstadoVazio
            icone={TrendingUp}
            titulo="Nenhuma evolução de conformidade para mostrar."
            descricao="As curvas aparecem a partir da segunda visita concluída de cada cliente."
          />
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {series.map((serie) => (
            <div
              key={serie.clienteId}
              className="rounded-lg border border-border p-3"
            >
              <p className="truncate text-sm font-semibold">
                {serie.clienteNome}
              </p>
              <div className="mt-2 flex h-24 items-end gap-1.5">
                {serie.pontos.map((ponto) => (
                  <div
                    key={ponto.mes}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-0.5"
                    title={`${ponto.rotulo}: ${ponto.conformidade}% (${ponto.visitas} visita(s))`}
                  >
                    <span className="text-[10px] font-bold">
                      {ponto.conformidade}
                    </span>
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t bg-chart-2"
                        style={{ height: `${ponto.conformidade}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {ponto.rotulo}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Benchmarking da carteira
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Conformidade atual</TableHead>
                <TableHead className="text-right">vs. média</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.length === 0 ? (
                <EstadoVazioLinha
                  colunas={4}
                  icone={TrendingUp}
                  titulo="Sem conformidade apurada para comparar."
                  descricao="O benchmarking nasce das visitas concluídas — conclua ao menos uma visita com checklist respondido."
                />
              ) : null}
              {ranking.map((cliente, indice) => {
                const diferenca = cliente.conformidade - media;
                return (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-bold">{indice + 1}º</TableCell>
                    <TableCell className="font-semibold">
                      {cliente.nome}
                    </TableCell>
                    <TableCell className="text-right">
                      {cliente.conformidade}%
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold ${
                        diferenca >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {diferenca >= 0 ? "+" : ""}
                      {diferenca} pt(s)
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
