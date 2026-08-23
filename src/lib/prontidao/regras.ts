import { diasAte, formatarData } from "@/lib/vencimentos";

/**
 * Régua de prontidão para auditoria externa.
 *
 * A nota parte de 100 e cada pendência desconta um peso fixo. Os pesos
 * refletem o impacto de cada gap numa auditoria real (RA/4C/Orgânico):
 *
 * - Certificado VENCIDO ............ -40  (a auditoria nem começa sem ele)
 * - Certificado a ≤30 dias ......... -15  (renovação urgente)
 * - Certificado a ≤120 dias ........ -5   (renovação a planejar)
 * - CAPA CRÍTICA aberta ............ -35  (não conformidade eliminatória)
 * - CAPA MAIOR aberta .............. -25  (pesa muito: trava a certificação)
 * - CAPA menor aberta .............. -10
 * - CAPA com prazo estourado ....... -10  (adicional, por CAPA)
 * - Documento de imóvel vencido .... -10  (licença/outorga/CAR etc.)
 * - Treinamento vencido ............ -10  (exigência social da norma)
 * - Sem auditoria interna no ano ... -20  (RA 1.4 cap. 1.4.1 exige anual)
 *
 * "Pronta" exige nota ≥ 80 E nenhuma pendência bloqueante
 * (certificado vencido ou CAPA maior/crítica aberta).
 */

export const PESOS_PRONTIDAO = {
  certificadoVencido: 40,
  certificadoCritico: 15,
  certificadoAtencao: 5,
  capaCritica: 35,
  capaMaior: 25,
  capaMenor: 10,
  capaPrazoEstourado: 10,
  documentoVencido: 10,
  treinamentoVencido: 10,
  semVisitaInterna: 20,
} as const;

export const NOTA_MINIMA_PRONTA = 80;

export type CertificacaoProntidao = {
  /** Nome legível da norma (ex.: "Rainforest Alliance"). */
  rotulo: string;
  /** ISO yyyy-mm-dd */
  venceEm?: string;
  status?: string;
};

export type CapaProntidao = {
  severidade: "menor" | "maior" | "critica";
  /** ISO yyyy-mm-dd */
  prazo?: string | null;
  descricao?: string;
};

export type DadosProntidao = {
  certificacoes: CertificacaoProntidao[];
  capasAbertas: CapaProntidao[];
  /** Tipo legível do documento (ex.: "Licença de operação"). */
  documentosVencidos: { tipo: string }[];
  /** Nomes dos treinamentos vencidos para alguém da equipe. */
  treinamentosVencidos: string[];
  /** Houve auditoria interna concluída nos últimos 12 meses? */
  visitaInternaNoAno: boolean;
};

export type ResultadoProntidao = {
  pronta: boolean;
  /** 0 a 100. */
  nota: number;
  /** Pendências legíveis, da mais grave para a mais leve. */
  pendencias: string[];
};

const ROTULO_SEVERIDADE: Record<CapaProntidao["severidade"], string> = {
  menor: "menor",
  maior: "MAIOR",
  critica: "CRÍTICA",
};

function dataLocal(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

/** Aplica a régua de prontidão sobre os dados consolidados de um cliente. */
export function avaliarProntidao(
  dados: DadosProntidao,
  hoje: Date = new Date(),
): ResultadoProntidao {
  const pendencias: { texto: string; peso: number; bloqueante: boolean }[] = [];

  for (const cert of dados.certificacoes) {
    if (cert.status === "suspensa") {
      pendencias.push({
        texto: `Certificação ${cert.rotulo} suspensa`,
        peso: PESOS_PRONTIDAO.certificadoVencido,
        bloqueante: true,
      });
      continue;
    }
    if (!cert.venceEm) continue;
    const dias = diasAte(dataLocal(cert.venceEm), hoje);
    if (dias < 0) {
      pendencias.push({
        texto: `Certificação ${cert.rotulo} vencida em ${formatarData(dataLocal(cert.venceEm))}`,
        peso: PESOS_PRONTIDAO.certificadoVencido,
        bloqueante: true,
      });
    } else if (dias <= 30) {
      pendencias.push({
        texto: `Certificação ${cert.rotulo} vence em ${dias} dia(s)`,
        peso: PESOS_PRONTIDAO.certificadoCritico,
        bloqueante: false,
      });
    } else if (dias <= 120) {
      pendencias.push({
        texto: `Certificação ${cert.rotulo} vence em ${dias} dias — planejar renovação`,
        peso: PESOS_PRONTIDAO.certificadoAtencao,
        bloqueante: false,
      });
    }
  }

  for (const capa of dados.capasAbertas) {
    const pesoBase =
      capa.severidade === "critica"
        ? PESOS_PRONTIDAO.capaCritica
        : capa.severidade === "maior"
          ? PESOS_PRONTIDAO.capaMaior
          : PESOS_PRONTIDAO.capaMenor;
    const prazoEstourado =
      capa.prazo != null && diasAte(dataLocal(capa.prazo), hoje) < 0;
    const peso =
      pesoBase + (prazoEstourado ? PESOS_PRONTIDAO.capaPrazoEstourado : 0);
    const detalhe = capa.descricao ? `: ${capa.descricao}` : "";
    pendencias.push({
      texto: `CAPA ${ROTULO_SEVERIDADE[capa.severidade]} em aberto${
        prazoEstourado ? " (prazo estourado)" : ""
      }${detalhe}`,
      peso,
      bloqueante: capa.severidade !== "menor",
    });
  }

  for (const doc of dados.documentosVencidos) {
    pendencias.push({
      texto: `Documento do imóvel vencido: ${doc.tipo}`,
      peso: PESOS_PRONTIDAO.documentoVencido,
      bloqueante: false,
    });
  }

  for (const treinamento of dados.treinamentosVencidos) {
    pendencias.push({
      texto: `Treinamento vencido: ${treinamento}`,
      peso: PESOS_PRONTIDAO.treinamentoVencido,
      bloqueante: false,
    });
  }

  if (!dados.visitaInternaNoAno) {
    pendencias.push({
      texto: "Sem auditoria interna concluída nos últimos 12 meses",
      peso: PESOS_PRONTIDAO.semVisitaInterna,
      bloqueante: false,
    });
  }

  const desconto = pendencias.reduce((soma, p) => soma + p.peso, 0);
  const nota = Math.max(0, Math.min(100, 100 - desconto));
  const temBloqueante = pendencias.some((p) => p.bloqueante);
  const ordenadas = [...pendencias].sort((a, b) => b.peso - a.peso);

  return {
    pronta: nota >= NOTA_MINIMA_PRONTA && !temBloqueante,
    nota,
    pendencias: ordenadas.map((p) => p.texto),
  };
}
