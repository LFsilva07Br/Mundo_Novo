import type { Metadata } from "next";
import { listarClientes } from "@/lib/carteira/consultas";
import {
  financeiroPronto,
  listarContratosFinanceiros,
  listarFaturas,
} from "@/lib/financeiro/consultas";
import { VisaoFinanceiro } from "./visao-financeiro";

export const metadata: Metadata = {
  title: "Financeiro",
};

function hojeISO(): string {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

export default async function PaginaFinanceiro() {
  const [pronto, contratos, faturas, clientes] = await Promise.all([
    financeiroPronto(),
    listarContratosFinanceiros(),
    listarFaturas(),
    listarClientes(),
  ]);

  return (
    <VisaoFinanceiro
      contratos={contratos}
      faturas={faturas}
      clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))}
      hoje={hojeISO()}
      modoPreparado={!pronto}
    />
  );
}
