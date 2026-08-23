import {
  EsqueletoCabecalho,
  EsqueletoCartoes,
  EsqueletoTela,
} from "@/components/esqueletos-painel";
import { Skeleton } from "@/components/ui/skeleton";

export default function CarregandoClientes() {
  return (
    <EsqueletoTela rotulo="Carregando a carteira de clientes…">
      <EsqueletoCabecalho />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-full max-w-sm rounded-lg" />
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>
      <EsqueletoCartoes quantidade={6} />
    </EsqueletoTela>
  );
}
