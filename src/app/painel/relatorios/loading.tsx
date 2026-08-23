import {
  EsqueletoCabecalho,
  EsqueletoTabela,
  EsqueletoTela,
} from "@/components/esqueletos-painel";

export default function CarregandoRelatorios() {
  return (
    <EsqueletoTela rotulo="Carregando os relatórios da carteira…">
      <EsqueletoCabecalho />
      <EsqueletoTabela linhas={5} colunas={5} />
      <div className="grid gap-6 lg:grid-cols-2">
        <EsqueletoTabela linhas={4} colunas={3} />
        <EsqueletoTabela linhas={4} colunas={3} />
      </div>
    </EsqueletoTela>
  );
}
