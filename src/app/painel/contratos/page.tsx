import type { Metadata } from "next";
import {
  listarContratos,
  obterPerfilAtual,
} from "@/lib/certificacao/consultas";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { VisaoContratos } from "./visao-contratos";

export const metadata: Metadata = {
  title: "Contratos & Alçada",
};

export default async function PaginaContratos() {
  const modoDemo = !hasSupabaseEnv();
  const [contratos, perfil] = await Promise.all([
    listarContratos(),
    obterPerfilAtual(),
  ]);

  return (
    <VisaoContratos contratos={contratos} perfil={perfil} modoDemo={modoDemo} />
  );
}
