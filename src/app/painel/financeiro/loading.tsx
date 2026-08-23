import {
  EsqueletoCabecalho,
  EsqueletoIndicadores,
  EsqueletoTabela,
  EsqueletoTela,
} from "@/components/esqueletos-painel";

export default function CarregandoFinanceiro() {
  return (
    <EsqueletoTela rotulo="Carregando o financeiro da consultoria…">
      <EsqueletoCabecalho />
      <EsqueletoIndicadores quantidade={4} className="xl:grid-cols-4" />
      <EsqueletoTabela linhas={5} colunas={5} />
      <EsqueletoTabela linhas={4} colunas={4} />
    </EsqueletoTela>
  );
}
