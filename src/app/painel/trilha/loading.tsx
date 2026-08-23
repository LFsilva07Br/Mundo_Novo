import {
  EsqueletoCabecalho,
  EsqueletoTabela,
  EsqueletoTela,
} from "@/components/esqueletos-painel";
import { Skeleton } from "@/components/ui/skeleton";

export default function CarregandoTrilha() {
  return (
    <EsqueletoTela rotulo="Carregando a trilha de auditoria…">
      <EsqueletoCabecalho comAcao={false} />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-48 rounded-lg" />
        <Skeleton className="h-9 w-48 rounded-lg" />
      </div>
      <EsqueletoTabela linhas={8} colunas={4} />
    </EsqueletoTela>
  );
}
