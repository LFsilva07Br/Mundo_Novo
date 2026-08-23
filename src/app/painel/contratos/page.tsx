import type { Metadata } from "next";
import {
  listarContratos,
  obterPerfilAtual,
} from "@/lib/certificacao/consultas";
import { listarContratosFinanceiros } from "@/lib/financeiro/consultas";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { enriquecerContratos } from "./enriquecimento";
import { VisaoContratos } from "./visao-contratos";

export const metadata: Metadata = {
  title: "Contratos & Alçada",
};

export default async function PaginaContratos() {
  const modoDemo = !hasSupabaseEnv();
  // O valor do contrato vive no financeiro: buscamos aqui, no servidor,
  // para quem decide ver valor, vigência e escopo sem trocar de tela.
  const [contratos, perfil, financeiros] = await Promise.all([
    listarContratos(),
    obterPerfilAtual(),
    listarContratosFinanceiros(),
  ]);

  return (
    <VisaoContratos
      contratos={enriquecerContratos(contratos, financeiros)}
      perfil={perfil}
      modoDemo={modoDemo}
    />
  );
}
