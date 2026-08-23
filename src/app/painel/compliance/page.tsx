import type { Metadata } from "next";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listarClientes } from "@/lib/carteira/consultas";
import {
  CLIENTE_PADRAO_COMPLIANCE,
  listarCasos,
  listarQueixas,
  obterPlanoGestao,
  type CasoRegistro,
  type QueixaRegistro,
} from "@/lib/compliance/consultas";
import {
  ROTULOS_STATUS_CASO,
  ROTULOS_TIPO_CASO,
} from "@/lib/compliance/validacao";
import { formatarData } from "@/lib/vencimentos";
import { DialogoNovoCaso } from "./dialogo-novo-caso";
import { DialogoStatusCaso } from "./dialogo-status-caso";
import { DialogoTratarQueixa } from "./dialogo-tratar-queixa";
import { DialogoTriagemQueixa } from "./dialogo-triagem-queixa";
import { EditorPlano } from "./editor-plano";
import { LinkCanalQueixas } from "./link-canal-queixas";

export const metadata: Metadata = {
  title: "Compliance Social",
};

const EH_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function dataCurta(iso: string): string {
  return formatarData(new Date(`${iso.slice(0, 10)}T12:00:00`));
}

/** Tipos mais graves da norma em vermelho; demais em alerta ou neutro. */
function BadgeTipoCaso({ tipo }: { tipo: CasoRegistro["tipo"] }) {
  if (tipo === "trabalho_infantil" || tipo === "trabalho_forcado") {
    return <Badge variant="destructive">{ROTULOS_TIPO_CASO[tipo]}</Badge>;
  }
  if (tipo === "discriminacao" || tipo === "assedio") {
    return (
      <Badge variant="outline" className="bg-warning/10 text-warning">
        {ROTULOS_TIPO_CASO[tipo]}
      </Badge>
    );
  }
  return <Badge variant="outline">{ROTULOS_TIPO_CASO[tipo]}</Badge>;
}

