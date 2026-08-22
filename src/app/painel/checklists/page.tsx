import type { Metadata } from "next";
import { EditorChecklist } from "./editor-checklist";

export const metadata: Metadata = {
  title: "Editor de Checklist",
};

export default function PaginaChecklists() {
  return <EditorChecklist />;
}
