import type { Metadata } from "next";
import { listarClientes } from "@/lib/carteira/consultas";
import { listarVisitas } from "@/lib/checklists/consultas";
import { VisaoVisitas } from "./visao-visitas";

export const metadata: Metadata = {
  title: "Visitas & Ações",
};

export default async function PaginaVisitas() {
  const [visitas, clientes] = await Promise.all([
    listarVisitas(),
    listarClientes(),
  ]);

  return (
    <VisaoVisitas
      visitas={visitas}
      clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))}
    />
  );
}
