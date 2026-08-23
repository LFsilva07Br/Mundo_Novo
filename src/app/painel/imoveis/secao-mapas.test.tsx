import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MapaImovel } from "@/lib/mapas/consultas";
import { SecaoMapas } from "./secao-mapas";

// As ações são Server Actions — nos testes viram espiões inertes.
vi.mock("@/lib/mapas/acoes", () => ({
  enviarMapa: vi.fn(),
  removerMapa: vi.fn(),
}));

// O leaflet só roda no navegador de verdade; aqui basta um dublê que
// registra as chamadas feitas pelo visor.
const chamadas = {
  tileLayerOpcoes: [] as unknown[],
  geoJsonDados: [] as unknown[],
};

vi.mock("leaflet", () => {
  const camada = () => ({ addTo: vi.fn(), bindPopup: vi.fn() });
  const grupo = () => ({
    addTo: vi.fn(),
    getBounds: () => ({ isValid: () => false }),
  });
  return {
    default: {
      map: vi.fn(() => ({ setView: vi.fn(), fitBounds: vi.fn(), remove: vi.fn() })),
      tileLayer: vi.fn((_url: string, opcoes: unknown) => {
        chamadas.tileLayerOpcoes.push(opcoes);
        return camada();
      }),
      featureGroup: vi.fn(grupo),
      geoJSON: vi.fn((dados: unknown) => {
        chamadas.geoJsonDados.push(dados);
        return camada();
      }),
      circleMarker: vi.fn(camada),
    },
  };
});

vi.mock("leaflet/dist/leaflet.css", () => ({}));

const imoveis = [
  { id: "demo-imovel-5", nome: "Sítio Alto da Serra (Garagem)" },
  { id: "demo-imovel-1", nome: "Serra da Boa Vista" },
];

const mapaDemo: MapaImovel = {
  id: "demo-mapa-1",
  imovelId: "demo-imovel-5",
  imovelNome: "Sítio Alto da Serra (Garagem)",
  nome: "Talhões da Garagem (exemplo)",
  caminhoArquivo: null,
  criadoEm: "2026-01-15T09:00:00.000Z",
  geojson: {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Talhão Garagem" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-46.99, -18.93],
              [-46.98, -18.93],
              [-46.98, -18.94],
              [-46.99, -18.93],
            ],
          ],
        },
      },
    ],
  },
};

describe("SecaoMapas", () => {
  it("sem mapas, orienta a exportar o KML do CAR/Google Earth", () => {
    render(<SecaoMapas imoveis={imoveis} mapas={[]} />);

    expect(screen.getByText("Mapa da fazenda")).toBeInTheDocument();
    expect(
      screen.getByText(/Nenhum mapa enviado para este cliente/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Google Earth/i).length).toBeGreaterThan(0);
    expect(screen.queryByTestId("visor-mapa")).not.toBeInTheDocument();

    // Um botão de envio por imóvel.
    expect(
      screen.getAllByRole("button", { name: /Enviar mapa/i }),
    ).toHaveLength(2);
  });

  it("com mapas, mostra o visor, a lista com resumo e o botão de remover", async () => {
    render(<SecaoMapas imoveis={imoveis} mapas={[mapaDemo]} />);

    expect(screen.getByTestId("visor-mapa")).toBeInTheDocument();
    expect(screen.getByText("Talhões da Garagem (exemplo)")).toBeInTheDocument();
    expect(screen.getByText(/1 polígono/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Remover mapa Talhões da Garagem (exemplo)",
      }),
    ).toBeInTheDocument();

    // O visor monta o leaflet (mockado) com a atribuição do OpenStreetMap
    // e desenha o GeoJSON do mapa.
    await vi.waitFor(() => {
      expect(chamadas.geoJsonDados).toContainEqual(mapaDemo.geojson);
    });
    expect(chamadas.tileLayerOpcoes[0]).toMatchObject({
      attribution: expect.stringContaining("OpenStreetMap"),
    });
  });
});
