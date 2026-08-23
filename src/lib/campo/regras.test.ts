import { describe, expect, it } from "vitest";
import type { ItemVersao } from "@/lib/checklists/tipos";
import {
  aplicarResposta,
  calcularDimensoesFoto,
  divergenciaDeVersao,
  formatarBytes,
  fotosDoItem,
  fotosGuardadasSemNc,
  fotosParaEnvio,
  montarPayloadSync,
  progressoVisita,
  saudacaoDoDia,
  validarConclusaoCampo,
  visitasNaFila,
} from "./regras";
import type { FotoLocal, VisitaLocal } from "./tipos";

function item(id: string, sobrescrever: Partial<ItemVersao> = {}): ItemVersao {
  return {
    id,
    versaoId: "v1",
    ordem: 1,
    codigo: id.toUpperCase(),
    capitulo: null,
    pergunta: `Pergunta ${id}`,
    obrigatorio: true,
    fotosMinimas: 2,
    descricaoMinima: 10,
    referenciaNorma: "RA 1.1",
    permiteNa: true,
    ...sobrescrever,
  };
}

function foto(itemId: string): FotoLocal {
  return {
    itemId,
    dataUrl: "data:image/jpeg;base64,AAAA",
    gps: "-21.1,-45.0",
    tiradaEm: "2026-08-23T10:00:00Z",
  };
}

function visita(sobrescrever: Partial<VisitaLocal> = {}): VisitaLocal {
  return {
    idLocal: "local-1",
    clienteId: "cliente-1",
    clienteNome: "Fazenda Teste",
    titulo: "Visita de teste",
    versaoChecklistId: "versao-1",
    iniciadaEm: "2026-08-23T09:00:00Z",
    gpsInicio: "-21.0,-45.0",
    respostas: [],
    fotos: [],
    assinatura: null,
    concluidaEm: null,
    gpsFim: null,
    sincronizadaEm: null,
    erroSincronizacao: null,
    ...sobrescrever,
  };
}

describe("calcularDimensoesFoto", () => {
  it("reduz a foto grande para 1280px no maior lado mantendo a proporção", () => {
    expect(calcularDimensoesFoto(4000, 3000)).toEqual({
      largura: 1280,
      altura: 960,
    });
  });

  it("respeita a orientação retrato", () => {
    expect(calcularDimensoesFoto(3000, 4000)).toEqual({
      largura: 960,
      altura: 1280,
    });
  });

  it("não amplia fotos menores que o limite", () => {
    expect(calcularDimensoesFoto(800, 600)).toEqual({ largura: 800, altura: 600 });
  });

  it("aceita um limite personalizado", () => {
    expect(calcularDimensoesFoto(1000, 500, 100)).toEqual({
      largura: 100,
      altura: 50,
    });
  });

  it("nunca devolve dimensão zero para imagens muito alongadas", () => {
    expect(calcularDimensoesFoto(10000, 1, 100).altura).toBe(1);
  });

  it("trata dimensões inválidas sem quebrar", () => {
    expect(calcularDimensoesFoto(0, 0)).toEqual({ largura: 0, altura: 0 });
  });
});

describe("validarConclusaoCampo", () => {
  const itens = [item("a"), item("b", { obrigatorio: false })];

  it("aprova quando obrigatórios respondidos e NC com descrição e fotos", () => {
    const resultado = validarConclusaoCampo(
      itens,
      [{ itemId: "a", resposta: "nao_conforme", descricao: "Descrição longa o bastante." }],
      [foto("a"), foto("a")],
    );
    expect(resultado.ok).toBe(true);
  });

  it("reprova item obrigatório sem resposta", () => {
    const resultado = validarConclusaoCampo(itens, [], []);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.pendencias).toHaveLength(1);
      expect(resultado.pendencias[0].codigoItem).toBe("A");
      expect(resultado.pendencias[0].motivo).toContain("obrigatório");
    }
  });

  it("reprova NC com descrição curta e sem o mínimo de fotos", () => {
    const resultado = validarConclusaoCampo(
      itens,
      [{ itemId: "a", resposta: "nao_conforme", descricao: "curta" }],
      [foto("a")],
    );
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      const motivos = resultado.pendencias.map((p) => p.motivo).join(" ");
      expect(motivos).toContain("mínimo é 10");
      expect(motivos).toContain("mínimo é 2");
    }
  });

  it("não exige fotos nem descrição para respostas conformes", () => {
    const resultado = validarConclusaoCampo(
      itens,
      [{ itemId: "a", resposta: "conforme", descricao: null }],
      [],
    );
    expect(resultado.ok).toBe(true);
  });

  it("só conta fotos do próprio item", () => {
    const resultado = validarConclusaoCampo(
      itens,
      [{ itemId: "a", resposta: "nao_conforme", descricao: "Descrição longa o bastante." }],
      [foto("b"), foto("b")],
    );
    expect(resultado.ok).toBe(false);
  });
});

