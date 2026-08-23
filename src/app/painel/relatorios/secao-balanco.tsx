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
import type { BalancoCliente } from "@/lib/prontidao/balanco";

const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/**
 * Balanço de volume certificado da safra atual: previsão × sacas em lotes,
 * com alerta vermelho quando o cliente comprometeu mais café certificado
 * do que a previsão de produção (regra de rastreabilidade — RA cap. 2).
 */
export function SecaoBalanco({ balancos }: { balancos: BalancoCliente[] }) {
  const emEstouro = balancos.filter((b) => b.estouro);
  const safra = balancos[0]?.safra ?? "2025/26";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balanço de volume certificado — safra {safra}</CardTitle>
        <CardDescription>
          Previsão de safra (talhões) × sacas registradas em lotes. Pela
          regra de rastreabilidade (RA cap. 2), não se vende mais café
          certificado do que a fazenda produz.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {emEstouro.length > 0 ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm font-bold text-destructive">
            ALERTA: {emEstouro.length} cliente(s) com lotes acima da previsão
            de safra — risco de venda de café certificado além do produzido.
          </p>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Previsão (sacas)</TableHead>
              <TableHead className="text-right">Em lotes (sacas)</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead>Situação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {balancos.map((b) => (
              <TableRow
                key={b.clienteId}
                className={b.estouro ? "bg-destructive/5" : undefined}
              >
                <TableCell className="font-semibold">
                  {b.clienteNome}
                  <p className="text-xs font-normal text-muted-foreground">
                    {b.totalLotes} lote(s) válido(s)
                  </p>
                </TableCell>
                <TableCell className="text-right">
                  {numero.format(b.previsaoSacas)}
                </TableCell>
                <TableCell className="text-right">
                  {numero.format(b.sacasLotes)}
                </TableCell>
                <TableCell
                  className={`text-right font-bold ${
                    b.estouro ? "text-destructive" : "text-success"
                  }`}
                >
                  {numero.format(b.saldoSacas)}
                </TableCell>
                <TableCell>
                  {b.estouro ? (
                    <Badge variant="destructive">
                      Estouro — lotes acima da previsão
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      {b.percentualComprometido !== null
                        ? `${b.percentualComprometido}% comprometido`
                        : "sem previsão cadastrada"}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
