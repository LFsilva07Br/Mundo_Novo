import { describe, expect, it } from "vitest";
import type { ItemVersao } from "@/lib/checklists/tipos";
import {
  agruparFiltrado,
  agruparPorCapitulo,
  ancoraCapitulo,
  CAPITULO_SEM_NOME,
  filtrarItens,
  proximoPendente,
  resumirExecucao,
  type MapaRespostas,
} from "./agrupamento";

function item(
  codigo: string,
  capitulo: string | null,
  ordem: number,
): ItemVersao {
  return {
    id: `item-${codigo}`,
    versaoId: "v1",
    ordem,
    codigo,
    capitulo,
    pergunta: `Pergunta ${codigo}`,
    obrigatorio: true,
    fotosMinimas: 2,
    descricaoMinima: 100,
    referenciaNorma: `RA 1.4 — ${codigo}`,
    permiteNa: true,
  };
}

// Dois capítulos, um item sem capítulo — a ordem do checklist é a da lista.
const ITENS: ItemVersao[] = [
  item("1.1", "Cap. 1 · Gerência", 1),
  item("1.2", "Cap. 1 · Gerência", 2),
  item("2.1", "Cap. 2 · Rastreabilidade", 3),
  item("2.2", "Cap. 2 · Rastreabilidade", 4),
  item("SEM", null, 5),
];

const RESPOSTAS: MapaRespostas = {
  "item-1.1": { resposta: "conforme" },
  "item-1.2": { resposta: "nao_conforme" },
  "item-2.1": { resposta: "nao_aplicavel" },
};

describe("agruparPorCapitulo", () => {
  it("agrupa na ordem de aparecimento e conta respondidos e NCs por seção", () => {
    const grupos = agruparPorCapitulo(ITENS, RESPOSTAS);

    expect(grupos.map((g) => g.capitulo)).toEqual([
      "Cap. 1 · Gerência",
      "Cap. 2 · Rastreabilidade",
      CAPITULO_SEM_NOME,
    ]);

    expect(grupos[0]).toMatchObject({
      total: 2,
      respondidos: 2,
      naoConformes: 1,
    });
    expect(grupos[1]).toMatchObject({
      total: 2,
      respondidos: 1,
      naoConformes: 0,
    });
    expect(grupos[2]).toMatchObject({
      total: 1,
      respondidos: 0,
      naoConformes: 0,
    });
  });

  it("preserva a ordem dos itens dentro do capítulo", () => {
    const [gerencia] = agruparPorCapitulo(ITENS, RESPOSTAS);
    expect(gerencia.itens.map((i) => i.codigo)).toEqual(["1.1", "1.2"]);
  });

  it("junta no mesmo grupo capítulos separados na lista original", () => {
    const embaralhados = [ITENS[0], ITENS[2], ITENS[1]];
    const grupos = agruparPorCapitulo(embaralhados);

    expect(grupos).toHaveLength(2);
    expect(grupos[0].itens.map((i) => i.codigo)).toEqual(["1.1", "1.2"]);
  });

  it("trata capítulo vazio ou só com espaços como 'Sem capítulo'", () => {
    const grupos = agruparPorCapitulo([item("X", "   ", 1)]);
    expect(grupos[0].capitulo).toBe(CAPITULO_SEM_NOME);
  });

  it("sem respostas, tudo fica zerado e nada quebra", () => {
    const grupos = agruparPorCapitulo(ITENS);
    expect(grupos.every((g) => g.respondidos === 0)).toBe(true);
    expect(agruparPorCapitulo([])).toEqual([]);
  });
});

describe("ancoraCapitulo", () => {
  it("gera âncora estável sem acento nem pontuação", () => {
    expect(ancoraCapitulo("Cap. 1 · Gerência")).toBe("capitulo-cap-1-gerencia");
    expect(ancoraCapitulo("Estrutural · Infraestrutura")).toBe(
      "capitulo-estrutural-infraestrutura",
    );
  });

  it("o mesmo título sempre gera a mesma âncora", () => {
    expect(ancoraCapitulo(CAPITULO_SEM_NOME)).toBe(
      ancoraCapitulo(CAPITULO_SEM_NOME),
    );
  });
});

describe("filtrarItens", () => {
  it("'todos' devolve a lista inteira", () => {
    expect(filtrarItens(ITENS, RESPOSTAS, "todos")).toHaveLength(5);
  });

  it("'pendentes' devolve só o que ainda não tem resposta", () => {
    expect(
      filtrarItens(ITENS, RESPOSTAS, "pendentes").map((i) => i.codigo),
    ).toEqual(["2.2", "SEM"]);
  });

  it("'não conformes' devolve só as NCs — N.A. e conforme ficam de fora", () => {
    expect(
      filtrarItens(ITENS, RESPOSTAS, "nao_conformes").map((i) => i.codigo),
    ).toEqual(["1.2"]);
  });
});

describe("agruparFiltrado", () => {
  it("esconde capítulos sem item visível, mas mantém o contador do capítulo inteiro", () => {
    const grupos = agruparFiltrado(ITENS, RESPOSTAS, "nao_conformes");

    expect(grupos).toHaveLength(1);
    expect(grupos[0].capitulo).toBe("Cap. 1 · Gerência");
    expect(grupos[0].itens.map((i) => i.codigo)).toEqual(["1.2"]);
    // Contador continua sendo o do capítulo, não o da lista filtrada.
    expect(grupos[0].total).toBe(2);
    expect(grupos[0].respondidos).toBe(2);
  });

  it("filtrando pendentes, só sobram os capítulos com pendência", () => {
    const grupos = agruparFiltrado(ITENS, RESPOSTAS, "pendentes");
    expect(grupos.map((g) => g.capitulo)).toEqual([
      "Cap. 2 · Rastreabilidade",
      CAPITULO_SEM_NOME,
    ]);
  });
});

describe("proximoPendente", () => {
  it("sem referência, devolve o primeiro item sem resposta", () => {
    expect(proximoPendente(ITENS, RESPOSTAS)?.codigo).toBe("2.2");
  });

  it("avança a partir do item informado", () => {
    expect(proximoPendente(ITENS, RESPOSTAS, "item-2.2")?.codigo).toBe("SEM");
  });

  it("dá a volta ao chegar no fim da lista", () => {
    expect(proximoPendente(ITENS, RESPOSTAS, "item-SEM")?.codigo).toBe("2.2");
  });

  it("devolve null quando tudo está respondido", () => {
    const tudo: MapaRespostas = Object.fromEntries(
      ITENS.map((i) => [i.id, { resposta: "conforme" as const }]),
    );
    expect(proximoPendente(ITENS, tudo)).toBeNull();
  });

  it("devolve null com a lista vazia", () => {
    expect(proximoPendente([], {})).toBeNull();
  });

  it("ignora referência a item inexistente e começa do início", () => {
    expect(proximoPendente(ITENS, RESPOSTAS, "item-fantasma")?.codigo).toBe(
      "2.2",
    );
  });
});

describe("resumirExecucao", () => {
  it("conta respondidos, pendentes, NCs e o percentual", () => {
    expect(resumirExecucao(ITENS, RESPOSTAS)).toEqual({
      total: 5,
      respondidos: 3,
      pendentes: 2,
      naoConformes: 1,
      progresso: 60,
    });
  });

  it("visita sem itens não divide por zero", () => {
    expect(resumirExecucao([], {})).toMatchObject({ progresso: 0, total: 0 });
  });
});
