import type { Metadata } from "next";
import { Recycle, SprayCan } from "lucide-react";
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
import { EstadoVazio, EstadoVazioLinha } from "@/components/estado-vazio";
import { listarClientes } from "@/lib/carteira/consultas";
import { listarTalhoes } from "@/lib/carteira/imoveis-consultas";
import { listarTrabalhadores } from "@/lib/social/consultas";
import {
  CLIENTE_PADRAO_AGRO,
  listarAplicacoes,
  listarDestinacoes,
  listarProdutos,
  type AplicacaoRegistro,
} from "@/lib/agro/consultas";
import { formatarData } from "@/lib/vencimentos";
import { CatalogoProdutos } from "./catalogo-produtos";
import { DialogoNovaAplicacao } from "./dialogo-nova-aplicacao";
import { DialogoNovoProduto } from "./dialogo-novo-produto";
import { DialogoRegistrarDestinacao } from "./dialogo-registrar-destinacao";
import { SeletorCliente } from "./seletor-cliente";

export const metadata: Metadata = {
  title: "Agroquímicos",
};

const EH_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function dataCurta(iso: string): string {
  return formatarData(new Date(`${iso}T12:00:00`));
}

function BadgesDaAplicacao({ aplicacao }: { aplicacao: AplicacaoRegistro }) {
  if (aplicacao.alertas.length === 0) {
    return (
      <Badge variant="outline" className="text-primary">
        Em conformidade
      </Badge>
    );
  }
  return (
    <span className="flex flex-wrap gap-1">
      {aplicacao.produtoProibido ? (
        <Badge variant="destructive">Produto proibido pela RA</Badge>
      ) : null}
      {aplicacao.treinamentoAplicador === "vencido" ? (
        <Badge variant="outline" className="bg-warning/10 text-warning">
          Treinamento NR-31 vencido
        </Badge>
      ) : null}
      {aplicacao.treinamentoAplicador === "sem-registro" ? (
        <Badge variant="outline" className="bg-warning/10 text-warning">
          Sem registro de treinamento
        </Badge>
      ) : null}
    </span>
  );
}

