import {
  EsqueletoCabecalho,
  EsqueletoIndicadores,
  EsqueletoTabela,
  EsqueletoTela,
} from "@/components/esqueletos-painel";

export default function CarregandoImoveis() {
  return (
    <EsqueletoTela rotulo="Carregando os imóveis rurais e os talhões…">
      <EsqueletoCabecalho />
      <EsqueletoIndicadores quantidade={4} />
      <EsqueletoTabela linhas={5} colunas={5} />
      <EsqueletoTabela linhas={5} colunas={4} />
    </EsqueletoTela>
  );
}
