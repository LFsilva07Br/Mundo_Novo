import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  type DocumentProps,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";
import {
  formatarDataBr,
  formatarNumeroBr,
  type LinhaCapaRelatorio,
  type LinhaConformidade,
  type RelatorioCapas,
  type RelatorioMensal,
  type RelatorioSafra,
} from "./dados";

/**
 * Documentos PDF dos relatórios (identidade Mundo Novo Café):
 * cabeçalho verde da consultoria e rodapé "Gerado pelo sistema Mundo Novo".
 */

const VERDE = "#1B4332";
const CREME = "#F7F6F1";
const CAFE = "#B08968";
const VERMELHO = "#B91C1C";
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
  secao: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: VERDE,
    marginTop: 14,
    marginBottom: 6,
  },
  tabela: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 3 },
  linhaCabecalho: {
    flexDirection: "row",
    backgroundColor: VERDE,
  },
  celulaCabecalho: {
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    paddingVertical: 4,
    paddingHorizontal: 5,
  },
  linha: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  linhaAlternada: { backgroundColor: CREME },
  linhaDestaque: {
    backgroundColor: "#E8F1EC",
    fontFamily: "Helvetica-Bold",
  },
  celula: { paddingVertical: 3.5, paddingHorizontal: 5 },
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
  texto: { marginBottom: 4, lineHeight: 1.4 },
});

type ColunaPdf = {
  titulo: string;
  flex: number;
  alinhamento?: "left" | "right";
};

type CelulaPdf = { texto: string; cor?: string };

function Cabecalho({
  titulo,
  subtitulo,
}: {
  titulo: string;
  subtitulo?: string;
}) {
  return (
    <View style={estilos.cabecalho}>
      <Text style={estilos.marca}>
        Mundo Novo Café — Consultoria em Certificação
      </Text>
      <Text style={estilos.tituloDoc}>{titulo}</Text>
      {subtitulo ? <Text style={estilos.subtituloDoc}>{subtitulo}</Text> : null}
    </View>
  );
}

function Rodape({ geradoEm }: { geradoEm: string }) {
  return (
    <Text style={estilos.rodape} fixed>
      Gerado pelo sistema Mundo Novo em {geradoEm}
    </Text>
  );
}

function Tabela({
  colunas,
  linhas,
  destaqueUltima = false,
}: {
  colunas: ColunaPdf[];
  linhas: CelulaPdf[][];
  destaqueUltima?: boolean;
}) {
  return (
    <View style={estilos.tabela}>
      <View style={estilos.linhaCabecalho}>
        {colunas.map((coluna) => (
          <Text
            key={coluna.titulo}
            style={[
              estilos.celulaCabecalho,
              { flex: coluna.flex, textAlign: coluna.alinhamento ?? "left" },
            ]}
          >
            {coluna.titulo}
          </Text>
        ))}
      </View>
      {linhas.map((linha, indice) => {
        const ultima = indice === linhas.length - 1;
        return (
          <View
            key={indice}
            style={[
              estilos.linha,
              ...(destaqueUltima && ultima
                ? [estilos.linhaDestaque]
                : indice % 2 === 1
                  ? [estilos.linhaAlternada]
                  : []),
            ]}
            wrap={false}
          >
            {linha.map((celula, c) => (
              <Text
                key={c}
                style={[
                  estilos.celula,
                  {
                    flex: colunas[c].flex,
                    textAlign: colunas[c].alinhamento ?? "left",
                  },
                  ...(celula.cor ? [{ color: celula.cor }] : []),
                  ...(destaqueUltima && ultima
                    ? [{ fontFamily: "Helvetica-Bold" }]
                    : []),
                ]}
              >
                {celula.texto}
              </Text>
            ))}
          </View>
        );
      })}
    </View>
  );
}

function celula(texto: string, cor?: string): CelulaPdf {
  return cor ? { texto, cor } : { texto };
}

