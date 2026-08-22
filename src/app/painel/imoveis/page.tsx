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
import { obterCliente } from "@/lib/carteira/consultas";
import {
  HISTORICO_SAFRAS_ALTO_DA_SERRA,
  TALHOES_ALTO_DA_SERRA,
} from "@/lib/carteira/talhoes-demo";
import { formatarArea } from "@/lib/vencimentos";

export const metadata: Metadata = {
  title: "Imóveis & Talhões",
};

const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export default async function PaginaImoveis() {
  const cliente = await obterCliente("alto-da-serra");
  const talhoes = TALHOES_ALTO_DA_SERRA;
  const areaTalhoes = talhoes.reduce((s, t) => s + t.areaHa, 0);
  const previsaoTotal = talhoes.reduce((s, t) => s + t.previsao2526Sacas, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Grupos / Grupo Alta Mogiana /{" "}
          <Link href="/painel/clientes/alto-da-serra" className="text-primary">
            Fazenda Alto da Serra
          </Link>
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Imóveis rurais & Talhões
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dados reais das planilhas de controle ambiental e estimativa de
          safra. CAR e matrícula pertencem ao imóvel; o talhão pertence ao
          imóvel e carrega seu histórico por safra.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">{cliente?.imoveis?.length}</p>
            <p className="text-xs font-semibold text-muted-foreground">
              imóveis rurais
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">{talhoes.length}</p>
            <p className="text-xs font-semibold text-muted-foreground">
              talhões
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">{formatarArea(areaTalhoes)}</p>
            <p className="text-xs font-semibold text-muted-foreground">
              área dos talhões
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">
              {numero.format(previsaoTotal)}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              sacas previstas 2025/26
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Talhões — safra 2025/26</CardTitle>
          <CardDescription>
            Ficha completa exigida pela cliente: plantas/ha, espaçamento,
            variedade, ano de plantio, estado da lavoura e previsão de
            colheita.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Talhão</TableHead>
                <TableHead>Produtor</TableHead>
                <TableHead>Imóvel rural</TableHead>
                <TableHead className="text-right">Área</TableHead>
                <TableHead className="text-right">Plantas/ha</TableHead>
                <TableHead>Espaçamento</TableHead>
                <TableHead>Variedade</TableHead>
                <TableHead className="text-right">Plantio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Prev. 25/26</TableHead>
                <TableHead className="text-right">Colh. 24/25</TableHead>
                <TableHead>Poda/renovação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {talhoes.map((t) => (
                <TableRow key={t.nome}>
                  <TableCell className="font-semibold">{t.nome}</TableCell>
                  <TableCell className="text-sm">{t.produtor}</TableCell>
                  <TableCell className="max-w-44 truncate text-sm text-muted-foreground">
                    {t.imovel}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatarArea(t.areaHa)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {t.plantasPorHa ? numero.format(t.plantasPorHa) : "—"}
                  </TableCell>
                  <TableCell className="text-sm">{t.espacamento ?? "—"}</TableCell>
                  <TableCell className="text-sm">{t.variedade}</TableCell>
                  <TableCell className="text-right text-sm">
                    {t.anoPlantio}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        t.estadoLavoura === "Produção" ? "secondary" : "outline"
                      }
                    >
                      {t.estadoLavoura}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold">
                    {numero.format(t.previsao2526Sacas)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {t.colheita2425Sacas ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.previsaoPodaRenovacao ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comparativo entre safras</CardTitle>
          <CardDescription>
            Previsão × colheita efetiva (sacas de 60 kg) — histórico que a
            cliente mantém para entender gargalos de produção.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Safra</TableHead>
                <TableHead className="text-right">Previsão</TableHead>
                <TableHead className="text-right">Colheita efetiva</TableHead>
                <TableHead className="text-right">Realização</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {HISTORICO_SAFRAS_ALTO_DA_SERRA.map((s) => (
                <TableRow key={s.safra}>
                  <TableCell className="font-semibold">{s.safra}</TableCell>
                  <TableCell className="text-right">
                    {s.previsaoSacas !== null
                      ? numero.format(s.previsaoSacas)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {s.colheitaEfetivaSacas !== null
                      ? numero.format(s.colheitaEfetivaSacas)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {s.previsaoSacas && s.colheitaEfetivaSacas
                      ? `${Math.round((s.colheitaEfetivaSacas / s.previsaoSacas) * 100)}%`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.observacao ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Os demais clientes terão seus imóveis e talhões cadastrados quando o
        banco de dados for conectado — a estrutura já está pronta.
      </p>
    </div>
  );
}
