import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProntidaoCliente } from "@/lib/prontidao/consultas";

/**
 * Cartão "Prontidão para auditoria" do dashboard: semáforo da carteira
 * (prontas × com pendências) e as duas principais pendências de cada
 * cliente que ainda não está pronto para a auditoria externa.
 */
export function CartaoProntidao({
  carteira,
}: {
  carteira: ProntidaoCliente[];
}) {
  const prontas = carteira.filter((c) => c.pronta);
  const comPendencias = carteira.filter((c) => !c.pronta);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prontidão para auditoria</CardTitle>
        <CardDescription>
          Régua automática por cliente: certificados, CAPAs, documentos dos
          imóveis, treinamentos e auditoria interna anual.
        </CardDescription>
        <div className="flex flex-wrap gap-4 pt-1 text-sm font-bold">
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-full bg-success"
            />
            {prontas.length} pronta(s)
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-full bg-destructive"
            />
            {comPendencias.length} com pendências
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {comPendencias.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Toda a carteira está pronta para auditoria externa.
          </p>
        ) : (
          <ul className="space-y-3">
            {comPendencias.map((cliente) => (
              <li
                key={cliente.clienteId}
                className="rounded-lg border border-destructive/30 bg-destructive/5 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/painel/clientes/${cliente.clienteId}`}
                    className="font-semibold hover:text-primary"
                  >
                    {cliente.clienteNome}
                  </Link>
                  <span className="text-sm font-extrabold text-destructive">
                    nota {cliente.nota}
                  </span>
                </div>
                <ul className="mt-1 space-y-0.5">
                  {cliente.pendencias.slice(0, 2).map((pendencia) => (
                    <li
                      key={pendencia}
                      className="text-xs text-muted-foreground"
                    >
                      • {pendencia}
                    </li>
                  ))}
                  {cliente.pendencias.length > 2 ? (
                    <li className="text-xs font-semibold text-muted-foreground">
                      + {cliente.pendencias.length - 2} outra(s) pendência(s)
                    </li>
                  ) : null}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
