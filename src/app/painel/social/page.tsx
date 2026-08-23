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
import { listarClientes } from "@/lib/carteira/consultas";
import {
  CLIENTE_PADRAO_SOCIAL,
  listarExamesCargo,
  listarMoradias,
  listarTrabalhadores,
  listarTreinamentos,
} from "@/lib/social/consultas";
import { formatarData } from "@/lib/vencimentos";
import { DialogoNovoTrabalhador } from "./dialogo-novo-trabalhador";
import { DialogoRegistrarTreinamento } from "./dialogo-registrar-treinamento";
import { SeletorCliente } from "./seletor-cliente";

export const metadata: Metadata = {
  title: "Social & Colaboradores",
};

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const EH_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function rotuloPeriodicidade(meses: number): string {
  if (meses === 12) return "Anual";
  if (meses === 24) return "Bienal";
  return `A cada ${meses} meses`;
}

export default async function PaginaSocial({
  searchParams,
}: PageProps<"/painel/social">) {
  const parametros = await searchParams;
  const parametroCliente = Array.isArray(parametros.cliente)
    ? parametros.cliente[0]
    : parametros.cliente;

  const clientes = await listarClientes();
  const clientePadrao =
    clientes.find((c) => c.id === CLIENTE_PADRAO_SOCIAL) ??
    clientes.find((c) => c.nome.includes("Alto da Serra")) ??
    clientes[0];
  const cliente =
    clientes.find((c) => c.id === parametroCliente) ?? clientePadrao;
  const clienteId = cliente?.id ?? CLIENTE_PADRAO_SOCIAL;
  // Nas ações, o cliente precisa ser um id real do banco (uuid).
  const clienteIdFormulario = EH_UUID.test(clienteId)
    ? clienteId
    : CLIENTE_PADRAO_SOCIAL;

  const [trabalhadores, moradias, treinamentos, examesCargo] =
    await Promise.all([
      listarTrabalhadores(clienteId),
      listarMoradias(clienteId),
      listarTreinamentos(clienteId),
      listarExamesCargo(),
    ]);

  const fixos = trabalhadores.filter((t) => t.vinculo === "fixo").length;
  const mulheres = trabalhadores.filter((t) => t.genero === "feminino").length;
  const homens = trabalhadores.length - mulheres;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Módulo social · {cliente?.nome ?? "Cliente"}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Social & Colaboradores
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Trabalhadores, moradias, treinamentos e exames do cliente.
            Vencimentos de treinamentos e exames entram no mesmo motor de
            alertas dos certificados.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeletorCliente
            clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))}
            clienteId={clienteId}
          />
          <DialogoNovoTrabalhador clienteId={clienteIdFormulario} />
          <DialogoRegistrarTreinamento
            treinamentos={treinamentos.map((t) => ({
              id: t.id,
              nome: t.nome,
              periodicidadeMeses: t.periodicidadeMeses,
            }))}
            trabalhadores={trabalhadores.map((t) => ({
              id: t.id,
              nome: t.nome,
            }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">{fixos}</p>
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
            <p className="text-xl font-extrabold">{moradias.length}</p>
            <p className="text-xs font-semibold text-muted-foreground">
              moradias na fazenda
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">{treinamentos.length}</p>
            <p className="text-xs font-semibold text-muted-foreground">
              treinamentos monitorados
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trabalhadores e funções</CardTitle>
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
              {trabalhadores.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-sm text-muted-foreground"
                  >
                    Nenhum trabalhador cadastrado para este cliente.
                  </TableCell>
                </TableRow>
              ) : null}
              {trabalhadores.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-semibold">
                    {t.nome}
                    {t.vinculo === "temporario" ? (
                      <span className="block text-xs font-normal text-muted-foreground">
                        Temporário
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.funcao}
                    {t.cbo ? (
                      <span className="block text-xs text-muted-foreground">
                        CBO {t.cbo}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {t.salario !== undefined ? moeda.format(t.salario) : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.admissao
                      ? formatarData(new Date(`${t.admissao}T12:00:00`))
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.moradia ? "Sim" : "Não"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.insalubridade || t.periculosidade ? (
                      <span className="flex flex-wrap gap-1">
                        {t.insalubridade ? (
                          <Badge variant="outline">Insalubridade 20%</Badge>
                        ) : null}
                        {t.periculosidade ? (
                          <Badge variant="outline">Periculosidade</Badge>
                        ) : null}
                      </span>
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
              Status calculado pelo vencimento real das participações — alerta
              antes de vencer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {treinamentos.map((t) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3"
              >
                <div>
                  <p className="text-sm font-bold">
                    {t.nome}
                    {t.norma ? ` (${t.norma})` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {rotuloPeriodicidade(t.periodicidadeMeses)} ·{" "}
                    {t.participantes}/{t.totalTrabalhadores} participantes
                    {t.ultimaRealizacao
                      ? ` · realizado ${formatarData(new Date(`${t.ultimaRealizacao}T12:00:00`))}`
                      : null}
                  </p>
                </div>
                {t.proximoVencimento ? (
                  <BadgeVencimento venceEm={t.proximoVencimento} />
                ) : (
                  <Badge variant="outline" className="text-warning">
                    Pendente de realização
                  </Badge>
                )}
              </div>
            ))}
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
              {moradias.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma moradia cadastrada para este cliente.
                </p>
              ) : null}
              {moradias.map((m) => (
                <div key={m.id} className="rounded-xl border p-3">
                  <p className="text-sm font-bold">
                    {m.nome} · {m.totalMoradores} morador
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
              {examesCargo.map((e) => (
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
