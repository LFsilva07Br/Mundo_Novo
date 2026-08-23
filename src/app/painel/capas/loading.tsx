import {
  EsqueletoCabecalho,
  EsqueletoIndicadores,
  EsqueletoTabela,
  EsqueletoTela,
} from "@/components/esqueletos-painel";
import { Skeleton } from "@/components/ui/skeleton";

export default function CarregandoCapas() {
  return (
    <EsqueletoTela
      rotulo="Carregando os planos de ação (CAPA)…"
      className="max-w-5xl"
    >
      <EsqueletoCabecalho />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <EsqueletoIndicadores quantidade={3} className="sm:grid-cols-3" />
      <EsqueletoTabela linhas={6} colunas={5} />
    </EsqueletoTela>
  );
}
