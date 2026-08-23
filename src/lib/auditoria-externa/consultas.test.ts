import { describe, expect, it } from "vitest";
import { compararComInterna, listarAchados } from "./consultas";

/**
 * Sem env do Supabase (ambiente de teste), a camada de consulta serve os
 * dados de demonstração já no formato do domínio.
 */

describe("consultas em modo demonstração", () => {
  it("lista os achados da certificadora com cliente e CAPA vinculada", async () => {
    const achados = await listarAchados();
    expect(achados).toHaveLength(4);
    for (const achado of achados) {
      expect(achado.cliente).toBeTruthy();
      expect(achado.descricao).toBeTruthy();
      expect(achado.certificadora).toBe("ALAICE");
    }

    const vinculados = achados.filter((a) => a.capaId !== null);
    expect(vinculados).toHaveLength(2);
    expect(vinculados.map((a) => a.capaNumero)).toEqual([129, 127]);
  });

  it("comparativo com a interna: metade dos achados foi pega só pela externa", async () => {
    const comparativo = await compararComInterna();
    expect(comparativo.total).toBe(4);
    expect(comparativo.pegosInternamente).toBe(2);
    expect(comparativo.pegosSoPelaExterna).toBe(2);
    expect(comparativo.percentualPegoInternamente).toBe(50);
  });
});
