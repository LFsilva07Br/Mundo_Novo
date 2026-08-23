"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Componentes de exportação da tela de relatórios (Excel/PDF). */

type ParametrosExportacao = Record<string, string>;

function montarUrl(base: string, parametros: ParametrosExportacao): string {
  const query = new URLSearchParams(parametros);
  return `${base}?${query.toString()}`;
}

/** Par de botões Excel/PDF apontando direto ao route handler do relatório. */
export function BotoesExportar({
  base,
  parametros = {},
  rotuloExcel = "Excel",
  rotuloPdf = "PDF",
}: {
  base: string;
  parametros?: ParametrosExportacao;
  rotuloExcel?: string;
  rotuloPdf?: string;
}) {
  const estilo = cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5");
  return (
    <div className="flex flex-wrap gap-2">
      <a
        className={estilo}
        href={montarUrl(base, { ...parametros, formato: "xlsx" })}
        target="_blank"
        rel="noopener"
      >
        <FileSpreadsheet className="size-4" aria-hidden />
        {rotuloExcel}
      </a>
      <a
        className={estilo}
        href={montarUrl(base, { ...parametros, formato: "pdf" })}
        target="_blank"
        rel="noopener"
      >
        <FileText className="size-4" aria-hidden />
        {rotuloPdf}
      </a>
    </div>
  );
}

/**
 * Cartão "Relatório mensal por cliente" — o entregável que a consultoria
 * envia ao produtor. Seleciona o cliente e gera o PDF direto do handler.
 */
export function CartaoRelatorioMensal({
  clientes,
}: {
  clientes: { id: string; nome: string }[];
}) {
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? "");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório mensal por cliente</CardTitle>
        <CardDescription>
          O entregável da consultoria ao produtor: resumo do cliente,
          certificações e vencimentos, safra, CAPAs e treinamentos a vencer.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="cliente-relatorio-mensal">
          Cliente do relatório mensal
        </label>
        <select
          id="cliente-relatorio-mensal"
          value={clienteId}
          onChange={(evento) => setClienteId(evento.target.value)}
          className="h-9 min-w-56 flex-1 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:flex-none"
        >
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nome}
            </option>
          ))}
        </select>
        <a
          className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
          href={montarUrl("/api/relatorios/mensal", {
            formato: "pdf",
            cliente: clienteId,
          })}
          target="_blank"
          rel="noopener"
        >
          <FileDown className="size-4" aria-hidden />
          Gerar PDF mensal
        </a>
      </CardContent>
    </Card>
  );
}