describe("montarPayloadSync", () => {
  it("monta o corpo do envio a partir da visita concluída", () => {
    const concluida = visita({
      concluidaEm: "2026-08-23T12:00:00Z",
      gpsFim: "-21.2,-45.1",
      respostas: [
        { itemId: "a", resposta: "nao_conforme", descricao: "Descrição da NC." },
      ],
      fotos: [foto("a")],
      assinatura: { dataUrl: "data:image/png;base64,BBBB", nome: "João Produtor" },
      sincronizadaEm: null,
      erroSincronizacao: "erro antigo",
    });

    const payload = montarPayloadSync(concluida);
    expect(payload).toEqual({
      idLocal: "local-1",
      clienteId: "cliente-1",
      titulo: "Visita de teste",
      versaoChecklistId: "versao-1",
      iniciadaEm: "2026-08-23T09:00:00Z",
      concluidaEm: "2026-08-23T12:00:00Z",
      gpsInicio: "-21.0,-45.0",
      gpsFim: "-21.2,-45.1",
      respostas: [
        { itemId: "a", resposta: "nao_conforme", descricao: "Descrição da NC." },
      ],
      fotos: [foto("a")],
      assinatura: { dataUrl: "data:image/png;base64,BBBB", nome: "João Produtor" },
    });
    // Campos de controle local não vazam para o servidor.
    expect(payload).not.toHaveProperty("sincronizadaEm");
    expect(payload).not.toHaveProperty("erroSincronizacao");
  });

  it("não envia fotos órfãs de itens que deixaram de ser não conformidade", () => {
    const concluida = visita({
      concluidaEm: "2026-08-23T12:00:00Z",
      respostas: [
        // O consultor tirou fotos, mudou a resposta e seguiu em frente.
        { itemId: "a", resposta: "conforme", descricao: null },
        { itemId: "b", resposta: "nao_aplicavel", descricao: null },
        { itemId: "c", resposta: "nao_conforme", descricao: "Descrição da NC." },
      ],
      fotos: [foto("a"), foto("b"), foto("c"), foto("c")],
    });

    const payload = montarPayloadSync(concluida);
    expect(payload.fotos).toHaveLength(2);
    expect(payload.fotos.every((f) => f.itemId === "c")).toBe(true);
  });

  it("não envia a descrição guardada de um item que não é mais NC", () => {
    const concluida = visita({
      concluidaEm: "2026-08-23T12:00:00Z",
      respostas: [
        {
          itemId: "a",
          resposta: "conforme",
          descricao: null,
          descricaoGuardada: "Rascunho que só interessa ao aparelho.",
        },
      ],
    });

    expect(montarPayloadSync(concluida).respostas).toEqual([
      { itemId: "a", resposta: "conforme", descricao: null },
    ]);
  });

  it("recusa visita ainda em andamento", () => {
    expect(() => montarPayloadSync(visita())).toThrow(/concluídas/);
  });
});

describe("aplicarResposta", () => {
  it("guarda a descrição da NC ao trocar para conforme e devolve ao voltar", () => {
    const original = "Cocho de defensivos sem contenção, risco de vazamento.";

    const conforme = aplicarResposta(
      [{ itemId: "a", resposta: "nao_conforme", descricao: original }],
      "a",
      "conforme",
    );
    // A descrição sai do campo visível, mas NÃO é descartada.
    expect(conforme[0].descricao).toBeNull();
    expect(conforme[0].descricaoGuardada).toBe(original);

    const deVolta = aplicarResposta(conforme, "a", "nao_conforme");
    expect(deVolta[0].descricao).toBe(original);
    expect(deVolta[0].descricaoGuardada).toBeNull();
  });

  it("mantém a descrição guardada mesmo passando por várias respostas", () => {
    const original = "Descrição detalhada da não conformidade.";
    let respostas = aplicarResposta(
      [{ itemId: "a", resposta: "nao_conforme", descricao: original }],
      "a",
      "conforme",
    );
    respostas = aplicarResposta(respostas, "a", "nao_aplicavel");
    respostas = aplicarResposta(respostas, "a", "conforme");
    respostas = aplicarResposta(respostas, "a", "nao_conforme");

    expect(respostas[0].descricao).toBe(original);
  });

  it("não guarda descrição em branco", () => {
    const respostas = aplicarResposta(
      [{ itemId: "a", resposta: "nao_conforme", descricao: "   " }],
      "a",
      "conforme",
    );
    expect(respostas[0].descricaoGuardada).toBeNull();
  });

  it("cria a resposta nova sem mexer nas dos outros itens e sem reordenar", () => {
    const respostas = aplicarResposta(
      [
        { itemId: "a", resposta: "conforme", descricao: null },
        { itemId: "b", resposta: "conforme", descricao: null },
      ],
      "a",
      "nao_conforme",
    );
    expect(respostas.map((r) => r.itemId)).toEqual(["a", "b"]);
    expect(respostas[0].resposta).toBe("nao_conforme");
    expect(respostas[0].descricao).toBe("");
    expect(respostas[1]).toEqual({
      itemId: "b",
      resposta: "conforme",
      descricao: null,
    });

    const comNovo = aplicarResposta(respostas, "c", "conforme");
    expect(comNovo.map((r) => r.itemId)).toEqual(["a", "b", "c"]);
  });
});

