import type { Metadata } from "next";
import {
  listarChecklists,
  obterChecklistAtual,
} from "@/lib/checklists/consultas";
import { BarraNormas } from "./barra-normas";
import { EditorChecklist } from "./editor-checklist";

export const metadata: Metadata = {
  title: "Editor de Checklist",
};

export default async function PaginaChecklists({
  searchParams,
}: PageProps<"/painel/checklists">) {
  const { checklist: parametroChecklist } = await searchParams;
  const idPedido =
    typeof parametroChecklist === "string" ? parametroChecklist : undefined;

  const checklists = await listarChecklists();
  const idValido = checklists.some((c) => c.id === idPedido)
    ? idPedido
    : undefined;
  const checklist = await obterChecklistAtual(idValido);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <BarraNormas
        checklists={checklists}
        checklistSelecionadoId={checklist?.id ?? null}
      />
      {checklist ? (
        <EditorChecklist key={checklist.id} checklist={checklist} />
      ) : (
        <div className="mx-auto max-w-3xl rounded-xl border p-8 text-center text-sm text-muted-foreground">
          Nenhum checklist cadastrado ainda — crie um a partir da biblioteca de
          normas.
        </div>
      )}
    </div>
  );
}
