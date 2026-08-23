import { test, expect, type Page } from "@playwright/test";
import axe, { type AxeResults, type Result, type RunOptions } from "axe-core";

/**
 * Barreira anti-regressão de acessibilidade (WCAG 2.2 AA).
 *
 * A auditoria de ago/2026 encontrou ~330 violações, das quais ~250 vinham do
 * tema (`src/app/globals.css`) e dos primitivos (`src/components/ui/**`).
 * Depois de corrigir a raiz, este teste existe para que elas não voltem sem
 * ninguém perceber: ele injeta o axe-core na página real, já renderizada, e
 * reprova quando aparece qualquer violação de impacto `serious` ou `critical`.
 *
 * Por que só `serious`/`critical`: são os níveis que efetivamente impedem
 * alguém de usar o sistema (contraste insuficiente, campo sem rótulo, botão
 * sem nome acessível). `minor` e `moderate` — em geral boas práticas e ordem
 * de cabeçalhos — ficam de fora para o teste não virar ruído e acabar
 * desligado. Quando o time quiser subir a régua, é só ampliar IMPACTOS_QUE_REPROVAM.
 *
 * Como ler uma falha: a mensagem lista regra, impacto, descrição e o seletor
 * CSS de cada elemento culpado, além do link da documentação do Deque com o
 * passo a passo da correção.
 */

const IMPACTOS_QUE_REPROVAM = ["serious", "critical"] as const;

/** Rotas auditadas — uma por "cara" do sistema. */
const ROTAS = [
  { caminho: "/login", nome: "Login" },
  { caminho: "/painel", nome: "Painel administrativo" },
  { caminho: "/campo", nome: "App de campo" },
  { caminho: "/portal", nome: "Portal do produtor" },
  { caminho: "/queixa/alto-da-serra", nome: "Canal de queixas público" },
];

const OPCOES_AXE: RunOptions = {
  // Conjuntos de regras: WCAG 2.0/2.1/2.2 nível A e AA — o compromisso do projeto.
  runOnly: {
    type: "tag",
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
  },
};

async function rodarAxe(page: Page): Promise<AxeResults> {
  // `axe.source` é o bundle completo do axe em texto, feito justamente para ser
  // injetado numa página já renderizada — evita depender de caminho de arquivo.
  await page.addScriptTag({ content: axe.source });
  return page.evaluate(
    (opcoes) =>
      (
        window as unknown as {
          axe: { run: (o: RunOptions) => Promise<AxeResults> };
        }
      ).axe.run(opcoes),
    OPCOES_AXE
  );
}

function descreverViolacoes(violacoes: Result[]): string {
  return violacoes
    .map((v) => {
      const alvos = v.nodes
        .slice(0, 5)
        .map((n) => `      - ${n.target.join(" ")}`)
        .join("\n");
      const resto =
        v.nodes.length > 5 ? `\n      … e mais ${v.nodes.length - 5}` : "";
      return [
        `  [${v.impact}] ${v.id} — ${v.help}`,
        `    ${v.nodes.length} elemento(s):`,
        alvos + resto,
        `    Como corrigir: ${v.helpUrl}`,
      ].join("\n");
    })
    .join("\n\n");
}

for (const rota of ROTAS) {
  test(`${rota.nome} (${rota.caminho}) não tem violação grave de acessibilidade`, async ({
    page,
  }) => {
    await page.goto(rota.caminho, { waitUntil: "networkidle" });

    const resultado = await rodarAxe(page);
    const graves = resultado.violations.filter(
      (v) =>
        v.impact !== null &&
        v.impact !== undefined &&
        (IMPACTOS_QUE_REPROVAM as readonly string[]).includes(v.impact)
    );

    expect(
      graves,
      graves.length === 0
        ? ""
        : `\n${graves.length} violação(ões) de acessibilidade em ${rota.caminho}:\n\n${descreverViolacoes(graves)}\n`
    ).toEqual([]);
  });
}

test("o link 'Pular para o conteúdo' é o primeiro foco e leva ao <main>", async ({
  page,
}) => {
  // WCAG 2.2 SC 2.4.1: antes desta correção eram ~30 toques de Tab para
  // atravessar a barra lateral do painel até o conteúdo da página.
  await page.goto("/painel", { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");

  const atalho = page.locator("a.pular-para-conteudo");
  await expect(atalho).toBeFocused();
  // Escondido até receber foco, mas sempre na ordem de tabulação.
  await expect(atalho).toBeVisible();
  await expect(atalho).toHaveAttribute("href", "#conteudo");

  await expect(page.locator("main#conteudo")).toHaveCount(1);
});

test("o anel de foco é visível e tem 2px sólidos", async ({ page }) => {
  // WCAG 2.2 SC 1.4.11: o anel anterior era --ring a 50% de opacidade, o que
  // dava 1,33:1 sobre o botão primário — na prática, invisível.
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");

  const estilo = await page.evaluate(() => {
    const ativo = document.activeElement;
    if (!ativo) return null;
    const s = getComputedStyle(ativo);
    return {
      largura: s.outlineWidth,
      estiloLinha: s.outlineStyle,
      afastamento: s.outlineOffset,
      cor: s.outlineColor,
    };
  });

  expect(estilo).not.toBeNull();
  expect(estilo!.largura).toBe("2px");
  expect(estilo!.estiloLinha).toBe("solid");
  expect(estilo!.afastamento).toBe("2px");
  // --ring #45996f: ≥3:1 contra fundo claro, cartão, botão primário e sidebar.
  expect(estilo!.cor).toBe("rgb(69, 153, 111)");
});

test("os diálogos falam português — nada de 'Close'", async ({ page }) => {
  await page.goto("/painel", { waitUntil: "networkidle" });
  const textoBruto = await page.evaluate(() => document.body.innerHTML);
  expect(textoBruto).not.toContain(">Close<");
});