function corSituacao(status: string | null): string | undefined {
  if (status === "vencido" || status === "critico") return VERMELHO;
  if (status === "atencao") return AMBAR;
  if (status === "ok") return VERDE;
  return undefined;
}

const ROTULO_SITUACAO: Record<string, string> = {
  ok: "OK",
  atencao: "Atenção",
  critico: "Crítico",
  vencido: "Vencido",
};

// --------------------------------------------------------- estimativa de safra

export function documentoSafra(
  rel: RelatorioSafra,
  geradoEm: string,
): ReactElement<DocumentProps> {
  const colunasTalhoes: ColunaPdf[] = [
    { titulo: "Produtor", flex: 1.4 },
    { titulo: "Talhão", flex: 1.6 },
    { titulo: "Área (ha)", flex: 0.9, alinhamento: "right" },
    { titulo: "Variedade", flex: 1.5 },
    { titulo: "Ano", flex: 0.6, alinhamento: "right" },
    { titulo: "Estado", flex: 1.1 },
    { titulo: `Prev. ${rel.safraAtual} (sc)`, flex: 1.3, alinhamento: "right" },
    {
      titulo: `Colh. ${rel.safraAnterior} (sc)`,
      flex: 1.3,
      alinhamento: "right",
    },
  ];

  const linhasTalhoes: CelulaPdf[][] = rel.linhas.map((l) => [
    celula(l.produtor),
    celula(l.talhao),
    celula(formatarNumeroBr(l.areaHa)),
    celula(l.variedade),
    celula(l.anoPlantio ? String(l.anoPlantio) : "—"),
    celula(l.estadoLavoura),
    celula(formatarNumeroBr(l.previsaoSacas)),
    celula(formatarNumeroBr(l.colheitaAnteriorSacas)),
  ]);
  linhasTalhoes.push([
    celula(rel.totalGeral.produtor),
    celula(`${rel.totalGeral.talhoes} talhões`),
    celula(formatarNumeroBr(rel.totalGeral.areaHa)),
    celula(""),
    celula(""),
    celula(""),
    celula(formatarNumeroBr(rel.totalGeral.previsaoSacas)),
    celula(formatarNumeroBr(rel.totalGeral.colheitaAnteriorSacas)),
  ]);

  return (
    <Document
      title={`Estimativa de safra — ${rel.clienteNome}`}
      author="Mundo Novo Café"
    >
      <Page size="A4" style={estilos.pagina}>
        <Cabecalho
          titulo={`Estimativa de safra ${rel.safraAtual}`}
          subtitulo={rel.clienteNome}
        />

        <Text style={estilos.secao}>Talhões</Text>
        <Tabela colunas={colunasTalhoes} linhas={linhasTalhoes} destaqueUltima />

        <Text style={estilos.secao} break={rel.linhas.length > 24}>
          Totais por produtor
        </Text>
        <Tabela
          colunas={[
            { titulo: "Produtor", flex: 2 },
            { titulo: "Talhões", flex: 1, alinhamento: "right" },
            { titulo: "Área (ha)", flex: 1, alinhamento: "right" },
            {
              titulo: `Previsão ${rel.safraAtual} (sc)`,
              flex: 1.4,
              alinhamento: "right",
            },
            {
              titulo: `Colheita ${rel.safraAnterior} (sc)`,
              flex: 1.4,
              alinhamento: "right",
            },
          ]}
          linhas={[
            ...rel.totaisPorProdutor.map((t) => [
              celula(t.produtor),
              celula(String(t.talhoes)),
              celula(formatarNumeroBr(t.areaHa)),
              celula(formatarNumeroBr(t.previsaoSacas)),
              celula(formatarNumeroBr(t.colheitaAnteriorSacas)),
            ]),
            [
              celula(rel.totalGeral.produtor),
              celula(String(rel.totalGeral.talhoes)),
              celula(formatarNumeroBr(rel.totalGeral.areaHa)),
              celula(formatarNumeroBr(rel.totalGeral.previsaoSacas)),
              celula(formatarNumeroBr(rel.totalGeral.colheitaAnteriorSacas)),
            ],
          ]}
          destaqueUltima
        />

        {rel.comparativo.length > 0 ? (
          <>
            <Text style={estilos.secao}>Comparativo entre safras</Text>
            <Tabela
              colunas={[
                { titulo: "Safra", flex: 1 },
                { titulo: "Previsão (sc)", flex: 1, alinhamento: "right" },
                {
                  titulo: "Colheita efetiva (sc)",
                  flex: 1.3,
                  alinhamento: "right",
                },
                { titulo: "Observação", flex: 2.6 },
              ]}
              linhas={rel.comparativo.map((s) => [
                celula(s.safra),
                celula(formatarNumeroBr(s.previsaoSacas)),
                celula(formatarNumeroBr(s.colheitaEfetivaSacas)),
                celula(s.observacao ?? ""),
              ])}
            />
          </>
        ) : null}

        <Rodape geradoEm={geradoEm} />
      </Page>
    </Document>
  );
}