describe("fotos guardadas sem NC", () => {
  const respostas = [
    { itemId: "a", resposta: "conforme" as const },
    { itemId: "c", resposta: "nao_conforme" as const },
  ];

  it("fotosParaEnvio só devolve evidências de não conformidade", () => {
    expect(fotosParaEnvio(respostas, [foto("a"), foto("c")])).toEqual([foto("c")]);
  });

  it("fotosGuardadasSemNc aponta o que fica invisível no aparelho", () => {
    expect(fotosGuardadasSemNc(respostas, [foto("a"), foto("c")])).toEqual([
      foto("a"),
    ]);
  });
});

describe("divergenciaDeVersao", () => {
  const itens = [item("a"), item("b")];

  it("não acusa nada quando a visita usa a versão publicada atual", () => {
    const atual = visita({
      versaoChecklistId: "versao-1",
      respostas: [{ itemId: "a", resposta: "conforme", descricao: null }],
      fotos: [],
    });
    expect(divergenciaDeVersao(atual, "versao-1", itens)).toEqual({
      divergente: false,
      respostasOrfas: 0,
      fotosOrfas: 0,
    });
  });

  it("acusa o pacote atualizado no meio da visita e conta o que sumiu da tela", () => {
    const antiga = visita({
      versaoChecklistId: "versao-1",
      respostas: [
        { itemId: "a", resposta: "conforme", descricao: null },
        { itemId: "antigo", resposta: "nao_conforme", descricao: "NC." },
      ],
      fotos: [foto("antigo"), foto("antigo")],
    });

    expect(divergenciaDeVersao(antiga, "versao-2", itens)).toEqual({
      divergente: true,
      respostasOrfas: 1,
      fotosOrfas: 2,
    });
  });

  it("acusa divergência mesmo sem saber a versão, se há respostas órfãs", () => {
    const orfa = visita({
      versaoChecklistId: null,
      respostas: [{ itemId: "sumiu", resposta: "conforme", descricao: null }],
    });
    expect(divergenciaDeVersao(orfa, null, itens).divergente).toBe(true);
  });
});

describe("fila e progresso", () => {
  it("visitasNaFila devolve só concluídas e não sincronizadas", () => {
    const fila = visitasNaFila([
      visita({ idLocal: "andamento" }),
      visita({ idLocal: "pronta", concluidaEm: "2026-08-23T12:00:00Z" }),
      visita({
        idLocal: "enviada",
        concluidaEm: "2026-08-23T12:00:00Z",
        sincronizadaEm: "2026-08-23T13:00:00Z",
      }),
    ]);
    expect(fila.map((v) => v.idLocal)).toEqual(["pronta"]);
  });

  it("progressoVisita calcula o percentual respondido", () => {
    const itens = [item("a"), item("b"), item("c"), item("d")];
    expect(progressoVisita(itens, [])).toBe(0);
    expect(
      progressoVisita(itens, [
        { itemId: "a" },
        { itemId: "b" },
        { itemId: "fantasma" },
      ]),
    ).toBe(50);
    expect(progressoVisita([], [])).toBe(0);
  });

  it("fotosDoItem filtra pelo item", () => {
    expect(fotosDoItem([foto("a"), foto("b"), foto("a")], "a")).toHaveLength(2);
  });
});

describe("saudacaoDoDia", () => {
  it("segue o período do dia", () => {
    expect(saudacaoDoDia(7)).toBe("Bom dia");
    expect(saudacaoDoDia(14)).toBe("Boa tarde");
    expect(saudacaoDoDia(20)).toBe("Boa noite");
    expect(saudacaoDoDia(3)).toBe("Boa noite");
  });
});

describe("formatarBytes", () => {
  it("formata os tamanhos na unidade mais legível", () => {
    expect(formatarBytes(0)).toBe("0 B");
    expect(formatarBytes(512)).toBe("512 B");
    expect(formatarBytes(2048)).toBe("2 KB");
    expect(formatarBytes(12.3 * 1024 * 1024)).toBe("12,3 MB");
    expect(formatarBytes(3 * 1024 * 1024 * 1024)).toBe("3 GB");
  });

  it("responde com travessão para valores inválidos", () => {
    expect(formatarBytes(-1)).toBe("—");
    expect(formatarBytes(Number.NaN)).toBe("—");
  });
});
