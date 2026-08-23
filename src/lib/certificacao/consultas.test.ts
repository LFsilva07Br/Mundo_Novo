import { describe, expect, it } from "vitest";
import {
  listarCapas,
  listarContratos,
  listarMovimentos,
  listarProcessos,
  obterPerfilAtual,
} from "./consultas";
import { ETAPAS_PROCESSO, podeFecharCapa } from "./regras";

/**
 * Sem env do Supabase (ambiente de teste), a camada de consulta serve os
 * dados de demonstração já no formato do domínio.
 */

describe("consultas em modo demonstração", () => {
  it("lista os 8 processos com etapas válidas do ciclo", async () => {
    const processos = await listarProcessos();
    expect(processos).toHaveLength(8);
    for (const processo of processos) {
      expect(ETAPAS_PROCESSO).toContain(processo.etapa);
      expect(processo.cliente).toBeTruthy();
      expect(processo.normas).toBeTruthy();
    }
  });

  it("lista os contratos aguardando alçada com dias parados", async () => {
    const contratos = await listarContratos();
    expect(contratos).toHaveLength(2);
    for (const contrato of contratos) {
      expect(contrato.status).toBe("aguardando_alcada");
      expect(contrato.diasParado).toBeGreaterThan(10);
      expect(contrato.decididoPor).toBeNull();
    }
  });

  it("lista as CAPAs com as ações do plano", async () => {
    const capas = await listarCapas();
    expect(capas).toHaveLength(5);

    const capa131 = capas.find((c) => c.numero === 131);
    expect(capa131).toBeDefined();
    expect(capa131!.acoes).toHaveLength(3);
    // Com ações pendentes, a CAPA #131 não pode ser fechada.
    expect(podeFecharCapa(capa131!.acoes)).toBe(false);

    const capa130 = capas.find((c) => c.numero === 130);
    expect(capa130).toBeDefined();
    expect(podeFecharCapa(capa130!.acoes)).toBe(true);
  });

  it("toda CAPA não fechada tem responsável e prazo (NC nunca fica sem plano)", async () => {
    const capas = await listarCapas();
    for (const capa of capas.filter((c) => c.status !== "fechada")) {
      expect(capa.responsavel, `CAPA #${capa.numero}`).toBeTruthy();
      expect(capa.prazo, `CAPA #${capa.numero}`).toBeTruthy();
    }
  });

  it("sem banco não há movimentos nem perfil logado", async () => {
    expect(await listarMovimentos()).toEqual([]);
    expect(await obterPerfilAtual()).toBeNull();
  });
});