// ------------------------------------------------------------- conformidade

export function documentoConformidade(
  linhas: LinhaConformidade[],
  geradoEm: string,
): ReactElement<DocumentProps> {
  return (
    <Document title="Carteira — conformidade" author="Mundo Novo Café">
      <Page size="A4" orientation="landscape" style={estilos.pagina}>
        <Cabecalho
          titulo="Carteira de clientes — conformidade e certificações"
          subtitulo="Certificações, vencimentos e situação de cada cliente"
        />
        <Tabela
          colunas={[
            { titulo: "Cliente", flex: 2.2 },
            { titulo: "Cidade/UF", flex: 1.6 },
            { titulo: "Fase", flex: 0.9 },
            { titulo: "Conform. (%)", flex: 0.9, alinhamento: "right" },
            { titulo: "Norma", flex: 1.3 },
            { titulo: "Certificadora", flex: 1.1 },
            { titulo: "Status", flex: 1.1 },
            { titulo: "Vence em", flex: 0.9 },
            { titulo: "Situação", flex: 0.8 },
          ]}
          linhas={linhas.map((l) => [
            celula(l.cliente),
            celula(l.cidadeUf),
            celula(l.fase),
            celula(l.conformidade !== null ? String(l.conformidade) : "—"),
            celula(l.norma),
            celula(l.certificadora),
            celula(l.statusCertificacao),
            celula(
              formatarDataBr(l.venceEm),
              corSituacao(l.statusVencimento),
            ),
            celula(
              l.statusVencimento ? ROTULO_SITUACAO[l.statusVencimento] : "—",
              corSituacao(l.statusVencimento),
            ),
          ])}
        />
        <Rodape geradoEm={geradoEm} />
      </Page>
    </Document>
  );
}

// -------------------------------------------------------------------- CAPAs

function linhasCapas(linhas: LinhaCapaRelatorio[]): CelulaPdf[][] {
  return linhas.map((l) => [
    celula(`#${l.numero}`),
    celula(l.cliente),
    celula(l.descricao),
    celula(l.origem),
    celula(
      l.severidade,
      l.severidadeBruta === "critica"
        ? VERMELHO
        : l.severidadeBruta === "maior"
          ? AMBAR
          : undefined,
    ),
    celula(l.responsavel),
    celula(formatarDataBr(l.prazo)),
    celula(l.status, l.statusBruto === "fechada" ? VERDE : AMBAR),
    celula(l.acoesTotal ? `${l.acoesConcluidas}/${l.acoesTotal}` : "—"),
  ]);
}

const COLUNAS_CAPAS: ColunaPdf[] = [
  { titulo: "Nº", flex: 0.5 },
  { titulo: "Cliente", flex: 1.7 },
  { titulo: "Descrição da NC", flex: 3 },
  { titulo: "Origem", flex: 0.8 },
  { titulo: "Severidade", flex: 0.8 },
  { titulo: "Responsável", flex: 1.2 },
  { titulo: "Prazo", flex: 0.8 },
  { titulo: "Status", flex: 1.2 },
  { titulo: "Ações", flex: 0.6 },
];

