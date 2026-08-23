import type { Capa, SeveridadeNc, StatusCapa } from "@/lib/certificacao/consultas";
import { diasAte } from "@/lib/vencimentos";

/**
 * Tradução do jargão da certificação para a linguagem do produtor.
 *
 * A regra do projeto é sempre "frase humana (termo técnico)": o produtor
 * entende o que precisa fazer e continua reconhecendo o termo que o auditor
 * vai usar na visita.
 */

/** Termo técnico -> frase humana. A ordem importa: termos mais longos primeiro. */
const GLOSSARIO: Array<{ termo: string; humano: string }> = [
  { termo: "NR-31", humano: "regras de segurança do trabalho no campo" },
  { termo: "NR 31", humano: "regras de segurança do trabalho no campo" },
  { termo: "CAPA", humano: "plano de correção" },
  { termo: "APP", humano: "faixa de mata que protege rios e nascentes" },
  { termo: "EPI", humano: "equipamento de proteção (luva, bota, máscara)" },
  { termo: "EPIs", humano: "equipamentos de proteção (luva, bota, máscara)" },
  { termo: "NC", humano: "falha apontada na auditoria" },
  { termo: "RA", humano: "certificação Rainforest Alliance" },
  { termo: "CAR", humano: "cadastro ambiental da propriedade" },
  { termo: "ART", humano: "documento assinado por um técnico responsável" },
  { termo: "PGRS", humano: "plano de destino do lixo da fazenda" },
  { termo: "MIP", humano: "controle de pragas com menos veneno" },
];

/**
 * Troca os termos técnicos do texto por "frase humana (termo técnico)".
 * Só troca quando o termo aparece isolado (não mexe em "APPARATO", por
 * exemplo) e só na primeira aparição de cada termo, para não virar ladainha.
 */
