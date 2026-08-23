import { describe, expect, it, vi } from "vitest";
import { listarMapasCliente, listarMapasImovel } from "./consultas";
import { resumoGeoJson } from "./conversao";

// Sem Supabase conectado a camada de consulta serve o mapa demo.
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => null),
}));

describe("consultas de mapas — modo demonstração", () => {
  it("cliente Alto da Serra ganha 1 mapa de exemplo com 2 polígonos", async () => {
    const mapas = await listarMapasCliente("alto-da-serra");
    expect(mapas).toHaveLength(1);

    const resumo = resumoGeoJson(mapas[0].geojson);
    expect(resumo.poligonos).toBe(2);
    expect(resumo.nomes).toEqual(["Talhão Garagem", "Talhão Baixada"]);
    expect(mapas[0].imovelNome).toBe("Sítio Alto da Serra (Garagem)");
  });

  it("o mesmo mapa aparece na consulta por imóvel demo", async () => {
    const mapas = await listarMapasImovel("demo-imovel-5");
    expect(mapas).toHaveLength(1);
    expect(mapas[0].id).toBe("demo-mapa-1");
  });

  it("outros clientes e imóveis ficam sem mapas no modo demonstração", async () => {
    await expect(listarMapasCliente("outro-cliente")).resolves.toEqual([]);
    await expect(listarMapasImovel("demo-imovel-1")).resolves.toEqual([]);
  });
});
