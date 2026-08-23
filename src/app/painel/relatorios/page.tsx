import type { Metadata } from "next";
import Link from "next/link";
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
import { listarClientes } from "@/lib/carteira/consultas";
import {
  HISTORICO_SAFRAS_ALTO_DA_SERRA,
  TALHOES_ALTO_DA_SERRA,
} from "@/lib/carteira/talhoes-demo";
import { balancoDaCarteira } from "@/lib/prontidao/balanco";
import { evolucaoDaCarteira } from "@/lib/prontidao/historico";
import { formatarArea } from "@/lib/vencimentos";
import { BotoesExportar, CartaoRelatorioMensal } from "./exportar";
import { SecaoBalanco } from "./secao-balanco";
import { SecaoEvolucao } from "./secao-evolucao";

export const metadata: Metadata = {
  title: "Relatórios",
};

const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

// Composição de áreas da Fazenda Alto da Serra (planilha de controle ambiental)
const AREA_TOTAL = 107.2206;
const AREA_CAFE = 62.22;
const AREA_APP = 1.6962;
const AREA_RESERVA = 30.658;
const AREA_OUTROS = AREA_TOTAL - AREA_CAFE - AREA_APP - AREA_RESERVA;

export default async function PaginaRelatorios() {
  const [clientes, balancos, evolucao] = await Promise.all([
    listarClientes(),
    balancoDaCarteira(),
    evolucaoDaCarteira(),
  ]);
  const clienteSafra =
    clientes.find((c) => c.nome.includes("Alto da Serra")) ?? clientes[0];
  const previsaoTotal = TALHOES_ALTO_DA_SERRA.reduce(
    (s, t) => s + t.previsao2526Sacas,
    0,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Valor gerado ao cliente
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">Relatórios</h1>
        </div>
        <Badge variant="outline">
          Exportação em Excel e PDF, pronta para enviar ao cliente
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estimativa de safra 2025/26 — Fazenda Alto da Serra</CardTitle>
          <CardDescription>
            Previsão de colheita por talhão e produtor (sacas de 60 kg), a
            partir da planilha real da cliente.
          </CardDescription>
          <BotoesExportar
            base="/api/relatorios/safra"
            parametros={{ cliente: clienteSafra?.id ?? "alto-da-serra" }}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produtor</TableHead>
                <TableHead className="text-right">Talhões</TableHead>
                <TableHead className="text-right">Área (ha)</TableHead>
                <TableHead className="text-right">Previsão (sacas)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {["Sílvio", "Winicius/Tâmara", "Carter", "Matheus"].map(
                (produtor) => {
                  const doProdutor = TALHOES_ALTO_DA_SERRA.filter(
                    (t) => t.produtor === produtor,
                  );
                  return (
                    <TableRow key={produtor}>
                      <TableCell className="font-semibold">{produtor}</TableCell>
                      <TableCell className="text-right">
                        {doProdutor.length}
                      </TableCell>
                      <TableCell className="text-right">
                        {numero.format(
                          doProdutor.reduce((s, t) => s + t.areaHa, 0),
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {numero.format(
                          doProdutor.reduce(
                            (s, t) => s + t.previsao2526Sacas,
                            0,
                          ),
                        )}
                      </TableCell>
                    </TableRow>
                  );
                },
              )}
              <TableRow className="font-extrabold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">
                  {TALHOES_ALTO_DA_SERRA.length}
                </TableCell>
                <TableCell className="text-right">
                  {numero.format(
                    TALHOES_ALTO_DA_SERRA.reduce((s, t) => s + t.areaHa, 0),
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {numero.format(previsaoTotal)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">
            Detalhe por talhão em{" "}
            <Link href="/painel/imoveis" className="font-semibold text-primary">
              Imóveis & Talhões
            </Link>
            , incluindo o comparativo entre safras (
            {HISTORICO_SAFRAS_ALTO_DA_SERRA.length} safras de histórico).
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Controle ambiental — Alto da Serra</CardTitle>
            <CardDescription>
              Área total × área produtiva, com APP e reserva legal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { rotulo: "Café (produtiva)", valor: AREA_CAFE, cor: "bg-chart-2" },
              { rotulo: "Reserva legal", valor: AREA_RESERVA, cor: "bg-chart-1" },
              { rotulo: "APP", valor: AREA_APP, cor: "bg-chart-3" },
              { rotulo: "Outros usos", valor: AREA_OUTROS, cor: "bg-chart-4" },
            ].map((faixa) => (
              <div key={faixa.rotulo} className="space-y-1">
                <p className="flex justify-between text-sm">
                  <span className="font-semibold">{faixa.rotulo}</span>
                  <span>
                    {formatarArea(faixa.valor)} ·{" "}
                    {Math.round((faixa.valor / AREA_TOTAL) * 100)}%
                  </span>
                </p>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${faixa.cor}`}
                    style={{ width: `${(faixa.valor / AREA_TOTAL) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="pt-1 text-xs text-muted-foreground">
              Área total: {formatarArea(AREA_TOTAL)} · confronto declarado ×
              CAR disponível na ficha de cada imóvel.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conformidade por cliente</CardTitle>
            <CardDescription>
              Nasce do dado estruturado do checklist — sem apuração manual.
              Exporta a carteira com certificações e vencimentos.
            </CardDescription>
            <BotoesExportar base="/api/relatorios/conformidade" />
          </CardHeader>
          <CardContent className="space-y-2.5">
            {clientes
              .filter((c) => typeof c.conformidade === "number")
              .sort((a, b) => (b.conformidade ?? 0) - (a.conformidade ?? 0))
              .map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="w-44 truncate text-sm font-semibold">
                    {c.nome}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${c.conformidade}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm font-bold">
                    {c.conformidade}%
                  </span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      <SecaoBalanco balancos={balancos} />

      <SecaoEvolucao
        series={evolucao}
        clientes={clientes.map((c) => ({
          id: c.id,
          nome: c.nome,
          conformidade: c.conformidade,
        }))}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pacote de auditoria — CAPAs</CardTitle>
            <CardDescription>
              Planos de ação com origem, severidade, prazo e status. Para a
              auditoria externa, o pacote sai só com as CAPAs em aberto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Somente abertas (auditoria externa)
              </p>
              <BotoesExportar
                base="/api/relatorios/capas"
                parametros={{ ocultar_fechadas: "1" }}
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Histórico completo (uso interno)
              </p>
              <BotoesExportar
                base="/api/relatorios/capas"
                rotuloExcel="Excel completo"
                rotuloPdf="PDF completo"
              />
            </div>
          </CardContent>
        </Card>

        <CartaoRelatorioMensal
          clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))}
        />
      </div>
    </div>
  );
}
