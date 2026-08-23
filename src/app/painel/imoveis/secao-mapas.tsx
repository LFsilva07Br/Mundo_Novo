import { FileUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VisorMapa } from "@/components/mapas/visor-mapa";
import type { MapaImovel } from "@/lib/mapas/consultas";
import { descreverResumo, resumoGeoJson } from "@/lib/mapas/conversao";
import { BotaoEnviarMapa, BotaoRemoverMapa } from "./dialogos-mapas";
import type { OpcaoImovel } from "./dialogos";

/**
 * Seção "Mapa da fazenda" da tela de Imóveis & Talhões: visor Leaflet com
 * todos os mapas do cliente + envio/remoção de KML/GeoJSON por imóvel.
 * Atende o item 1.2.9 da norma RA (mapa da fazenda com talhões).
 */

const dataCurta = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

export function SecaoMapas({
  imoveis,
  mapas,
}: {
  imoveis: OpcaoImovel[];
  mapas: MapaImovel[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa da fazenda</CardTitle>
        <CardDescription>
          Talhões e limites dos imóveis rurais desenhados a partir do KML do
          CAR ou do Google Earth — o mapa exigido pelo item 1.2.9 da norma RA.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {mapas.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center">
            <FileUp className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm font-semibold">
              Nenhum mapa enviado para este cliente ainda.
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              Exporte o KML do imóvel no site do CAR (demonstrativo) ou desenhe
              os talhões no Google Earth e use &ldquo;Exportar como KML&rdquo;.
              Depois envie o arquivo no botão do imóvel abaixo.
            </p>
          </div>
        ) : (
          <VisorMapa
            mapas={mapas.map((mapa) => ({
              id: mapa.id,
              nome: mapa.nome,
              geojson: mapa.geojson,
            }))}
          />
        )}

        <ul className="space-y-3">
          {imoveis.map((imovel) => {
            const mapasDoImovel = mapas.filter(
              (mapa) => mapa.imovelId === imovel.id,
            );
            return (
              <li
                key={imovel.id}
                className="rounded-xl border border-border p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{imovel.nome}</p>
                  <BotaoEnviarMapa
                    imovelId={imovel.id}
                    imovelNome={imovel.nome}
                  />
                </div>
                {mapasDoImovel.length === 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sem mapas — envie o KML/GeoJSON deste imóvel.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {mapasDoImovel.map((mapa) => (
                      <li
                        key={mapa.id}
                        className="flex flex-wrap items-center justify-between gap-2 text-sm"
                      >
                        <span>
                          {mapa.nome}{" "}
                          <span className="text-xs text-muted-foreground">
                            · {descreverResumo(resumoGeoJson(mapa.geojson))} ·
                            enviado em {dataCurta.format(new Date(mapa.criadoEm))}
                          </span>
                        </span>
                        <BotaoRemoverMapa mapaId={mapa.id} nome={mapa.nome} />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
