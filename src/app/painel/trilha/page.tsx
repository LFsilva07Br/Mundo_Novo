import type { Metadata } from "next";
import { Lock } from "lucide-react";
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
import { listarEventosTrilha } from "@/lib/trilha/consultas";
import {
  rotuloAcao,
  rotuloTabela,
  type AcaoTrilha,
} from "@/lib/trilha/registro";
import { FiltrosTrilha } from "./filtros";

export const metadata: Metadata = {
  title: "Trilha de auditoria",
};

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const VARIANTE_ACAO: Record<AcaoTrilha, "default" | "secondary" | "destructive"> =
  {
    inserir: "default",
    atualizar: "secondary",
    remover: "destructive",
  };

function primeiroValor(valor: string | string[] | undefined): string {
  return (Array.isArray(valor) ? valor[0] : valor) ?? "";
}

export default async function PaginaTrilha({
  searchParams,
}: PageProps<"/painel/trilha">) {
  const parametros = await searchParams;
  const filtroTabela = primeiroValor(parametros.tabela);
  const filtroAcao = primeiroValor(parametros.acao);

  const eventos = await listarEventosTrilha(200);
  const filtrados = eventos.filter(
    (evento) =>
      (!filtroTabela || evento.tabela === filtroTabela) &&
      (!filtroAcao || evento.acao === filtroAcao),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Confiança & rastreabilidade
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Trilha de auditoria
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quem fez o quê e quando, nas tabelas críticas do sistema — gravado
            automaticamente pelo banco a cada criação, alteração ou remoção.
          </p>
        </div>
        <FiltrosTrilha tabela={filtroTabela} acao={filtroAcao} />
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm font-semibold text-warning">
        <Lock className="size-4 shrink-0" aria-hidden />
        Registro imutável — os eventos da trilha não podem ser editados nem
        apagados, por ninguém.
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos {eventos.length} eventos</CardTitle>
          <CardDescription>
            {filtroTabela || filtroAcao
              ? `${filtrados.length} evento(s) com os filtros aplicados.`
              : "Os 200 eventos mais recentes, do mais novo para o mais antigo."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filtrados.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum evento encontrado com os filtros escolhidos.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data e hora</TableHead>
                  <TableHead>Tabela</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((evento) => (
                  <TableRow key={evento.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {dataHora.format(new Date(evento.ocorridoEm))}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {rotuloTabela(evento.tabela)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={VARIANTE_ACAO[evento.acao]}>
                        {rotuloAcao(evento.acao)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {evento.autor ?? (
                        <span className="text-muted-foreground">Sistema</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {evento.resumo ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
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
