import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  type DocumentProps,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { formatarNumeroBr } from "@/lib/relatorios/dados";
import { formatarCentroide, type PacoteEudr } from "./dados";

/**
 * Declaração de geolocalização EUDR em PDF — identidade Mundo Novo Café,
 * no mesmo padrão dos relatórios exportáveis (src/lib/relatorios/pdf.tsx):
 * capa da consultoria, tabela de imóveis com CAR e centroide, cobertura de
 * polígonos e aviso dos imóveis ainda sem mapa.
 */

const VERDE = "#1B4332";
const CREME = "#F7F6F1";
const CAFE = "#B08968";
const AMBAR = "#B45309";

const estilos = StyleSheet.create({
  pagina: {
    paddingTop: 28,
    paddingBottom: 46,
    paddingHorizontal: 32,
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#1F2937",
  },
  capa: {
    backgroundColor: VERDE,
    color: "#FFFFFF",
    padding: 20,
    borderRadius: 6,
    marginBottom: 14,
  },
  marca: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: CREME,
    marginBottom: 4,
  },
  tituloDoc: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  subtituloDoc: { fontSize: 12, marginTop: 3, color: CREME },
  complementoDoc: { fontSize: 9, marginTop: 3, color: CREME },
  secao: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: VERDE,
    marginTop: 14,
    marginBottom: 6,
  },
  texto: { marginBottom: 4, lineHeight: 1.4 },
  cartoes: { flexDirection: "row", gap: 8 },
  cartao: {
    flex: 1,
    backgroundColor: CREME,
    borderRadius: 5,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cartaoRotulo: { fontSize: 7, textTransform: "uppercase", color: "#6B7280" },
  cartaoValor: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: VERDE,
    marginTop: 2,
  },
  tabela: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 3 },
  linhaCabecalho: { flexDirection: "row", backgroundColor: VERDE },
  celulaCabecalho: {
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    paddingVertical: 4,
    paddingHorizontal: 5,
  },
  linha: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  linhaAlternada: { backgroundColor: CREME },
  celula: { paddingVertical: 3.5, paddingHorizontal: 5 },
  aviso: {
    backgroundColor: "#FEF3C7",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: AMBAR,
    padding: 8,
    marginTop: 10,
  },
  avisoTitulo: {
    fontFamily: "Helvetica-Bold",
    color: AMBAR,
    marginBottom: 3,
  },
  rodape: {
    position: "absolute",
    bottom: 22,
    left: 32,
    right: 32,
    fontSize: 7.5,
    color: "#6B7280",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: CAFE,
    paddingTop: 6,
  },
});

type Coluna = { titulo: string; flex: number; alinhamento?: "left" | "right" };

const COLUNAS: Coluna[] = [
  { titulo: "Imóvel rural", flex: 1.9 },
  { titulo: "Produtor", flex: 1.4 },
  { titulo: "CAR", flex: 2.4 },
  { titulo: "Área (ha)", flex: 0.8, alinhamento: "right" },
  { titulo: "Centroide (lat, long)", flex: 1.5, alinhamento: "right" },
  { titulo: "Polígono", flex: 0.9, alinhamento: "right" },
];