/** Termo isolado: não casa dentro de "APPARATO" nem de "CAPACETE". */
function padraoDoTermo(termo: string): RegExp {
  const escapado = termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapado}(?![\\p{L}\\p{N}])`, "u");
}

export function traduzirJargao(texto: string): string {
  let resultado = texto;
  for (const { termo, humano } of GLOSSARIO) {
    const padrao = padraoDoTermo(termo);
    if (!padrao.test(resultado)) continue;
    resultado = resultado.replace(padrao, `${humano} (${termo})`);
  }
  return resultado;
}

/** Termos técnicos presentes no texto — útil para explicar em lista à parte. */
export function jargaoEncontrado(texto: string): string[] {
  return GLOSSARIO.filter(({ termo }) => padraoDoTermo(termo).test(texto)).map(
    ({ termo }) => termo,
  );
}

// ------------------------------------------------------------------
// Urgência única da pendência
// ------------------------------------------------------------------

export type NivelUrgencia = "atrasada" | "urgente" | "esta_semana" | "planejada";

export type Urgencia = {
  nivel: NivelUrgencia;
  /** A ÚNICA etiqueta mostrada no cartão — nada de rótulos concorrentes. */
  rotulo: string;
  classe: string;
  /** O que acontece se não for resolvido. Sempre presente. */
  consequencia: string;
  /** Situação atual, em frase — não é etiqueta, é explicação. */
  situacao: string;
};

const SITUACAO: Record<StatusCapa, string> = {
  aberta: "Ainda não começou.",
  em_correcao: "Já está sendo corrigido.",
  aguardando_evidencia: "Falta você enviar a foto do que foi feito.",
  fechada: "Resolvida.",
};

const CONSEQUENCIA: Record<SeveridadeNc, string> = {
  critica:
    "Se não for resolvido, a fazenda pode perder o certificado e deixar de vender o café como certificado.",
  maior:
    "Se não for resolvido até o prazo, isso vira uma falha na auditoria e trava a renovação do certificado.",
  menor:
    "Se não for resolvido, entra como observação na próxima auditoria e pode virar uma falha maior depois.",
};

/**
 * Uma pendência mostra UMA etiqueta só. Antes o cartão tinha severidade
 * ("Importante"), status ("Em correção") e vencimento ("Crítico") lado a
 * lado, se contradizendo. Agora o prazo e a gravidade viram um único nível,
 * e o status é explicado em frase.
 */
export function urgenciaDaPendencia(
  capa: Pick<Capa, "severidade" | "status" | "prazo">,
  hoje: Date = new Date(),
): Urgencia {
  const consequencia = CONSEQUENCIA[capa.severidade];
  const situacao = SITUACAO[capa.status];
  const dias = capa.prazo
    ? diasAte(new Date(`${capa.prazo}T12:00:00`), hoje)
    : null;

  if (dias !== null && dias < 0) {
    return {
      nivel: "atrasada",
      rotulo: `Atrasada há ${Math.abs(dias)} ${Math.abs(dias) === 1 ? "dia" : "dias"}`,
      classe: "bg-destructive/15 text-destructive",
      consequencia,
      situacao,
    };
  }

  if (capa.severidade === "critica") {
    return {
      nivel: "urgente",
      rotulo: dias === null ? "Resolver agora" : `Resolver agora · ${prazoEmDias(dias)}`,
      classe: "bg-destructive/15 text-destructive",
      consequencia,
      situacao,
    };
  }

  if (dias !== null && dias <= 15) {
    return {
      nivel: "esta_semana",
      rotulo: `Resolver logo · ${prazoEmDias(dias)}`,
      classe: "bg-warning/15 text-warning",
      consequencia,
      situacao,
    };
  }

  return {
    nivel: "planejada",
    rotulo: dias === null ? "Pode planejar" : `Pode planejar · ${prazoEmDias(dias)}`,
    classe: "bg-secondary text-secondary-foreground",
    consequencia,
    situacao,
  };
}

function prazoEmDias(dias: number): string {
  if (dias === 0) return "o prazo vence hoje";
  if (dias === 1) return "falta 1 dia";
  return `faltam ${dias} dias`;
}

// ------------------------------------------------------------------
// Faixa de situação do portal ("está tudo certo?")
// ------------------------------------------------------------------

export type Situacao = {
  /** Resposta única e grande para "está tudo certo?". */
  titulo: string;
  /** Uma frase explicando o porquê. */
  explicacao: string;
  /** Conformidade traduzida: "Sua fazenda cumpre 88 de cada 100 exigências". */
  conformidadeEmPalavras: string | null;
  tom: "ok" | "atencao" | "problema";
  acao: { rotulo: string; href: string };
};

/**
 * Resposta única para "está tudo certo?". Antes o topo mostrava
 * "88% CONFORMIDADE" ao lado de "Vencido" — dois recados opostos. Agora o
 * certificado vencido manda no recado, e o percentual vira contexto.
 */
export function situacaoDaFazenda(entrada: {
  conformidade?: number | null;
  certificadoVencido: boolean;
  diasParaVencer: number | null;
  pendenciasAbertas: number;
}): Situacao {
  const conformidadeEmPalavras =
    typeof entrada.conformidade === "number"
      ? `Sua fazenda cumpre ${Math.round(entrada.conformidade)} de cada 100 exigências da certificação.`
      : null;

  if (entrada.certificadoVencido) {
    return {
      titulo: "Não. Seu certificado está vencido.",
      explicacao:
        "Enquanto estiver vencido, o café da sua fazenda não pode ser vendido como certificado. A equipe Mundo Novo já está cuidando da renovação — fale com seu consultor para acelerar.",
      conformidadeEmPalavras,
      tom: "problema",
      acao: { rotulo: "Falar com meu consultor", href: "#ajuda-portal" },
    };
  }

  if (entrada.diasParaVencer !== null && entrada.diasParaVencer <= 90) {
    return {
      titulo: `Quase. Seu certificado vence em ${entrada.diasParaVencer} dias.`,
      explicacao:
        "Dá tempo de renovar sem susto, mas é hora de começar. A equipe Mundo Novo acompanha você na renovação.",
      conformidadeEmPalavras,
      tom: "atencao",
      acao:
        entrada.pendenciasAbertas > 0
          ? { rotulo: "Ver o que falta resolver", href: "/portal/pendencias" }
          : { rotulo: "Falar com meu consultor", href: "#ajuda-portal" },
    };
  }

  if (entrada.pendenciasAbertas > 0) {
    const quantas =
      entrada.pendenciasAbertas === 1
        ? "1 coisa para resolver"
        : `${entrada.pendenciasAbertas} coisas para resolver`;
    return {
      titulo: `Quase. Você tem ${quantas}.`,
      explicacao:
        "O certificado está em dia, mas ainda falta acertar esses pontos na fazenda antes da próxima auditoria.",
      conformidadeEmPalavras,
      tom: "atencao",
      acao: { rotulo: "Ver o que falta resolver", href: "/portal/pendencias" },
    };
  }

  return {
    titulo: "Sim, está tudo certo com a sua fazenda.",
    explicacao:
      "Certificado em dia e nenhuma pendência aberta. Continue guardando os registros e recebendo as visitas do consultor.",
    conformidadeEmPalavras,
    tom: "ok",
    acao: { rotulo: "Ver os relatórios da fazenda", href: "/portal/relatorios" },
  };
}
