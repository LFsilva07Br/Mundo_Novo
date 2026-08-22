import { readFile } from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";

export type AbaDocs = "funcional" | "tecnica";

export const ABAS_DOCS: { id: AbaDocs; rotulo: string }[] = [
  { id: "funcional", rotulo: "Funcional" },
  { id: "tecnica", rotulo: "Técnica" },
];

export async function carregarDoc(aba: AbaDocs): Promise<string> {
  const arquivo = path.join(process.cwd(), "docs", `${aba}.md`);
  const markdown = await readFile(arquivo, "utf-8");
  return marked.parse(markdown, { async: false });
}
