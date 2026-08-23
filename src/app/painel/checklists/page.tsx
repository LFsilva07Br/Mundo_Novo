import type { Metadata } from "next";
import { obterChecklistAtual } from "@/lib/checklists/consultas";
import { EditorChecklist } from "./editor-checklist";

export const metadata: Metadata = {
  title: "Editor de Checklist",
};

export default async function PaginaChecklists() {
  const checklist = await obterChecklistAtual();

  if (!checklist) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border p-8 text-center text-sm text-muted-foreground">
        Nenhum checklist cadastrado ainda.
      </div>
    );
  }

  return <EditorChecklist checklist={checklist} />;
}
