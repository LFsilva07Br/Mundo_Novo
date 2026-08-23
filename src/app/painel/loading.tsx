import {
  EsqueletoCabecalho,
  EsqueletoIndicadores,
  EsqueletoTabela,
  EsqueletoTela,
} from "@/components/esqueletos-painel";

export default function CarregandoDashboard() {
  return (
    <EsqueletoTela rotulo="Carregando o painel da carteira…">
      <EsqueletoCabecalho />
      <EsqueletoIndicadores quantidade={5} className="lg:grid-cols-5" />
      <EsqueletoTabela linhas={4} colunas={3} />
      <EsqueletoTabela linhas={6} colunas={3} />
    </EsqueletoTela>
  );
}
