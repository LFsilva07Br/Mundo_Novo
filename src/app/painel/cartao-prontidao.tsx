import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProntidaoCliente } from "@/lib/prontidao/consultas";

/**
 * Para onde levar quem clica numa pendência.
 *
 * A régua de prontidão descreve a pendência em texto de negócio; aqui esse
 * texto vira o destino de trabalho correspondente, para que o usuário saia
 * do diagnóstico direto para a tela onde resolve o problema.
 */
export function destinoDaPendencia(
  pendencia: string,
  clienteId: string,
): { href: string; acao: string } {
  const cliente = encodeURIComponent(clienteId);

  if (pendencia.startsWith("CAPA")) {
    return { href: "/painel/capas", acao: "Abrir CAPAs" };
  }
  if (pendencia.startsWith("Treinamento")) {
    return {
      href: `/painel/social?cliente=${cliente}`,
      acao: "Abrir treinamentos",
    };
  }
  if (pendencia.startsWith("Documento do imóvel")) {
    return {
      href: `/painel/imoveis?cliente=${cliente}`,
      acao: "Abrir documentos do imóvel",
    };
  }
  if (pendencia.startsWith("Sem auditoria interna")) {
    return { href: "/painel/visitas", acao: "Abrir visitas" };
  }
  // Certificação vencida, a vencer ou suspensa: resolve-se na ficha.
  return {
    href: `/painel/clientes/${cliente}`,
    acao: "Abrir ficha do cliente",
  };
}

/**
 * Cartão "Prontidão para auditoria" do dashboard: semáforo da carteira
 * (prontas × com pendências), o nome de quem já está pronta e as duas
 * principais pendências — clicáveis — de quem ainda não está.
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
      <CardContent className="space-y-4">
        {prontas.length > 0 ? (
          <div className="rounded-lg border border-success/30 bg-success/5 p-3">
            <p className="text-xs font-extrabold uppercase tracking-widest text-success">
              Prontas para a auditoria externa
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
              {prontas.map((cliente) => (
                <li key={cliente.clienteId} className="text-sm">
                  <Link
                    href={`/painel/clientes/${cliente.clienteId}`}
                    className="font-semibold hover:text-primary"
                  >
                    {cliente.clienteNome}
                  </Link>{" "}
                  <span className="font-extrabold text-success">
                    nota {cliente.nota}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

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
                  {cliente.pendencias.slice(0, 2).map((pendencia) => {
                    const destino = destinoDaPendencia(
                      pendencia,
                      cliente.clienteId,
                    );
                    return (
                      <li key={pendencia}>
                        <Link
                          href={destino.href}
                          title={destino.acao}
                          className="group flex items-start gap-1 rounded text-xs text-muted-foreground hover:text-primary"
                        >
                          <span aria-hidden>•</span>
                          <span className="underline decoration-dotted underline-offset-2">
                            {pendencia}
                          </span>
                          <span className="sr-only"> — {destino.acao}</span>
                          <ChevronRight
                            aria-hidden
                            className="mt-0.5 size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                          />
                        </Link>
                      </li>
                    );
                  })}
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
