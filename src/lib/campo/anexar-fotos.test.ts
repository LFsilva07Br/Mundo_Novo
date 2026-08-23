import { describe, expect, it } from "vitest";
import { copiarArquivosSelecionados } from "./anexar-fotos";

/** FileList vivo: esvazia quando o input é limpo, como no navegador. */
function criarFileListViva(arquivos: File[]) {
  let atuais = arquivos;
  const lista = {
    get length() {
      return atuais.length;
    },
    item: (i: number) => atuais[i] ?? null,
    [Symbol.iterator]: function* () {
      yield* atuais;
    },
    limpar: () => {
      atuais = [];
    },
  };
  return lista as unknown as FileList & { limpar: () => void };
}

describe("cópia dos arquivos de evidência", () => {
  it("preserva os arquivos mesmo depois de o input ser limpo", () => {
    const lista = criarFileListViva([
      new File(["a"], "evidencia-1.jpg", { type: "image/jpeg" }),
      new File(["b"], "evidencia-2.jpg", { type: "image/jpeg" }),
    ]);

    const copiados = copiarArquivosSelecionados(lista);
    lista.limpar(); // o input é limpo logo após o onChange

    expect(copiados).toHaveLength(2);
    expect(copiados[0].name).toBe("evidencia-1.jpg");
  });

  it("ler a lista viva depois de limpa devolveria zero (regressão evitada)", () => {
    const lista = criarFileListViva([
      new File(["a"], "evidencia-1.jpg", { type: "image/jpeg" }),
    ]);
    lista.limpar();
    expect(copiarArquivosSelecionados(lista)).toHaveLength(0);
  });

  it("aceita lista vazia ou ausente sem quebrar", () => {
    expect(copiarArquivosSelecionados(null)).toEqual([]);
    expect(copiarArquivosSelecionados(undefined)).toEqual([]);
    expect(copiarArquivosSelecionados([])).toEqual([]);
  });
});