export function documentoCapas(
  rel: RelatorioCapas,
  geradoEm: string,
): ReactElement<DocumentProps> {
  return (
    <Document title="CAPAs — planos de ação" author="Mundo Novo Café">
      <Page size="A4" orientation="landscape" style={estilos.pagina}>
        <Cabecalho
          titulo={
            rel.ocultarFechadas
              ? "CAPAs em aberto — pacote de auditoria"
              : "CAPAs — planos de ação corretiva"
          }
          subtitulo={
            rel.ocultarFechadas
              ? `${rel.totalAbertas} CAPAs em tratamento (fechadas ocultadas: ${rel.totalFechadas})`
              : `${rel.totalAbertas} abertas · ${rel.totalFechadas} fechadas`
          }
        />
        <Tabela colunas={COLUNAS_CAPAS} linhas={linhasCapas(rel.linhas)} />
        <Rodape geradoEm={geradoEm} />
      </Page>
    </Document>
  );
}

// ------------------------------------------------ relatório mensal do cliente

export function documentoMensal(
  rel: RelatorioMensal,
  geradoEm: string,
  mesReferencia: string,
): ReactElement<DocumentProps> {
  return (
    <Document
      title={`Relatório mensal — ${rel.clienteNome}`}
      author="Mundo Novo Café"
    >
      <Page size="A4" style={estilos.pagina}>
        {/* Capa com a marca da consultoria */}
        <View style={[estilos.cabecalho, { padding: 20 }]}>
          <Text style={estilos.marca}>
            Mundo Novo Café — Consultoria em Certificação
          </Text>
          <Text style={[estilos.tituloDoc, { fontSize: 18 }]}>
            Relatório mensal do cliente
          </Text>
          <Text style={[estilos.subtituloDoc, { fontSize: 12 }]}>
            {rel.clienteNome}
          </Text>
          <Text style={estilos.subtituloDoc}>
            {[rel.produtor, rel.cidadeUf].filter(Boolean).join(" · ")}
          </Text>
          <Text style={[estilos.subtituloDoc, { color: CAFE }]}>
            Referência: {mesReferencia}
          </Text>
        </View>

        {/* Resumo do cliente */}
        <View style={estilos.cartoes}>
          <View style={estilos.cartao}>
            <Text style={estilos.cartaoRotulo}>Imóveis rurais</Text>
            <Text style={estilos.cartaoValor}>{rel.areas.imoveis}</Text>
          </View>
          <View style={estilos.cartao}>
            <Text style={estilos.cartaoRotulo}>Área total</Text>
            <Text style={estilos.cartaoValor}>
              {formatarNumeroBr(rel.areas.totalHa)} ha
            </Text>
          </View>
          <View style={estilos.cartao}>
            <Text style={estilos.cartaoRotulo}>Área de café</Text>
            <Text style={estilos.cartaoValor}>
              {formatarNumeroBr(rel.areas.cafeHa)} ha
            </Text>
          </View>
          <View style={estilos.cartao}>
            <Text style={estilos.cartaoRotulo}>APP + Reserva</Text>
            <Text style={estilos.cartaoValor}>
              {formatarNumeroBr(rel.areas.appHa + rel.areas.reservaHa)} ha
            </Text>
          </View>
          <View style={estilos.cartao}>
            <Text style={estilos.cartaoRotulo}>Conformidade</Text>
            <Text style={estilos.cartaoValor}>
              {rel.conformidade !== null ? `${rel.conformidade}%` : "—"}
            </Text>
          </View>
        </View>

        {/* Certificações */}
        <Text style={estilos.secao}>Certificações e vencimentos</Text>
        {rel.certificacoes.length > 0 ? (
          <Tabela
            colunas={[
              { titulo: "Norma", flex: 1.6 },
              { titulo: "Certificadora", flex: 1.3 },
              { titulo: "Status", flex: 1.2 },
              { titulo: "Vence em", flex: 1 },
              { titulo: "Situação", flex: 1 },
            ]}
            linhas={rel.certificacoes.map((c) => [
              celula(c.norma),
              celula(c.certificadora),
              celula(c.status),
              celula(formatarDataBr(c.venceEm), corSituacao(c.statusVencimento)),
              celula(
                c.statusVencimento ? ROTULO_SITUACAO[c.statusVencimento] : "—",
                corSituacao(c.statusVencimento),
              ),
            ])}
          />
        ) : (
          <Text style={estilos.texto}>Nenhuma certificação registrada.</Text>
        )}

        {/* Safra */}
        <Text style={estilos.secao}>
          Estimativa de safra {rel.safra.safraAtual}
        </Text>
        {rel.safra.totaisPorProdutor.length > 0 ? (
          <Tabela
            colunas={[
              { titulo: "Produtor", flex: 2 },
              { titulo: "Talhões", flex: 1, alinhamento: "right" },
              { titulo: "Área (ha)", flex: 1, alinhamento: "right" },
              { titulo: "Previsão (sc)", flex: 1.2, alinhamento: "right" },
              {
                titulo: `Colheita ${rel.safra.safraAnterior} (sc)`,
                flex: 1.5,
                alinhamento: "right",
              },
            ]}
            linhas={[
              ...rel.safra.totaisPorProdutor.map((t) => [
                celula(t.produtor),
                celula(String(t.talhoes)),
                celula(formatarNumeroBr(t.areaHa)),
                celula(formatarNumeroBr(t.previsaoSacas)),
                celula(formatarNumeroBr(t.colheitaAnteriorSacas)),
              ]),
              [
                celula(rel.safra.totalGeral.produtor),
                celula(String(rel.safra.totalGeral.talhoes)),
                celula(formatarNumeroBr(rel.safra.totalGeral.areaHa)),
                celula(formatarNumeroBr(rel.safra.totalGeral.previsaoSacas)),
                celula(
                  formatarNumeroBr(rel.safra.totalGeral.colheitaAnteriorSacas),
                ),
              ],
            ]}
            destaqueUltima
          />
        ) : (
          <Text style={estilos.texto}>
            Nenhum talhão com lançamento de safra.
          </Text>
        )}

        {/* CAPAs */}
        <Text style={estilos.secao}>
          CAPAs — {rel.capasAbertas.length} em aberto ·{" "}
          {rel.capasFechadas.length} fechadas no período
        </Text>
        {rel.capasAbertas.length + rel.capasFechadas.length > 0 ? (
          <Tabela
            colunas={COLUNAS_CAPAS}
            linhas={linhasCapas([...rel.capasAbertas, ...rel.capasFechadas])}
          />
        ) : (
          <Text style={estilos.texto}>
            Nenhum plano de ação registrado para o cliente.
          </Text>
        )}

        {/* Treinamentos */}
        <Text style={estilos.secao}>Treinamentos a vencer</Text>
        {rel.treinamentosVencendo.length > 0 ? (
          <Tabela
            colunas={[
              { titulo: "Treinamento", flex: 3 },
              { titulo: "Próximo vencimento", flex: 1.3 },
              { titulo: "Situação", flex: 1 },
            ]}
            linhas={rel.treinamentosVencendo.map((t) => [
              celula(t.nome),
              celula(
                formatarDataBr(t.proximoVencimento),
                corSituacao(t.status),
              ),
              celula(ROTULO_SITUACAO[t.status], corSituacao(t.status)),
            ])}
          />
        ) : (
          <Text style={estilos.texto}>
            Nenhum treinamento vencendo nos próximos 120 dias.
          </Text>
        )}

        <Rodape geradoEm={geradoEm} />
      </Page>
    </Document>
  );
}
