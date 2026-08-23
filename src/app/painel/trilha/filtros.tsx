"use client";

import { useRouter } from "next/navigation";
import { ROTULO_ACAO_TRILHA, ROTULO_TABELA_TRILHA } from "@/lib/trilha/registro";

/** Filtros da trilha — trocam os parâmetros ?tabela= e ?acao= da URL. */
export function FiltrosTrilha({
  tabela,
  acao,
}: {
  tabela: string;
  acao: string;
}) {
  const router = useRouter();

  function navegar(novaTabela: string, novaAcao: string) {
    const parametros = new URLSearchParams();
    if (novaTabela) parametros.set("tabela", novaTabela);
    if (novaAcao) parametros.set("acao", novaAcao);
    const consulta = parametros.toString();
    router.push(consulta ? `/painel/trilha?${consulta}` : "/painel/trilha");
  }

  const estiloSelect =
    "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm font-semibold outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <div className="flex flex-wrap items-center gap-3 print:hidden">
      <label className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-muted-foreground">Tabela</span>
        <select
          aria-label="Filtrar por tabela"
          value={tabela}
          onChange={(evento) => navegar(evento.target.value, acao)}
          className={estiloSelect}
        >
          <option value="">Todas</option>
          {Object.entries(ROTULO_TABELA_TRILHA).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-muted-foreground">Ação</span>
        <select
          aria-label="Filtrar por ação"
          value={acao}
          onChange={(evento) => navegar(tabela, evento.target.value)}
          className={estiloSelect}
        >
          <option value="">Todas</option>
          {Object.entries(ROTULO_ACAO_TRILHA).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
