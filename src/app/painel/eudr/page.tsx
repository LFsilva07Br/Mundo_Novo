import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Download, FileText, Globe2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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
import { listarImoveisDoCliente } from "@/lib/carteira/imoveis-consultas";
import { formatarCentroide, montarPacoteEudr } from "@/lib/eudr/dados";
import { listarMapasCliente } from "@/lib/mapas/consultas";
import { formatarArea } from "@/lib/vencimentos";
import { cn } from "@/lib/utils";
import { SeletorCliente } from "./seletor-cliente";

export const metadata: Metadata = {
  title: "EUDR — Geolocalização",
};

/**
 * Relatório EUDR — argumento de venda para exportação: o café vendido à
 * União Europeia exige polígono de geolocalização por área produtiva.
 * A tela mostra a cobertura do cliente e gera os dois entregáveis
 * (GeoJSON consolidado + declaração em PDF).
 */
export default async function PaginaEudr({
  searchParams,
}: PageProps<"/painel/eudr">) {
  const { cliente: parametroCliente } = await searchParams;
  const clientes = await listarClientes();

  const idPedido =
    typeof parametroCliente === "string" ? parametroCliente : undefined;
  const clientePadrao =
    clientes.find((c) => c.nome.includes("Alto da Serra")) ?? clientes[0];
  const cliente = clientes.find((c) => c.id === idPedido) ?? clientePadrao;

  if (!cliente) {
    return (
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-extrabold tracking-tight">
          EUDR — Geolocalização
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Nenhum cliente cadastrado ainda.
        </p>
      </div>
    );
  }

  const [imoveis, mapas] = await Promise.all([
    listarImoveisDoCliente(cliente.id),
    listarMapasCliente(cliente.id),
  ]);
  const pacote = montarPacoteEudr(cliente, imoveis, mapas);

  const urlCliente = encodeURIComponent(cliente.id);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Exportação / {cliente.nome}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            EUDR — Geolocalização das áreas produtivas
          </h1>
        </div>
        <SeletorCliente
          clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))}
          clienteSelecionadoId={cliente.id}
        />
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-secondary/60 p-4">
        <Globe2 className="mt-0.5 size-5 shrink-0 text-primary" />
        <p className="text-sm font-semibold text-secondary-foreground">
          O EUDR (Regulamento da União Europeia contra o desmatamento) exige,
          a partir de 2025/26, o polígono de geolocalização de cada área
          produtiva do café exportado à Europa. Quem já tem os mapas prontos
          sai na frente na venda: esta tela gera o pacote que o comprador
          precisa para a due diligence.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={`/api/eudr/geojson?cliente=${urlCliente}`}
          download
          className={cn(buttonVariants())}
        >
          <Download className="size-4" />
          Baixar GeoJSON consolidado
        </a>
        <a
          href={`/api/eudr/pdf?cliente=${urlCliente}`}
          download
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <FileText className="size-4" />
          Baixar declaração em PDF
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">
              {pacote.imoveisComPoligono} de {pacote.totalImoveis}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              imóveis com polígono
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">
              {pacote.percentualCobertura}%
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              cobertura de polígonos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">
              {pacote.colecao.features.length}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              polígonos no pacote
            </p>
          </CardContent>
        </Card>
      </div>

      {pacote.imoveisSemPoligono.length > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
          <div className="text-sm">
            <p className="font-bold text-warning">
              {pacote.imoveisSemPoligono.length}{" "}
              {pacote.imoveisSemPoligono.length === 1
                ? "imóvel ainda sem polígono"
                : "imóveis ainda sem polígono"}
              : {pacote.imoveisSemPoligono.join(" · ")}
            </p>
            <p className="mt-1 text-muted-foreground">
              Envie o mapa (KML do CAR ou GeoJSON) destes imóveis em{" "}
              <Link
                href={`/painel/imoveis?cliente=${urlCliente}`}
                className="font-semibold text-primary underline underline-offset-2"
              >
                Imóveis &amp; Talhões
              </Link>{" "}
              para completar a cobertura exigida pelo EUDR.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-primary/20 bg-secondary/60 p-4 text-sm font-semibold text-secondary-foreground">
          Cobertura completa — todos os imóveis rurais do cliente têm polígono
          de geolocalização.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Declaração de geolocalização por imóvel</CardTitle>
          <CardDescription>
            Produtor, CAR, área e a coordenada de referência (centroide) de
            cada imóvel rural — o polígono completo segue no GeoJSON.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {pacote.imoveis.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum imóvel rural cadastrado para este cliente.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imóvel rural</TableHead>
                  <TableHead>Produtor</TableHead>
                  <TableHead>CAR</TableHead>
                  <TableHead className="text-right">Área</TableHead>
                  <TableHead className="text-right">
                    Centroide (lat, long)
                  </TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pacote.imoveis.map((imovel) => (
                  <TableRow key={imovel.imovelId}>
                    <TableCell className="font-semibold">
                      {imovel.imovelNome}
                    </TableCell>
                    <TableCell className="text-sm">{imovel.produtor}</TableCell>
                    <TableCell className="max-w-56 truncate text-xs text-muted-foreground">
                      {imovel.car ?? "CAR não informado"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-sm">
                      {formatarArea(imovel.areaHa)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-sm tabular-nums">
                      {formatarCentroide(imovel.centroide)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-lg px-2.5 py-1 text-xs font-bold",
                          imovel.temPoligono
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-warning/10 text-warning",
                        )}
                      >
                        {imovel.temPoligono ? "COM polígono" : "SEM polígono"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
