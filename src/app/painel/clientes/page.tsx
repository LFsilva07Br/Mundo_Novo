import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { listarClientes, listarGrupos } from "@/lib/carteira/consultas";
import { avaliarCarteira } from "@/lib/prontidao/consultas";
import { FormularioCliente } from "./formulario-cliente";
import { ListaClientes } from "./lista-clientes";

export const metadata: Metadata = {
  title: "Clientes",
};

export default async function PaginaClientes() {
  const [clientes, grupos, prontidao] = await Promise.all([
    listarClientes(),
    listarGrupos(),
    avaliarCarteira(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Carteira
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Clientes — Fazendas e Cadeias de Suprimento
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{clientes.length} clientes ativos</Badge>
          <FormularioCliente grupos={grupos} />
        </div>
      </div>

      <ListaClientes
        clientes={clientes}
        grupos={grupos}
        prontidao={prontidao.map((p) => ({
          clienteId: p.clienteId,
          pronta: p.pronta,
          nota: p.nota,
          pendencias: p.pendencias,
        }))}
      />
    </div>
  );
}
