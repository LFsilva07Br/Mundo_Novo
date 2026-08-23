import type { Metadata } from "next";
import { Droplets } from "lucide-react";
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
import { listarClientes } from "@/lib/carteira/consultas";
import {
  listarImoveisDoCliente,
  listarRotulosSafras,
  listarTalhoes,
  SAFRA_ANTERIOR,
  SAFRA_ATUAL,
} from "@/lib/carteira/imoveis-consultas";
import {
  ROTULO_STATUS_DOCUMENTO,
  ROTULO_TIPO_DOCUMENTO,
  type StatusDocumento,
} from "@/lib/carteira/imoveis-esquemas";
import { listarMapasCliente } from "@/lib/mapas/consultas";
import { formatarArea } from "@/lib/vencimentos";
import { cn } from "@/lib/utils";
import {
  BotaoEditarImovel,
  BotaoEditarTalhao,
  BotaoLancarSafra,
  BotaoNovaCaptacao,
  BotaoNovoDocumento,
  BotaoNovoImovel,
  BotaoNovoTalhao,
} from "./dialogos";
import { SecaoMapas } from "./secao-mapas";
import { SeletorCliente } from "./seletor-cliente";

export const metadata: Metadata = {
  title: "Imóveis & Talhões",
};

const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

const CLASSES_STATUS_DOCUMENTO: Record<StatusDocumento, string> = {
  ok: "bg-secondary text-secondary-foreground",
  proximo_vencimento: "bg-warning/10 text-warning",
  vencido: "bg-destructive/10 text-destructive",
  pendente: "bg-muted text-muted-foreground",
};

function EtiquetaStatus({ status }: { status: StatusDocumento }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-lg px-2.5 py-1 text-xs font-bold",
        CLASSES_STATUS_DOCUMENTO[status],
      )}
    >
      {ROTULO_STATUS_DOCUMENTO[status]}
    </span>
  );
}

/** Próxima safra a partir do último rótulo (ex.: 2025/26 → 2026/27). */
function proximaSafra(rotulo: string): string | null {
  const ano = Number(rotulo.slice(0, 4));
  if (!Number.isInteger(ano)) return null;
  return `${ano + 1}/${String((ano + 2) % 100).padStart(2, "0")}`;
}