export default async function PaginaAgro({
  searchParams,
}: PageProps<"/painel/agro">) {
  const parametros = await searchParams;
  const parametroCliente = Array.isArray(parametros.cliente)
    ? parametros.cliente[0]
    : parametros.cliente;

  const clientes = await listarClientes();
  const clientePadrao =
    clientes.find((c) => c.id === CLIENTE_PADRAO_AGRO) ??
    clientes.find((c) => c.nome.includes("Alto da Serra")) ??
    clientes[0];
  const cliente =
    clientes.find((c) => c.id === parametroCliente) ?? clientePadrao;
  const clienteId = cliente?.id ?? CLIENTE_PADRAO_AGRO;
  // Nas ações, o cliente precisa ser um id real do banco (uuid).
  const clienteIdFormulario = EH_UUID.test(clienteId)
    ? clienteId
    : CLIENTE_PADRAO_AGRO;

  const [produtos, aplicacoes, destinacoes, panorama, trabalhadores] =
    await Promise.all([
      listarProdutos(),
      listarAplicacoes(clienteId),
      listarDestinacoes(clienteId),
      listarTalhoes(clienteId),
      listarTrabalhadores(clienteId),
    ]);

  const anoAtual = String(new Date().getFullYear());
  const aplicacoesNoAno = aplicacoes.filter((a) =>
    a.data.startsWith(anoAtual),
  ).length;
  const comTreinamentoValido = aplicacoes.filter(
    (a) => a.treinamentoAplicador === "valido",
  ).length;
  const percentualTreinamento =
    aplicacoes.length > 0
      ? Math.round((comTreinamentoValido / aplicacoes.length) * 100)
      : null;
  const aplicacoesProibidas = aplicacoes.filter(
    (a) => a.produtoProibido,
  ).length;
  const embalagensDestinadas = destinacoes.reduce(
    (total, d) => total + (d.quantidade ?? 0),
    0,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Módulo agro · {cliente?.nome ?? "Cliente"}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Agroquímicos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aplicações de defensivos, lista de banidos da RA, treinamento
            NR-31 dos aplicadores e destinação de embalagens — a NC mais
            comum da carteira, vigiada de perto.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeletorCliente
            clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))}
            clienteId={clienteId}
          />
          <DialogoNovoProduto />
          <DialogoRegistrarDestinacao clienteId={clienteIdFormulario} />
          <DialogoNovaAplicacao
            clienteId={clienteIdFormulario}
            talhoes={panorama.talhoes.map((t) => ({
              id: t.id,
              nome: t.nome,
              imovelNome: t.imovelNome,
            }))}
            produtos={produtos.map((p) => ({
              id: p.id,
              nome: p.nome,
              proibidoRa: p.proibidoRa,
            }))}
            aplicadores={trabalhadores.map((t) => ({
              id: t.id,
              nome: t.nome,
            }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">{aplicacoesNoAno}</p>
            <p className="text-xs font-semibold text-muted-foreground">
              aplicações no ano
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">
              {percentualTreinamento !== null
                ? `${percentualTreinamento}%`
                : "—"}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              com treinamento NR-31 válido
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p
              className={`text-xl font-extrabold ${
                aplicacoesProibidas > 0 ? "text-destructive" : "text-primary"
              }`}
            >
              {aplicacoesProibidas}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              produtos proibidos usados (meta: 0)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">{embalagensDestinadas}</p>
            <p className="text-xs font-semibold text-muted-foreground">
              embalagens destinadas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aplicações de defensivos</CardTitle>
          <CardDescription>
            Cada aplicação é conferida contra a lista de banidos da RA e o
            treinamento NR-31 do aplicador na data — irregularidade vira
            alerta crítico na agenda.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Talhão · Imóvel</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Dose</TableHead>
                <TableHead>Aplicador</TableHead>
                <TableHead>Equipamento</TableHead>
                <TableHead>Conformidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aplicacoes.length === 0 ? (
                <EstadoVazioLinha
                  colunas={7}
                  icone={SprayCan}
                  titulo="Nenhuma aplicação registrada para este cliente."
                />
              ) : null}
              {aplicacoes.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-sm">{dataCurta(a.data)}</TableCell>
                  <TableCell className="text-sm">
                    <span className="font-semibold">{a.talhaoNome}</span>
                    <span className="block text-xs text-muted-foreground">
                      {a.imovelNome}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-semibold">
                    {a.produtoNome}
                  </TableCell>
                  <TableCell className="text-sm">{a.dose ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {a.aplicadorNome ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {a.equipamento ?? "—"}
                  </TableCell>
                  <TableCell>
                    <BadgesDaAplicacao aplicacao={a} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <CatalogoProdutos
          produtos={produtos.map((p) => ({
            id: p.id,
            nome: p.nome,
            ingredienteAtivo: p.ingredienteAtivo,
            proibidoRa: p.proibidoRa,
            observacao: p.observacao,
          }))}
        />

        <Card>
          <CardHeader>
            <CardTitle>Destinação de embalagens</CardTitle>
            <CardDescription>
              Devoluções de embalagens tríplice lavadas, com comprovante no
              cofre de evidências.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {destinacoes.length === 0 ? (
              <EstadoVazio
                icone={Recycle}
                titulo="Nenhuma destinação registrada para este cliente."
              />
            ) : null}
            {destinacoes.map((d) => (
              <div
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3"
              >
                <div>
                  <p className="text-sm font-bold">
                    {dataCurta(d.data)}
                    {d.quantidade !== undefined
                      ? ` · ${d.quantidade} embalagens`
                      : ""}
                  </p>
                  {d.descricao ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {d.descricao}
                    </p>
                  ) : null}
                </div>
                {d.comprovanteCaminho ? (
                  <Badge variant="outline" className="text-primary">
                    Com comprovante
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-warning/10 text-warning">
                    Sem comprovante
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