function BadgeStatusCaso({ status }: { status: CasoRegistro["status"] }) {
  if (status === "aberto") {
    return <Badge variant="destructive">{ROTULOS_STATUS_CASO.aberto}</Badge>;
  }
  if (status === "em_remediacao") {
    return (
      <Badge variant="outline" className="bg-warning/10 text-warning">
        {ROTULOS_STATUS_CASO.em_remediacao}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-primary">
      {ROTULOS_STATUS_CASO.encerrado}
    </Badge>
  );
}

const ROTULO_STATUS_QUEIXA: Record<QueixaRegistro["status"], string> = {
  recebida: "Recebida",
  em_analise: "Em análise",
  tratada: "Tratada",
};

function BadgeStatusQueixa({ status }: { status: QueixaRegistro["status"] }) {
  if (status === "recebida") {
    return <Badge variant="destructive">{ROTULO_STATUS_QUEIXA.recebida}</Badge>;
  }
  if (status === "em_analise") {
    return (
      <Badge variant="outline" className="bg-warning/10 text-warning">
        {ROTULO_STATUS_QUEIXA.em_analise}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-primary">
      {ROTULO_STATUS_QUEIXA.tratada}
    </Badge>
  );
}

export default async function PaginaCompliance({
  searchParams,
}: PageProps<"/painel/compliance">) {
  const parametros = await searchParams;
  const parametroCliente = Array.isArray(parametros.cliente)
    ? parametros.cliente[0]
    : parametros.cliente;
  const parametroAno = Array.isArray(parametros.ano)
    ? parametros.ano[0]
    : parametros.ano;
  const parametroAba = Array.isArray(parametros.aba)
    ? parametros.aba[0]
    : parametros.aba;

  const clientes = await listarClientes();
  const clientePadrao =
    clientes.find((c) => c.id === CLIENTE_PADRAO_COMPLIANCE) ??
    clientes.find((c) => c.nome.includes("Alto da Serra")) ??
    clientes[0];
  const cliente =
    clientes.find((c) => c.id === parametroCliente) ?? clientePadrao;
  const clienteId = cliente?.id ?? CLIENTE_PADRAO_COMPLIANCE;
  // Nas ações, o cliente precisa ser um id real do banco (uuid).
  const paraFormulario = (id: string) =>
    EH_UUID.test(id) ? id : CLIENTE_PADRAO_COMPLIANCE;

  const anoAtual = new Date().getFullYear();
  const ano = /^\d{4}$/.test(parametroAno ?? "")
    ? Number(parametroAno)
    : anoAtual;

  const [casos, queixas, plano] = await Promise.all([
    listarCasos(),
    listarQueixas(),
    obterPlanoGestao(clienteId, ano),
  ]);

  const casosNaoEncerrados = casos.filter((c) => c.status !== "encerrado");
  const queixasNaFila = queixas.filter((q) => q.status === "recebida");
  const metasConcluidas = (plano?.metas ?? []).filter((m) => m.concluida).length;

  const abaInicial = ["casos", "queixas", "plano"].includes(parametroAba ?? "")
    ? (parametroAba as string)
    : "casos";

  const opcoesCliente = clientes.map((c) => ({ id: c.id, nome: c.nome }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Norma RA · cap. 5.1, 1.3 e 1.5.1
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Compliance Social
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Avaliar-e-tratar de casos sociais, canal de queixas acessível e
            anônimo e o plano de gestão anual com avaliação de riscos.
          </p>
        </div>
        <DialogoNovoCaso
          clientes={opcoesCliente.map((c) => ({
            id: paraFormulario(c.id),
            nome: c.nome,
          }))}
          clienteId={paraFormulario(clienteId)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p
              className={`text-xl font-extrabold ${
                casosNaoEncerrados.length > 0 ? "text-warning" : "text-primary"
              }`}
            >
              {casosNaoEncerrados.length}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              casos em aberto ou remediação
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p
              className={`text-xl font-extrabold ${
                queixasNaFila.length > 0 ? "text-destructive" : "text-primary"
              }`}
            >
              {queixasNaFila.length}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              queixas aguardando triagem
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">
              {plano ? `${metasConcluidas}/${plano.metas.length}` : "—"}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              metas concluídas no plano {ano}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={abaInicial}>
        <TabsList>
          <TabsTrigger value="casos">Casos</TabsTrigger>
          <TabsTrigger value="queixas">Queixas</TabsTrigger>
          <TabsTrigger value="plano">Plano de gestão</TabsTrigger>
        </TabsList>

        <TabsContent value="casos">
          <Card>
            <CardHeader>
              <CardTitle>Casos sociais (avaliar-e-tratar)</CardTitle>
              <CardDescription>
                Todo caso identificado — por monitoramento, queixa ou
                auditoria — é registrado e só encerra com a remediação
                comprovada.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {casos.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-sm text-muted-foreground"
                      >
                        Nenhum caso social registrado — bom sinal, desde que o
                        monitoramento esteja ativo.
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {casos.map((caso) => (
                    <TableRow key={caso.id}>
                      <TableCell className="text-sm font-semibold">
                        {caso.clienteNome}
                        <span className="block text-xs font-normal text-muted-foreground">
                          {dataCurta(caso.criadoEm)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <BadgeTipoCaso tipo={caso.tipo} />
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {caso.origem}
                      </TableCell>
                      <TableCell className="max-w-md text-sm">
                        {caso.descricao}
                        {caso.remediacao ? (
                          <span className="mt-1 block text-xs text-muted-foreground">
                            Remediação: {caso.remediacao}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <BadgeStatusCaso status={caso.status} />
                      </TableCell>
                      <TableCell>
                        <DialogoStatusCaso
                          casoId={caso.id}
                          statusAtual={caso.status}
                          remediacaoAtual={caso.remediacao}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queixas">
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Fila de queixas</CardTitle>
                <CardDescription>
                  Queixas do canal público. Triagem converte em caso social
                  vinculado; a queixa só é tratada com o caso encerrado ou
                  justificativa.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {queixas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma queixa recebida até agora.
                  </p>
                ) : null}
                {queixas.map((queixa) => (
                  <div key={queixa.id} className="space-y-2 rounded-xl border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <BadgeStatusQueixa status={queixa.status} />
                      <Badge variant="outline">
                        {queixa.anonima ? "Anônima" : "Identificada"}
                      </Badge>
                      {queixa.casoId ? (
                        <Badge variant="outline" className="text-muted-foreground">
                          Caso vinculado
                          {queixa.casoStatus
                            ? ` · ${ROTULOS_STATUS_CASO[queixa.casoStatus].toLowerCase()}`
                            : ""}
                        </Badge>
                      ) : null}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {queixa.clienteNome} · {dataCurta(queixa.criadoEm)}
                      </span>
                    </div>
                    <p className="text-sm">{queixa.mensagem}</p>
                    {!queixa.anonima && queixa.contato ? (
                      <p className="text-xs text-muted-foreground">
                        Contato para retorno: {queixa.contato}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      {queixa.status === "recebida" ? (
                        <DialogoTriagemQueixa
                          queixaId={queixa.id}
                          clienteId={paraFormulario(queixa.clienteId)}
                          mensagem={queixa.mensagem}
                        />
                      ) : null}
                      {queixa.status !== "tratada" ? (
                        <DialogoTratarQueixa
                          queixaId={queixa.id}
                          casoStatus={queixa.casoStatus}
                        />
                      ) : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Canal público por cliente</CardTitle>
                <CardDescription>
                  Cada cliente tem um link próprio, sem login e com anonimato
                  — divulgue no cartaz do quadro de avisos da fazenda
                  (exigência 1.5.1).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LinkCanalQueixas
                  clientes={opcoesCliente}
                  clienteInicial={clienteId}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="plano">
          <EditorPlano
            key={`${clienteId}-${ano}`}
            clientes={opcoesCliente}
            clienteId={clienteId}
            clienteIdFormulario={paraFormulario(clienteId)}
            ano={ano}
            riscosIniciais={plano?.riscos ?? []}
            metasIniciais={plano?.metas ?? []}
            observacaoInicial={plano?.observacao}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
