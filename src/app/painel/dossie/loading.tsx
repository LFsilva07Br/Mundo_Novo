import {
  EsqueletoCabecalho,
  EsqueletoTabela,
  EsqueletoTela,
} from "@/components/esqueletos-painel";
import { Skeleton } from "@/components/ui/skeleton";

export default function CarregandoDossie() {
  return (
    <EsqueletoTela rotulo="Carregando o dossiê do cliente…">
      <EsqueletoCabecalho />
      <Skeleton className="h-9 w-full max-w-sm rounded-lg" />
      <EsqueletoTabela linhas={4} colunas={4} />
      <EsqueletoTabela linhas={5} colunas={4} />
    </EsqueletoTela>
  );
}
