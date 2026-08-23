"use client";

import { useEffect } from "react";

/**
 * Renderiza blocos ```mermaid da documentação como diagramas.
 * O marked gera <pre><code class="language-mermaid">…</code></pre>;
 * aqui trocamos cada bloco pelo SVG correspondente.
 */
export function RenderMermaid() {
  useEffect(() => {
    let ativo = true;
    (async () => {
      const blocos = document.querySelectorAll("code.language-mermaid");
      if (blocos.length === 0) return;
      const { default: mermaid } = await import("mermaid");
      if (!ativo) return;
      mermaid.initialize({
        startOnLoad: false,
        theme: "neutral",
        themeVariables: {
          primaryColor: "#D8F3DC",
          primaryBorderColor: "#1B4332",
          primaryTextColor: "#1C1E1B",
          lineColor: "#2D6A4F",
        },
      });
      let indice = 0;
      for (const bloco of blocos) {
        const pre = bloco.closest("pre");
        if (!pre) continue;
        try {
          const { svg } = await mermaid.render(
            `diagrama-${indice++}`,
            bloco.textContent ?? "",
          );
          const contentor = document.createElement("div");
          contentor.className = "overflow-x-auto rounded-xl border bg-card p-4";
          contentor.innerHTML = svg;
          pre.replaceWith(contentor);
        } catch {
          // Diagrama inválido: mantém o bloco de código legível.
        }
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);
  return null;
}
