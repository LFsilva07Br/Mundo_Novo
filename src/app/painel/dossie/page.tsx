import type { Metadata } from "next";
import Link from "next/link";
import {
  Award,
  ClipboardCheck,
  FileText,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BadgeVencimento } from "@/components/badge-vencimento";
import { EstadoVazio } from "@/components/estado-vazio";
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
import {
  ROTULO_NORMA,
  type StatusCertificacao,
} from "@/lib/carteira/tipos";
import {
  ROTULO_STATUS_DOCUMENTO,
  ROTULO_TIPO_DOCUMENTO,
} from "@/lib/carteira/imoveis-esquemas";
import { listarCapas, type Capa } from "@/lib/certificacao/consultas";
import { listarVisitas } from "@/lib/checklists/consultas";
import { listarTreinamentos } from "@/lib/social/consultas";
import { formatarData } from "@/lib/vencimentos";
import { BarraDossie } from "./barra-dossie";

export const metadata: Metadata = {
  title: "Dossiê do cliente",
};

const ROTULO_STATUS_CERT: Record<StatusCertificacao, string> = {
  em_implantacao: "Em implantação",
  ativa: "Ativa",
  em_renovacao: "Em renovação",
  vencida: "Vencida",
  suspensa: "Suspensa",
};

const ROTULO_SEVERIDADE: Record<Capa["severidade"], string> = {
  menor: "Menor",
  maior: "Maior",
  critica: "Crítica",
};

const ROTULO_STATUS_CAPA: Record<Capa["status"], string> = {
  aberta: "Aberta",
  em_correcao: "Em correção",
  aguardando_evidencia: "Aguardando evidência",
  fechada: "Fechada",
};

function dataCurta(iso: string | null | undefined): string {
  if (!iso) return "—";
  return formatarData(new Date(iso.length === 10 ? `${iso}T12:00:00` : iso));
}

function primeiroValor(valor: string | string[] | undefined): string {
  return (Array.isArray(valor) ? valor[0] : valor) ?? "";
}

/** Estilo de impressão: sai o chrome do painel, fica só o dossiê. */
const CSS_IMPRESSAO = `
@media print {
  aside, header, .print\\:hidden { display: none !important; }
  main { padding: 0 !important; }
  body { background: white; }
  .dossie-card { break-inside: avoid; box-shadow: none !important; }
}
`;

