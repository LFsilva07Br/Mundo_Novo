import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Droplets } from "lucide-react";
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
import { listarGrupos, obterCliente } from "@/lib/carteira/consultas";
import { listarRegistrosContato } from "@/lib/carteira/registros";
import {
  ROTULO_FASE,
  ROTULO_NORMA,
  ROTULO_TIPO_REGISTRO,
} from "@/lib/carteira/tipos";
import { listarVisitas } from "@/lib/checklists/consultas";
import { formatarArea, formatarData } from "@/lib/vencimentos";
import { FormularioCliente } from "../formulario-cliente";
import { AuditoriasCliente } from "./auditorias-cliente";
import { ConvidarProdutor } from "./convidar-produtor";
import { ContatosCliente } from "./contatos-cliente";
import { FormularioRegistroContato } from "./formulario-registro-contato";

export async function generateMetadata({
  params,
}: PageProps<"/painel/clientes/[id]">): Promise<Metadata> {
  const { id } = await params;
  const cliente = await obterCliente(id);
  return { title: cliente?.nome ?? "Cliente" };
}

export default async function PaginaCliente({
  params,
}: PageProps<"/painel/clientes/[id]">) {
  const { id } = await params;
  const cliente = await obterCliente(id);
  if (!cliente) notFound();

  const [grupos, registros, visitas] = await Promise.all([
    listarGrupos(),
    listarRegistrosContato(cliente.id),
    listarVisitas(cliente.id),
  ]);
  const auditorias = visitas.filter((v) => v.status !== "em_andamento");
  const grupo = grupos.find((g) => g.id === cliente.grupoId);
  const areaTotal =
    cliente.imoveis?.reduce((s, i) => s + i.areaTotalHa, 0) ?? null;
  const areaCafe =
    cliente.imoveis?.reduce((s, i) => s + i.areaCafeHa, 0) ?? null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/painel/clientes"
        className="flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Todos os clientes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-extrabold tracking-tight">
            {cliente.nome}
            <Badge variant="outline">
              {cliente.tipo === "cadeia_suprimentos"
                ? "Cadeia de Suprimentos"
                : "Fazenda"}
            </Badge>
            {cliente.fase !== "ativo" ? (
              <Badge variant="secondary">{ROTULO_FASE[cliente.fase]}</Badge>
            ) : null}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {cliente.cidade} - {cliente.uf} · {cliente.regiao} ·{" "}
            {grupo ? grupo.nome : "Cliente direto (sem grupo)"}
            {cliente.produtor ? ` · Produtor: ${cliente.produtor}` : null}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <FormularioCliente grupos={grupos} cliente={cliente} />
            <ConvidarProdutor
              clienteId={cliente.id}
              nomeSugerido={cliente.produtor}
            />
          </div>
        </div>
        {typeof cliente.conformidade === "number" ? (
          <div className="rounded-2xl bg-secondary px-4 py-2 text-center">
            <p className="text-xl font-extrabold text-secondary-foreground">
              {cliente.conformidade}%
            </p>
            <p className="text-[11px] font-bold uppercase text-secondary-foreground/70">
              conformidade
            </p>
          </div>
        ) : null}
      </div>

      {areaTotal !== null && areaCafe !== null ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="py-4">
              <p className="text-xl font-extrabold">{formatarArea(areaTotal)}</p>
              <p className="text-xs font-semibold text-muted-foreground">
                área total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-xl font-extrabold">{formatarArea(areaCafe)}</p>
              <p className="text-xs font-semibold text-muted-foreground">
                área de café
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-xl font-extrabold">
                {cliente.imoveis?.length}
              </p>
              <p className="text-xs font-semibold text-muted-foreground">
                imóveis rurais
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-xl font-extrabold">
                {cliente.imoveis?.filter((i) => i.possuiCaptacaoAgua).length}
              </p>
              <p className="text-xs font-semibold text-muted-foreground">
                com captação de água
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Certificações</CardTitle>
          <CardDescription>
            Cada certificação tem vencimento e status independentes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {cliente.certificacoes.map((cert) => (
            <div
              key={cert.norma}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
            >
              <div>
                <p className="flex items-center gap-2 font-bold">
                  {ROTULO_NORMA[cert.norma]}
                  {cert.principal ? (
                    <Badge variant="secondary">Principal</Badge>
                  ) : null}
                </p>
                <p className="text-sm text-muted-foreground">
                  {cert.certificadora ?? "Certificadora a definir"}
                  {cert.status === "em_implantacao" ? " · em implantação" : null}
                </p>
              </div>
              <BadgeVencimento venceEm={cert.venceEm} />
            </div>
          ))}
        </CardContent>
      </Card>

      <AuditoriasCliente visitas={auditorias} />

      <ContatosCliente
        clienteId={cliente.id}
        contatos={cliente.contatos ?? []}
      />

      <Card>
        <CardHeader className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Registro de contatos</CardTitle>
            <CardDescription>
              Histórico de ligações, mensagens, reuniões e visitas feitas com o
              cliente.
            </CardDescription>
          </div>
          <FormularioRegistroContato clienteId={cliente.id} />
        </CardHeader>
        <CardContent>
          {registros.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Autor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registros.map((registro) => (
                  <TableRow key={registro.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatarData(new Date(registro.ocorridoEm))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {ROTULO_TIPO_REGISTRO[registro.tipo]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold">
                        {registro.assunto}
                        {registro.duracaoMinutos
                          ? ` · ${registro.duracaoMinutos} min`
                          : null}
                      </p>
                      {registro.detalhes ? (
                        <p className="max-w-96 text-xs text-muted-foreground">
                          {registro.detalhes}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">
                      {registro.autor ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum contato registrado ainda — use “Novo registro” para
              começar o histórico.
            </p>
          )}
        </CardContent>
      </Card>

      {cliente.imoveis?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Imóveis rurais</CardTitle>
            <CardDescription>
              CAR e matrícula pertencem ao imóvel — uma fazenda pode ter
              vários. Dados da planilha de controle ambiental.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imóvel</TableHead>
                  <TableHead>Proprietário(s)</TableHead>
                  <TableHead className="text-right">Área total</TableHead>
                  <TableHead className="text-right">Café</TableHead>
                  <TableHead className="text-right">Reserva</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Água</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cliente.imoveis.map((imovel) => (
                  <TableRow key={imovel.car ?? imovel.nome}>
                    <TableCell>
                      <p className="font-semibold">{imovel.nome}</p>
                      {imovel.car ? (
                        <p className="max-w-56 truncate font-mono text-[11px] text-muted-foreground">
                          {imovel.car}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="max-w-44 truncate text-sm">
                      {imovel.proprietarios}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatarArea(imovel.areaTotalHa)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatarArea(imovel.areaCafeHa)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {imovel.areaReservaHa
                        ? formatarArea(imovel.areaReservaHa)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {imovel.matriculas ?? "—"}
                    </TableCell>
                    <TableCell>
                      {imovel.possuiCaptacaoAgua ? (
                        <span className="flex items-center gap-1 text-sm font-semibold text-info">
                          <Droplets className="size-3.5" />
                          Sim
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Não</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">
          Os imóveis rurais e talhões deste cliente serão cadastrados nas
          próximas entregas da Fase 1.
        </p>
      )}
    </div>
  );
}
