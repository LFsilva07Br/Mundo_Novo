import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  type DocumentProps,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type { DadosAta } from "./ata";

/**
 * Ata de treinamento (lista de presença) em PDF — identidade Mundo Novo Café:
 * cabeçalho verde da consultoria, tabela de participantes com a miniatura da
 * assinatura colhida na tela (ou linha para assinar no papel) e campo do
 * instrutor ao final.
 */

const VERDE = "#1B4332";
const CREME = "#F7F6F1";
const CAFE = "#B08968";
const CINZA_BORDA = "#D1D5DB";

const estilos = StyleSheet.create({
  pagina: {
    paddingTop: 28,
    paddingBottom: 46,
    paddingHorizontal: 32,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1F2937",
  },
  cabecalho: {
    backgroundColor: VERDE,
    color: "#FFFFFF",
    padding: 12,
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
  tituloDoc: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  subtituloDoc: { fontSize: 9, marginTop: 3, color: CREME },
  texto: { marginBottom: 4, lineHeight: 1.4 },
  secao: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: VERDE,
    marginTop: 14,
    marginBottom: 6,
  },
  tabela: { borderWidth: 1, borderColor: CINZA_BORDA, borderRadius: 3 },
  linhaCabecalho: { flexDirection: "row", backgroundColor: VERDE },
  celulaCabecalho: {
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    paddingVertical: 4,
    paddingHorizontal: 5,
  },
  linha: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    alignItems: "center",
    minHeight: 30,
  },
  linhaAlternada: { backgroundColor: CREME },
  celula: { paddingVertical: 3.5, paddingHorizontal: 5 },
  assinaturaImagem: { height: 24, width: 110, objectFit: "contain" },
  linhaAssinar: {
    borderBottomWidth: 1,
    borderBottomColor: "#9CA3AF",
    height: 16,
    marginRight: 10,
  },
  blocoInstrutor: {
    marginTop: 28,
    flexDirection: "row",
    gap: 24,
  },
  campoInstrutor: { flex: 1 },
  linhaInstrutor: {
    borderBottomWidth: 1,
    borderBottomColor: "#4B5563",
    height: 26,
    marginBottom: 4,
  },
  rotuloInstrutor: { fontSize: 8, color: "#6B7280" },
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

export function documentoAta(
  ata: DadosAta,
  geradoEm: string,
): ReactElement<DocumentProps> {
  return (
    <Document
      title={`Ata de treinamento — ${ata.treinamentoNome}`}
      author="Mundo Novo Café"
    >
      <Page size="A4" style={estilos.pagina}>
        <View style={estilos.cabecalho}>
          <Text style={estilos.marca}>
            Mundo Novo Café — Consultoria em Certificação
          </Text>
          <Text style={estilos.tituloDoc}>Ata de treinamento</Text>
          <Text style={estilos.subtituloDoc}>
            {ata.treinamentoNome}
            {ata.norma ? ` · ${ata.norma}` : ""}
          </Text>
          <Text style={estilos.subtituloDoc}>
            Realizado em {ata.dataFormatada}
          </Text>
        </View>

        <Text style={estilos.texto}>
          Os colaboradores abaixo participaram do treinamento{" "}
          {ata.treinamentoNome}
          {ata.norma ? ` (${ata.norma})` : ""} realizado em {ata.dataFormatada}.
          Assinaturas colhidas na tela aparecem ao lado do nome; as demais
          devem ser colhidas na linha correspondente.
        </Text>

        <Text style={estilos.secao}>
          Participantes ({ata.participantes.length}) · assinaturas colhidas:{" "}
          {ata.totalAssinaturas}/{ata.participantes.length}
        </Text>

        <View style={estilos.tabela}>
          <View style={estilos.linhaCabecalho}>
            <Text style={[estilos.celulaCabecalho, { flex: 0.4 }]}>Nº</Text>
            <Text style={[estilos.celulaCabecalho, { flex: 2.4 }]}>
              Colaborador(a)
            </Text>
            <Text style={[estilos.celulaCabecalho, { flex: 1.8 }]}>
              Assinatura
            </Text>
          </View>
          {ata.participantes.map((participante, indice) => (
            <View
              key={participante.nome}
              style={[
                estilos.linha,
                ...(indice % 2 === 1 ? [estilos.linhaAlternada] : []),
              ]}
              wrap={false}
            >
              <Text style={[estilos.celula, { flex: 0.4 }]}>{indice + 1}</Text>
              <Text style={[estilos.celula, { flex: 2.4 }]}>
                {participante.nome}
              </Text>
              <View style={[estilos.celula, { flex: 1.8 }]}>
                {participante.assinaturaUrl ? (
                  // eslint-disable-next-line jsx-a11y/alt-text -- Image do @react-pdf não aceita alt.
                  <Image
                    style={estilos.assinaturaImagem}
                    src={participante.assinaturaUrl}
                  />
                ) : (
                  <View style={estilos.linhaAssinar} />
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={estilos.blocoInstrutor} wrap={false}>
          <View style={estilos.campoInstrutor}>
            <View style={estilos.linhaInstrutor} />
            <Text style={estilos.rotuloInstrutor}>
              Nome do instrutor(a) / entidade
            </Text>
          </View>
          <View style={estilos.campoInstrutor}>
            <View style={estilos.linhaInstrutor} />
            <Text style={estilos.rotuloInstrutor}>
              Assinatura do instrutor(a)
            </Text>
          </View>
        </View>

        <Text style={estilos.rodape} fixed>
          Gerado pelo sistema Mundo Novo em {geradoEm}
        </Text>
      </Page>
    </Document>
  );
}
