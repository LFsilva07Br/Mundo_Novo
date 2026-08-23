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
import { ROTULO_ORIGEM, type VisitaResumo } from "@/lib/checklists/tipos";
import { formatarData } from "@/lib/vencimentos";

/**
 * Histórico de auditorias do cliente: visitas de checklist concluídas, com a
 * conformidade apurada em cada uma — a média delas alimenta o indicador de
 * conformidade do cliente.
 */
export function AuditoriasCliente({ visitas }: { visitas: VisitaResumo[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Auditorias realizadas</CardTitle>
        <CardDescription>
          Visitas de checklist concluídas — a conformidade do cliente é a média
          destes resultados.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {visitas.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Auditoria</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-right">Conformidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visitas.map((visita) => (
                <TableRow key={visita.id}>
                  <TableCell className="font-semibold">
                    {visita.titulo}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatarData(
                      new Date(visita.concluidaEm ?? visita.iniciadaEm),
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {ROTULO_ORIGEM[visita.origem]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm font-bold">
                    {visita.conformidade !== null
                      ? `${visita.conformidade}%`
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma auditoria concluída ainda — as visitas de checklist
            finalizadas aparecerão aqui.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
