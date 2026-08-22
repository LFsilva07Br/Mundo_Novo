import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { BadgeVencimento } from "@/components/badge-vencimento";
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
import {
  EXAMES_POR_CARGO,
  MORADIAS_DEMO,
  TRABALHADORES_DEMO,
  TREINAMENTOS_DEMO,
  vencimentoTreinamento,
} from "@/lib/social/dados-demo";
import { formatarData } from "@/lib/vencimentos";

export const metadata: Metadata = {
  title: "Social & Colaboradores",
};

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function PaginaSocial() {
  const homens = TRABALHADORES_DEMO.filter((t) => t.genero === "Masculino").length;
  const mulheres = TRABALHADORES_DEMO.length - homens;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Módulo social · Fazenda Alto da Serra (Dutra da Serra)
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Social & Colaboradores
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dados reais da planilha de trabalhadores da cliente. Vencimentos de
          treinamentos e exames entram no mesmo motor de alertas dos
          certificados.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">{TRABALHADORES_DEMO.length}</p>
            <p className="text-xs font-semibold text-muted-foreground">
              trabalhadores fixos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">
              {homens} / {mulheres}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              homens / mulheres
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">
              {MORADIAS_DEMO.length}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              moradias na fazenda
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">
              {TREINAMENTOS_DEMO.length}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              treinamentos monitorados
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trabalhadores fixos e funções</CardTitle>
          <CardDescription>
            Função, CBO, salário, benefícios e funções habilitadas — base da
            conformidade social/trabalhista da norma.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador(a)</TableHead>
                <TableHead>Função · CBO</TableHead>
                <TableHead className="text-right">Salário</TableHead>
                <TableHead>Admissão</TableHead>
                <TableHead>Moradia</TableHead>
                <TableHead>Adicionais</TableHead>
                <TableHead>Funções habilitadas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TRABALHADORES_DEMO.map((t) => (
                <TableRow key={t.nome}>
                  <TableCell className="font-semibold">{t.nome}</TableCell>
                  <TableCell className="text-sm">
                    {t.funcao}
                    <span className="block text-xs text-muted-foreground">
                      CBO {t.cbo}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {moeda.format(t.salario)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatarData(new Date(`${t.admissao}T12:00:00`))}
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.moradia ? "Sim" : "Não"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.insalubridade ? (
                      <Badge variant="outline">Insalubridade 20%</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="flex max-w-64 flex-wrap gap-1">
                      {t.funcoesHabilitadas.map((f) => (
                        <Badge key={f} variant="secondary" className="text-[10px]">
                          {f}
                        </Badge>
                      ))}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Treinamentos (NRs)</CardTitle>
            <CardDescription>
              Status calculado pela periodicidade — alerta antes do vencimento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {TREINAMENTOS_DEMO.map((t) => {
              const vencimento = vencimentoTreinamento(t);
              return (
                <div
                  key={t.nome}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3"
                >
                  <div>
                    <p className="text-sm font-bold">{t.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.periodicidadeMeses === 12 ? "Anual" : "Bienal"} ·{" "}
                      {t.participantes}/{t.totalTrabalhadores} participantes
                      {t.ultimaRealizacao
                        ? ` · realizado ${formatarData(new Date(`${t.ultimaRealizacao}T12:00:00`))}`
                        : null}
                    </p>
                  </div>
                  {vencimento ? (
                    <BadgeVencimento
                      venceEm={vencimento.toISOString().slice(0, 10)}
                    />
                  ) : (
                    <Badge variant="outline" className="text-warning">
                      Pendente de realização
                    </Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Moradias</CardTitle>
              <CardDescription>
                Controle por casa com moradores e parentesco (requisito da
                norma social).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {MORADIAS_DEMO.map((m) => (
                <div key={m.casa} className="rounded-xl border p-3">
                  <p className="text-sm font-bold">
                    {m.casa} · {m.totalMoradores} morador
                    {m.totalMoradores === 1 ? "" : "es"}
                  </p>
                  {m.moradores.length > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {m.moradores
                        .map((mo) => `${mo.nome} (${mo.parentesco})`)
                        .join(" · ")}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Moradores detalhados no cadastro completo.
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exames ocupacionais por cargo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {EXAMES_POR_CARGO.map((e) => (
                <div key={e.cargo} className="rounded-xl border p-3">
                  <p className="flex items-center justify-between text-sm font-bold">
                    {e.cargo}
                    <Badge variant="outline">{e.periodicidade}</Badge>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {e.exames.join(" · ")}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
