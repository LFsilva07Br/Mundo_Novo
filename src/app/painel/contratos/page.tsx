import type { Metadata } from "next";
import { VisaoContratos } from "./visao-contratos";

export const metadata: Metadata = {
  title: "Contratos & Alçada",
};

export default function PaginaContratos() {
  return <VisaoContratos />;
}