export default async function PaginaDossie({
  searchParams,
}: PageProps<"/painel/dossie">) {
  const parametros = await searchParams;
  const parametroCliente = primeiroValor(parametros.cliente);
  const mostrarFechadas = primeiroValor(parametros.fechadas) === "1";

  const clientes = await listarClientes();
  const cliente =
    clientes.find((c) => c.id === parametroCliente) ?? clientes[0];
  if (!cliente) {
    return (
      <EstadoVazio
        icone={Users}
        titulo="Nenhum cliente na carteira ainda."
        descricao="Cadastre um cliente na carteira para começar a montar o dossiê."
      />
    );
  }

  const [visitas, todasCapas, imoveis, treinamentos] = await Promise.all([
    listarVisitas(cliente.id),
    listarCapas(),
    listarImoveisDoCliente(cliente.id),
    listarTreinamentos(cliente.id),
  ]);

  const visitasConcluidas = visitas.filter((v) => v.status !== "em_andamento");
  const capasDoCliente = todasCapas.filter((c) => c.cliente === cliente.nome);
  const capas = mostrarFechadas
    ? capasDoCliente
    : capasDoCliente.filter((c) => c.status !== "fechada");
  const fechadasOcultas = capasDoCliente.length - capas.length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <style>{CSS_IMPRESSAO}</style>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Dossiê consolidado · visão do auditor
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {cliente.nome}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {[cliente.cidade, cliente.uf].filter(Boolean).join(" · ")}
            {typeof cliente.conformidade === "number"
              ? ` · Conformidade atual: ${cliente.conformidade}%`
              : ""}
          </p>
        </div>
        <BarraDossie
          clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))}
          clienteId={cliente.id}
        />
      </div>

      <Card className="dossie-card">
        <CardHeader>
          <CardTitle>Certificações e vencimentos</CardTitle>
          <CardDescription>
            Normas do cliente com certificadora, status e prazo de validade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cliente.certificacoes.length === 0 ? (
            <EstadoVazio
              semMoldura
              icone={Award}
              titulo="Nenhuma certificação cadastrada."
              descricao="As normas do cliente aparecem aqui assim que forem cadastradas, com certificadora e vencimento."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Norma</TableHead>
                  <TableHead>Certificadora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vencimento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cliente.certificacoes.map((cert, indice) => (
                  <TableRow key={`${cert.norma}-${indice}`}>
                    <TableCell className="font-semibold">
                      {ROTULO_NORMA[cert.norma]}
                      {cert.principal ? (
                        <Badge variant="outline" className="ml-2">
                          Principal
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>{cert.certificadora ?? "—"}</TableCell>
                    <TableCell>{ROTULO_STATUS_CERT[cert.status]}</TableCell>
                    <TableCell>
                      <BadgeVencimento venceEm={cert.venceEm} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="dossie-card">
        <CardHeader>
          <CardTitle>Visitas concluídas</CardTitle>
          <CardDescription>
            Checklists aplicados em campo e escritório, com a conformidade
            apurada em cada visita.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visitasConcluidas.length === 0 ? (
            <EstadoVazio
              semMoldura
              icone={ClipboardCheck}
              titulo="Nenhuma visita concluída até aqui."
              descricao="Assim que uma visita de campo ou escritório for concluída, ela aparece aqui com a conformidade apurada."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visita</TableHead>
                  <TableHead>Concluída em</TableHead>
                  <TableHead className="text-right">Itens</TableHead>
                  <TableHead className="text-right">NCs</TableHead>
                  <TableHead className="text-right">Conformidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitasConcluidas.map((visita) => (
                  <TableRow key={visita.id}>
                    <TableCell className="font-semibold">
                      {visita.titulo}
                    </TableCell>
                    <TableCell>{dataCurta(visita.concluidaEm)}</TableCell>
                    <TableCell className="text-right">
                      {visita.respondidos}/{visita.totalItens}
                    </TableCell>
                    <TableCell className="text-right">
                      {visita.naoConformes}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {visita.conformidade !== null
                        ? `${visita.conformidade}%`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="dossie-card">
        <CardHeader>
          <CardTitle>CAPAs — planos de ação</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            {mostrarFechadas
              ? "Histórico completo, incluindo CAPAs fechadas."
              : fechadasOcultas > 0
                ? `${fechadasOcultas} CAPA(s) fechada(s) oculta(s).`
                : "Somente CAPAs em aberto."}
            <Link
              href={
                mostrarFechadas
                  ? `/painel/dossie?cliente=${cliente.id}`
                  : `/painel/dossie?cliente=${cliente.id}&fechadas=1`
              }
              className="font-semibold text-primary underline underline-offset-2 print:hidden"
            >
              {mostrarFechadas ? "Ocultar fechadas" : "Mostrar fechadas"}
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {capas.length === 0 ? (
            <EstadoVazio
              semMoldura
              icone={ShieldCheck}
              titulo="Nenhuma CAPA para mostrar — bom sinal."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Não conformidade</TableHead>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {capas.map((capa) => (
                  <TableRow key={capa.id}>
                    <TableCell className="font-bold">#{capa.numero}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {capa.descricao}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          capa.severidade === "critica"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {ROTULO_SEVERIDADE[capa.severidade]}
                      </Badge>
                    </TableCell>
                    <TableCell>{dataCurta(capa.prazo)}</TableCell>
                    <TableCell>{ROTULO_STATUS_CAPA[capa.status]}</TableCell>
                    <TableCell className="text-right">
                      {capa.acoes.filter((a) => a.concluida).length}/
                      {capa.acoes.length}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="dossie-card">
        <CardHeader>
          <CardTitle>Documentos dos imóveis rurais</CardTitle>
          <CardDescription>
            CAR, matrículas, licenças e outorgas — cada documento pertence ao
            imóvel, não à fazenda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {imoveis.length === 0 ? (
            <EstadoVazio
              semMoldura
              icone={FileText}
              titulo="Nenhum imóvel cadastrado."
              descricao="CAR, matrícula, licenças e outorgas aparecem aqui após o cadastro do imóvel rural."
            />
          ) : (
            imoveis.map((imovel) => (
              <div key={imovel.id} className="space-y-2">
                <p className="text-sm font-bold">
                  {imovel.nome}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {imovel.areaTotalHa} ha
                  </span>
                </p>
                {imovel.documentos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sem documentos cadastrados.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Documento</TableHead>
                        <TableHead>Identificação</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Vencimento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {imovel.documentos.map((documento) => (
                        <TableRow key={documento.id}>
                          <TableCell className="font-semibold">
                            {ROTULO_TIPO_DOCUMENTO[documento.tipo]}
                          </TableCell>
                          <TableCell className="max-w-40 truncate">
                            {documento.identificacao ?? "—"}
                          </TableCell>
                          <TableCell>
                            {ROTULO_STATUS_DOCUMENTO[documento.status]}
                          </TableCell>
                          <TableCell>
                            {documento.venceEm ? (
                              <BadgeVencimento venceEm={documento.venceEm} />
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="dossie-card">
        <CardHeader>
          <CardTitle>Treinamentos da equipe</CardTitle>
          <CardDescription>
            Cobertura dos treinamentos obrigatórios e o próximo vencimento de
            cada um.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {treinamentos.length === 0 ? (
            <EstadoVazio
              semMoldura
              icone={GraduationCap}
              titulo="Nenhum treinamento cadastrado."
              descricao="A cobertura da equipe aparece aqui após o primeiro treinamento registrado."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Treinamento</TableHead>
                  <TableHead className="text-right">Participantes</TableHead>
                  <TableHead>Última turma</TableHead>
                  <TableHead>Próximo vencimento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {treinamentos.map((treinamento) => (
                  <TableRow key={treinamento.id}>
                    <TableCell className="font-semibold">
                      {treinamento.nome}
                    </TableCell>
                    <TableCell className="text-right">
                      {treinamento.participantes}/
                      {treinamento.totalTrabalhadores}
                    </TableCell>
                    <TableCell>
                      {dataCurta(treinamento.ultimaRealizacao)}
                    </TableCell>
                    <TableCell>
                      <BadgeVencimento venceEm={treinamento.proximoVencimento} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Documento somente leitura, gerado a partir dos dados vivos do sistema
        — nada aqui pode ser alterado nesta tela.
      </p>
    </div>
  );
}