export function documentoEudr(
  pacote: PacoteEudr,
  geradoEm: string,
): ReactElement<DocumentProps> {
  return (
    <Document
      title={`Declaração EUDR — ${pacote.clienteNome}`}
      author="Mundo Novo Café"
    >
      <Page size="A4" style={estilos.pagina}>
        <View style={estilos.capa}>
          <Text style={estilos.marca}>
            Mundo Novo Café — Consultoria em Certificação
          </Text>
          <Text style={estilos.tituloDoc}>
            Declaração de geolocalização — EUDR
          </Text>
          <Text style={estilos.subtituloDoc}>{pacote.clienteNome}</Text>
          <Text style={estilos.complementoDoc}>
            Regulamento (UE) 2023/1115 — produtos livres de desmatamento
          </Text>
        </View>

        <Text style={estilos.texto}>
          O café exportado à União Europeia exige a geolocalização (polígono)
          de cada área produtiva. Esta declaração consolida os imóveis rurais
          do cliente com o CAR, a coordenada de referência (centroide) e a
          situação do polígono de cada um. O arquivo GeoJSON consolidado, com
          os polígonos completos, acompanha esta declaração e é aceito pelos
          sistemas de due diligence.
        </Text>

        <View style={estilos.cartoes}>
          <View style={estilos.cartao}>
            <Text style={estilos.cartaoRotulo}>Imóveis rurais</Text>
            <Text style={estilos.cartaoValor}>{pacote.totalImoveis}</Text>
          </View>
          <View style={estilos.cartao}>
            <Text style={estilos.cartaoRotulo}>Com polígono</Text>
            <Text style={estilos.cartaoValor}>
              {pacote.imoveisComPoligono}
            </Text>
          </View>
          <View style={estilos.cartao}>
            <Text style={estilos.cartaoRotulo}>Cobertura de polígonos</Text>
            <Text style={estilos.cartaoValor}>
              {pacote.percentualCobertura}%
            </Text>
          </View>
        </View>

        <Text style={estilos.secao}>Imóveis rurais e geolocalização</Text>
        <View style={estilos.tabela}>
          <View style={estilos.linhaCabecalho}>
            {COLUNAS.map((coluna) => (
              <Text
                key={coluna.titulo}
                style={[
                  estilos.celulaCabecalho,
                  {
                    flex: coluna.flex,
                    textAlign: coluna.alinhamento ?? "left",
                  },
                ]}
              >
                {coluna.titulo}
              </Text>
            ))}
          </View>
          {pacote.imoveis.map((imovel, indice) => {
            const valores = [
              imovel.imovelNome,
              imovel.produtor,
              imovel.car ?? "CAR não informado",
              formatarNumeroBr(imovel.areaHa),
              formatarCentroide(imovel.centroide),
              imovel.temPoligono ? "COM polígono" : "SEM polígono",
            ];
            return (
              <View
                key={imovel.imovelId}
                style={[
                  estilos.linha,
                  ...(indice % 2 === 1 ? [estilos.linhaAlternada] : []),
                ]}
                wrap={false}
              >
                {valores.map((valor, c) => (
                  <Text
                    key={c}
                    style={[
                      estilos.celula,
                      {
                        flex: COLUNAS[c].flex,
                        textAlign: COLUNAS[c].alinhamento ?? "left",
                      },
                      ...(c === valores.length - 1 && !imovel.temPoligono
                        ? [{ color: AMBAR, fontFamily: "Helvetica-Bold" }]
                        : []),
                    ]}
                  >
                    {valor}
                  </Text>
                ))}
              </View>
            );
          })}
        </View>

        {pacote.imoveisSemPoligono.length > 0 ? (
          <View style={estilos.aviso}>
            <Text style={estilos.avisoTitulo}>
              Atenção — {pacote.imoveisSemPoligono.length}{" "}
              {pacote.imoveisSemPoligono.length === 1
                ? "imóvel ainda sem polígono"
                : "imóveis ainda sem polígono"}
            </Text>
            <Text style={estilos.texto}>
              {pacote.imoveisSemPoligono.join(" · ")}
            </Text>
            <Text>
              Envie o mapa (KML do CAR ou GeoJSON) destes imóveis na tela de
              Imóveis &amp; Talhões para completar a cobertura exigida pelo
              EUDR.
            </Text>
          </View>
        ) : (
          <Text style={[estilos.texto, { marginTop: 10 }]}>
            Todos os imóveis rurais do cliente têm polígono de geolocalização
            — cobertura completa para o EUDR.
          </Text>
        )}

        <Text style={estilos.rodape} fixed>
          Gerado pelo sistema Mundo Novo em {geradoEm}
        </Text>
      </Page>
    </Document>
  );
}