export default async function PaginaImoveis({
  searchParams,
}: PageProps<"/painel/imoveis">) {
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
          Imóveis rurais & Talhões
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Nenhum cliente cadastrado ainda.
        </p>
      </div>
    );
  }

  const [imoveis, panorama, rotulosSafras, mapas] = await Promise.all([
    listarImoveisDoCliente(cliente.id),
    listarTalhoes(cliente.id),
    listarRotulosSafras(),
    listarMapasCliente(cliente.id),
  ]);
  const { talhoes, comparativo } = panorama;

  const opcoesImoveis = imoveis.map((i) => ({ id: i.id, nome: i.nome }));
  const opcoesTalhoes = talhoes.map((t) => ({
    id: t.id,
    nome: t.nome,
    imovelNome: t.imovelNome,
  }));

  const ultimaSafra = rotulosSafras[rotulosSafras.length - 1];
  const seguinte = ultimaSafra ? proximaSafra(ultimaSafra) : null;
  const safrasParaLancamento =
    seguinte && !rotulosSafras.includes(seguinte)
      ? [...rotulosSafras, seguinte]
      : rotulosSafras;

  const areaImoveis = imoveis.reduce((s, i) => s + i.areaTotalHa, 0);
  const areaTalhoes = talhoes.reduce((s, t) => s + t.areaHa, 0);
  const previsaoAtual = talhoes.reduce(
    (s, t) => s + (t.previsaoAtualSacas ?? 0),
    0,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Carteira / {cliente.nome}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Imóveis rurais & Talhões
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            CAR, matrículas, licenças e outorgas pertencem ao imóvel; o talhão
            pertence ao imóvel e carrega seu histórico por safra.
          </p>
        </div>
        <SeletorCliente
          clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))}
          clienteSelecionadoId={cliente.id}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <BotaoNovoImovel clienteId={cliente.id} />
        <BotaoNovoTalhao clienteId={cliente.id} imoveis={opcoesImoveis} />
        <BotaoLancarSafra
          clienteId={cliente.id}
          talhoes={opcoesTalhoes}
          safras={safrasParaLancamento}
          safraPadrao={SAFRA_ATUAL}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">{imoveis.length}</p>
            <p className="text-xs font-semibold text-muted-foreground">
              imóveis rurais · {formatarArea(areaImoveis)}
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
              {numero.format(previsaoAtual)}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              sacas previstas {SAFRA_ATUAL}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Imóveis rurais</CardTitle>
          <CardDescription>
            Documentos com status e vencimento, e captações de água (outorgas e
            usos insignificantes) por imóvel.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {imoveis.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum imóvel rural cadastrado para este cliente — use o botão
              &ldquo;Novo imóvel&rdquo;.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imóvel</TableHead>
                  <TableHead>CAR / Matrículas</TableHead>
                  <TableHead className="text-right">Áreas</TableHead>
                  <TableHead>Documentos</TableHead>
                  <TableHead>Captações de água</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imoveis.map((imovel) => (
                  <TableRow key={imovel.id}>
                    <TableCell className="align-top">
                      <p className="font-semibold">{imovel.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {imovel.proprietarios ?? "—"}
                        {imovel.uf ? ` · ${imovel.uf}` : null}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-52 align-top">
                      <p className="truncate text-xs text-muted-foreground">
                        {imovel.car ?? "CAR não informado"}
                      </p>
                      <p className="text-xs">
                        Matrículas: {imovel.matriculas ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right align-top text-sm">
                      <p>{formatarArea(imovel.areaTotalHa)} total</p>
                      <p className="text-xs text-muted-foreground">
                        {formatarArea(imovel.areaCafeHa)} café ·{" "}
                        {formatarArea(imovel.areaReservaHa)} reserva
                      </p>
                    </TableCell>
                    <TableCell className="align-top">
                      {imovel.documentos.length === 0 ? (
                        <span className="text-xs text-muted-foreground">
                          Sem documentos
                        </span>
                      ) : (
                        <ul className="space-y-1.5">
                          {imovel.documentos.map((documento) => (
                            <li
                              key={documento.id}
                              className="flex flex-wrap items-center gap-1.5"
                            >
                              <Badge variant="outline">
                                {ROTULO_TIPO_DOCUMENTO[documento.tipo]}
                              </Badge>
                              {documento.venceEm ? (
                                <BadgeVencimento venceEm={documento.venceEm} />
                              ) : (
                                <EtiquetaStatus status={documento.status} />
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      {imovel.captacoes.length === 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {imovel.possuiCaptacaoAgua
                            ? "Captação a cadastrar"
                            : "Sem captação"}
                        </span>
                      ) : (
                        <ul className="space-y-1.5">
                          {imovel.captacoes.map((captacao) => (
                            <li key={captacao.id} className="text-xs">
                              <p className="flex items-center gap-1 font-semibold">
                                <Droplets className="size-3.5 text-primary" />
                                {captacao.tipoCaptacao}
                              </p>
                              <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-muted-foreground">
                                {captacao.processo ?? "Sem processo"}
                                {captacao.venceEm ? (
                                  <BadgeVencimento venceEm={captacao.venceEm} />
                                ) : (
                                  <EtiquetaStatus status={captacao.status} />
                                )}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <BotaoNovoDocumento
                          clienteId={cliente.id}
                          imoveis={opcoesImoveis}
                          imovelId={imovel.id}
                        />
                        <BotaoNovaCaptacao
                          clienteId={cliente.id}
                          imoveis={opcoesImoveis}
                          imovelId={imovel.id}
                        />
                        <BotaoEditarImovel
                          clienteId={cliente.id}
                          imovel={imovel}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SecaoMapas mapas={mapas} imoveis={opcoesImoveis} />

      <Card>
        <CardHeader>
          <CardTitle>Talhões — safra {SAFRA_ATUAL}</CardTitle>
          <CardDescription>
            Ficha completa exigida pela cliente: plantas/ha, espaçamento,
            variedade, ano de plantio, estado da lavoura, previsão{" "}
            {SAFRA_ATUAL.slice(2)} e colheita {SAFRA_ANTERIOR.slice(2)}.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {talhoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum talhão cadastrado para este cliente — use o botão
              &ldquo;Novo talhão&rdquo;.
            </p>
          ) : (
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
                  <TableHead className="text-right">
                    Prev. {SAFRA_ATUAL.slice(2)}
                  </TableHead>
                  <TableHead className="text-right">
                    Colh. {SAFRA_ANTERIOR.slice(2)}
                  </TableHead>
                  <TableHead>Poda/renovação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {talhoes.map((talhao) => (
                  <TableRow key={talhao.id}>
                    <TableCell className="font-semibold">
                      {talhao.nome}
                    </TableCell>
                    <TableCell className="text-sm">
                      {talhao.produtor ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-44 truncate text-sm text-muted-foreground">
                      {talhao.imovelNome}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatarArea(talhao.areaHa)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {talhao.plantasPorHa
                        ? numero.format(talhao.plantasPorHa)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {talhao.espacamento ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {talhao.variedade ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {talhao.anoPlantio ?? "—"}
                    </TableCell>
                    <TableCell>
                      {talhao.estadoLavoura ? (
                        <Badge
                          variant={
                            talhao.estadoLavoura === "Produção"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {talhao.estadoLavoura}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold">
                      {talhao.previsaoAtualSacas !== undefined
                        ? numero.format(talhao.previsaoAtualSacas)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {talhao.colheitaAnteriorSacas !== undefined
                        ? numero.format(talhao.colheitaAnteriorSacas)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {talhao.previsaoPodaRenovacao ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <BotaoEditarTalhao
                        clienteId={cliente.id}
                        imoveis={opcoesImoveis}
                        talhao={talhao}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comparativo entre safras</CardTitle>
          <CardDescription>
            Previsão × colheita efetiva (sacas de 60 kg) consolidadas por safra
            — histórico que a cliente mantém para entender gargalos de
            produção.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {comparativo.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há lançamentos de safra para este cliente — use o botão
              &ldquo;Lançar safra&rdquo;.
            </p>
          ) : (
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
                {comparativo.map((safra) => (
                  <TableRow key={safra.safra}>
                    <TableCell className="font-semibold">
                      {safra.safra}
                    </TableCell>
                    <TableCell className="text-right">
                      {safra.previsaoSacas !== null
                        ? numero.format(safra.previsaoSacas)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {safra.colheitaEfetivaSacas !== null
                        ? numero.format(safra.colheitaEfetivaSacas)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {safra.previsaoSacas && safra.colheitaEfetivaSacas
                        ? `${Math.round((safra.colheitaEfetivaSacas / safra.previsaoSacas) * 100)}%`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {safra.observacao ?? "—"}
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
