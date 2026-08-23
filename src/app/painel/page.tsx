import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BadgeVencimento } from "@/components/badge-vencimento";
import { EstadoVazioLinha } from "@/components/estado-vazio";
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
import { listarClientes } from "@/lib/carteira/consultas";
import { CAPAS_DEMO } from "@/lib/certificacao/dados-demo";
import { ROTULO_NORMA, type Norma } from "@/lib/carteira/tipos";
import { avaliarCarteira } from "@/lib/prontidao/consultas";
import { CartaoProntidao } from "./cartao-prontidao";
import { resumoCarteira, resumoNormas, resumoVencimentos } from "./indicadores";

export const metadata: Metadata = {
  title: "Dashboard",
};

/** Siglas curtas: o detalhe do cartão tem espaço para uma linha só. */
const SIGLA_NORMA: Record<Norma, string> = {
  ra: "RA",
  quatro_c: "4C",
  organico: "Orgânico",
};

export default async function PaginaDashboard() {
  const [clientes, prontidao] = await Promise.all([
    listarClientes(),
    avaliarCarteira(),
  ]);

  const certificacoes = clientes.flatMap((cliente) =>
    cliente.certificacoes.map((cert) => ({ cliente, cert })),
  );
  const comVencimento = certificacoes
    .filter((c) => c.cert.venceEm)
    .sort(
      (a, b) =>
        new Date(a.cert.venceEm!).getTime() -
        new Date(b.cert.venceEm!).getTime(),
    );

  const vencimentos = resumoVencimentos(comVencimento.map(({ cert }) => cert));
  const carteira = resumoCarteira(clientes);

  const conformidades = clientes
    .map((c) => c.conformidade)
    .filter((n): n is number => typeof n === "number");
  const conformidadeMedia = Math.round(
    conformidades.reduce((s, n) => s + n, 0) / conformidades.length,
  );
  const capasAbertas = CAPAS_DEMO.filter((c) => c.status !== "Fechada").length;

  const indicadores: {
    rotulo: string;
    valor: string;
    detalhe: string;
    tom?: "destrutivo" | "atencao" | "ok";
  }[] = [
    {
      rotulo: "Clientes ativos",
      valor: String(carteira.clientes),
      detalhe: carteira.detalhe,
    },
    {
      rotulo: "Certificações",
      valor: String(certificacoes.length),
      detalhe: resumoNormas(
        certificacoes.map(({ cert }) => cert),
        SIGLA_NORMA,
      ),
    },
    // Vencido e a vencer são urgências diferentes: juntar os dois num
    // cartão só fazia o painel mostrar menos trabalho do que existe.
    {
      rotulo: "Certificações vencidas",
      valor: String(vencimentos.vencidas),
      detalhe:
        vencimentos.vencidas > 0
          ? "renovação em atraso — prioridade máxima"
          : "nenhuma em atraso",
      tom: vencimentos.vencidas > 0 ? "destrutivo" : "ok",
    },
    {
      rotulo: "Vencem em 90 dias",
      valor: String(vencimentos.vencendo90),
      detalhe:
        vencimentos.vencendo90 > 0
          ? "planejar a renovação"
          : "nada no radar de 90 dias",
      tom: vencimentos.vencendo90 > 0 ? "atencao" : "ok",
    },
    {
      rotulo: "CAPAs abertas",
      valor: String(capasAbertas),
      detalhe: "planos de ação ativos",
    },
    {
      rotulo: "Conformidade média",
      valor: `${conformidadeMedia}%`,
      detalhe: "média da carteira",
      tom: "ok",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Visão geral
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Painel da carteira
          </h1>
        </div>
        <Link
          href="/painel/roadmap"
          className="text-sm font-semibold text-primary underline underline-offset-2"
        >
          Roadmap de implantação →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {indicadores.map((kpi) => (
          <Card key={kpi.rotulo}>
            <CardContent className="py-4">
              <p
                className={
                  kpi.tom === "destrutivo"
                    ? "text-2xl font-extrabold text-destructive"
                    : kpi.tom === "atencao"
                      ? "text-2xl font-extrabold text-warning"
                      : kpi.tom === "ok"
                        ? "text-2xl font-extrabold text-success"
                        : "text-2xl font-extrabold"
                }
              >
                {kpi.valor}
              </p>
              <p className="text-xs font-bold">{kpi.rotulo}</p>
              <p className="text-[11px] text-muted-foreground">{kpi.detalhe}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <CartaoProntidao carteira={prontidao} />

      <Card>
        <CardHeader>
          <CardTitle>Certificados por vencimento</CardTitle>
          <CardDescription>
            Ordenados pela proximidade do vencimento — os disparos de alerta
            seguem a régua configurada em Alertas & Automação e persistem até a
            resolução.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Certificação</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comVencimento.length === 0 ? (
                <EstadoVazioLinha
                  colunas={3}
                  icone={CalendarClock}
                  titulo="Nenhum certificado com vencimento cadastrado."
                  descricao="Cadastre a data de vencimento na ficha de cada cliente — é ela que dispara os alertas de 180 a 30 dias."
                />
              ) : null}
              {comVencimento.map(({ cliente, cert }) => (
                <TableRow key={`${cliente.id}-${cert.norma}`}>
                  <TableCell>
                    <Link
                      href={`/painel/clientes/${cliente.id}`}
                      className="font-semibold hover:text-primary"
                    >
                      {cliente.nome}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {cliente.regiao}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">
                    {ROTULO_NORMA[cert.norma]}
                    {cert.certificadora ? ` (${cert.certificadora})` : null}
                  </TableCell>
                  <TableCell>
                    <BadgeVencimento venceEm={cert.venceEm} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/painel/workflow" className="group">
          <Card className="h-full transition-colors group-hover:border-primary/40">
            <CardContent className="py-4">
              <p className="font-bold">Workflow de certificação</p>
              <p className="text-sm text-muted-foreground">
                8 processos nas 5 etapas do ciclo
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/painel/capas" className="group">
          <Card className="h-full transition-colors group-hover:border-primary/40">
            <CardContent className="py-4">
              <p className="font-bold">CAPAs & indicadores</p>
              <p className="text-sm text-muted-foreground">
                {capasAbertas} planos em aberto · ranking de gaps
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/painel/social" className="group">
          <Card className="h-full transition-colors group-hover:border-primary/40">
            <CardContent className="py-4">
              <p className="font-bold">Social & Colaboradores</p>
              <p className="text-sm text-muted-foreground">
                Trabalhadores, treinamentos e exames
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
