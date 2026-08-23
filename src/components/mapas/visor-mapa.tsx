"use client";

import { useEffect, useRef } from "react";
import type { FeatureCollection } from "geojson";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

/**
 * Visualizador Leaflet dos mapas da fazenda (talhões e limites).
 * O leaflet só existe no navegador, então é carregado com import dinâmico
 * dentro do useEffect — no servidor o componente rende apenas o contêiner.
 */

export type MapaParaVisor = {
  id: string;
  nome: string;
  geojson: FeatureCollection;
};

/** Estilo "verde café" dos talhões (paleta do mapa, fora dos tokens CSS). */
const COR_TRACO = "#1B4332";
const COR_PREENCHIMENTO = "#95D5B2";

/** Centro aproximado de Patrocínio-MG, coração do cerrado mineiro. */
const CENTRO_PADRAO: [number, number] = [-18.94, -46.99];

export function VisorMapa({
  mapas,
  className,
}: {
  mapas: MapaParaVisor[];
  className?: string;
}) {
  const referencia = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelado = false;
    let mapa: import("leaflet").Map | null = null;

    async function montar() {
      const L = (await import("leaflet")).default;
      if (cancelado || !referencia.current) return;

      mapa = L.map(referencia.current, { scrollWheelZoom: false });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapa);

      const grupo = L.featureGroup();
      for (const item of mapas) {
        L.geoJSON(item.geojson, {
          style: {
            color: COR_TRACO,
            weight: 2,
            fillColor: COR_PREENCHIMENTO,
            fillOpacity: 0.4,
          },
          pointToLayer: (_feature, latlng) =>
            L.circleMarker(latlng, {
              radius: 6,
              color: COR_TRACO,
              weight: 2,
              fillColor: COR_PREENCHIMENTO,
              fillOpacity: 0.4,
            }),
          onEachFeature: (feature, camada) => {
            const propriedades = feature.properties as Record<
              string,
              unknown
            > | null;
            const nome = propriedades?.name ?? propriedades?.nome ?? item.nome;
            camada.bindPopup(String(nome));
          },
        }).addTo(grupo);
      }
      grupo.addTo(mapa);

      const limites = grupo.getBounds();
      if (limites.isValid()) {
        mapa.fitBounds(limites, { padding: [24, 24] });
      } else {
        mapa.setView(CENTRO_PADRAO, 12);
      }
    }

    void montar();
    return () => {
      cancelado = true;
      mapa?.remove();
      mapa = null;
    };
  }, [mapas]);

  return (
    <div
      ref={referencia}
      role="application"
      aria-label="Mapa da fazenda com talhões e limites"
      data-testid="visor-mapa"
      className={cn("h-96 w-full rounded-xl border border-border", className)}
    />
  );
}
