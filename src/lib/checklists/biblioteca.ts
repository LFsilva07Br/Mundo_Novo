/**
 * Biblioteca multi-normas — templates prontos de checklist para as normas
 * que a consultoria atende além da Rainforest Alliance: 4C e Orgânico
 * (IBD/BR). Dados puros: a ação criarChecklistDeTemplate() transforma um
 * template em checklist com a versão 1 em RASCUNHO (a publicação continua
 * sendo um passo manual — regra do checklist versionado).
 */

export type NormaBiblioteca = "quatro_c" | "organico";

export type ItemBiblioteca = {
  codigo: string;
  capitulo: string;
  pergunta: string;
  referenciaNorma: string;
  obrigatorio: boolean;
  /** Fotos mínimas exigidas em uma NC (1–2 nos templates). */
  fotosMinimas: number;
  /** Descrição mínima da NC em caracteres (80–100 nos templates). */
  descricaoMinima: number;
};

export type TemplateChecklist = {
  norma: NormaBiblioteca;
  nome: string;
  versaoNorma: string;
  /** Frase curta de negócio exibida na escolha da biblioteca. */
  descricao: string;
  itens: ItemBiblioteca[];
};

const ITENS_4C: ItemBiblioteca[] = [
  {
    codigo: "4C-1.1",
    capitulo: "Dimensão econômica",
    pergunta:
      "Registros de produção e de vendas do café mantidos atualizados e disponíveis por unidade produtiva.",
    referenciaNorma: "4C v4 — princípio 1.1 (gestão)",
    obrigatorio: true,
    fotosMinimas: 1,
    descricaoMinima: 80,
  },
  {
    codigo: "4C-1.2",
    capitulo: "Dimensão econômica",
    pergunta:
      "Preço e condições de venda transparentes ao produtor, com comprovantes das negociações do café 4C.",
    referenciaNorma: "4C v4 — princípio 1.4 (transparência)",
    obrigatorio: true,
    fotosMinimas: 1,
    descricaoMinima: 80,
  },
  {
    codigo: "4C-1.3",
    capitulo: "Dimensão econômica",
    pergunta:
      "Mecanismo de reclamações acessível aos trabalhadores e à comunidade, com registro e resposta das queixas.",
    referenciaNorma: "4C v4 — princípio 1.5 (reclamações)",
    obrigatorio: true,
    fotosMinimas: 1,
    descricaoMinima: 80,
  },
  {
    codigo: "4C-2.1",
    capitulo: "Dimensão social",
    pergunta:
      "Ausência de trabalho infantil e de trabalho forçado em todas as atividades da unidade produtiva.",
    referenciaNorma: "4C v4 — princípio 2.1 (trabalho infantil e forçado)",
    obrigatorio: true,
    fotosMinimas: 1,
    descricaoMinima: 100,
  },
  {
    codigo: "4C-2.2",
    capitulo: "Dimensão social",
    pergunta:
      "Contratos de trabalho formalizados, com jornada e remuneração conforme a legislação trabalhista.",
    referenciaNorma: "4C v4 — princípio 2.2 (condições de trabalho)",
    obrigatorio: true,
    fotosMinimas: 1,
    descricaoMinima: 90,
  },
  {
    codigo: "4C-2.3",
    capitulo: "Dimensão social",
    pergunta:
      "EPIs adequados fornecidos gratuitamente e usados nas atividades de risco (aplicação, colheita, beneficiamento).",
    referenciaNorma: "4C v4 — princípio 2.4 (saúde e segurança)",
    obrigatorio: true,
    fotosMinimas: 2,
    descricaoMinima: 90,
  },
  {
    codigo: "4C-2.4",
    capitulo: "Dimensão social",
    pergunta:
      "Treinamentos de segurança e de boas práticas registrados, com lista de presença assinada pelos participantes.",
    referenciaNorma: "4C v4 — princípio 2.5 (capacitação)",
    obrigatorio: true,
    fotosMinimas: 1,
    descricaoMinima: 80,
  },
  {
    codigo: "4C-3.1",
    capitulo: "Dimensão ambiental",
    pergunta:
      "Nenhum agrotóxico da lista de banidos 4C (pesticidas proibidos) em uso ou em estoque na propriedade.",
    referenciaNorma: "4C v4 — princípio 3.2 (agrotóxicos banidos)",
    obrigatorio: true,
    fotosMinimas: 2,
    descricaoMinima: 100,
  },
  {
    codigo: "4C-3.2",
    capitulo: "Dimensão ambiental",
    pergunta:
      "Registros das aplicações de defensivos com produto, dose, data, aplicador e equipamento utilizados.",
    referenciaNorma: "4C v4 — princípio 3.3 (manejo de agroquímicos)",
    obrigatorio: true,
    fotosMinimas: 1,
    descricaoMinima: 80,
  },
  {
    codigo: "4C-3.3",
    capitulo: "Dimensão ambiental",
    pergunta:
      "Água do beneficiamento úmido tratada antes do descarte; efluentes não lançados diretamente em cursos d'água.",
    referenciaNorma: "4C v4 — princípio 3.6 (água e efluentes)",
    obrigatorio: true,
    fotosMinimas: 2,
    descricaoMinima: 100,
  },
  {
    codigo: "4C-3.4",
    capitulo: "Dimensão ambiental",
    pergunta:
      "Mata nativa preservada — sem desmatamento de floresta primária ou de áreas de alto valor de conservação desde 2014.",
    referenciaNorma: "4C v4 — princípio 3.1 (desmatamento)",
    obrigatorio: true,
    fotosMinimas: 2,
    descricaoMinima: 100,
  },
  {
    codigo: "4C-3.5",
    capitulo: "Dimensão ambiental",
    pergunta:
      "Embalagens vazias de agrotóxicos com tríplice lavagem e devolvidas ao ponto de recebimento licenciado.",
    referenciaNorma: "4C v4 — princípio 3.4 (resíduos)",
    obrigatorio: true,
    fotosMinimas: 1,
    descricaoMinima: 80,
  },
];

const ITENS_ORGANICO: ItemBiblioteca[] = [
  {
    codigo: "ORG-1.1",
    capitulo: "Insumos e manejo",
    pergunta:
      "Somente insumos permitidos para a produção orgânica em uso e em estoque (sem agrotóxicos ou adubos sintéticos).",
    referenciaNorma: "IN 46/2011 (BR) — insumos permitidos · IBD",
    obrigatorio: true,
    fotosMinimas: 2,
    descricaoMinima: 100,
  },
  {
    codigo: "ORG-1.2",
    capitulo: "Insumos e manejo",
    pergunta:
      "Adubação baseada em compostos orgânicos, adubos verdes e biofertilizantes, com registro das aplicações.",
    referenciaNorma: "IN 46/2011 (BR) — fertilidade do solo · IBD",
    obrigatorio: true,
    fotosMinimas: 1,
    descricaoMinima: 80,
  },
  {
    codigo: "ORG-1.3",
    capitulo: "Insumos e manejo",
    pergunta:
      "Controle de pragas e doenças por métodos biológicos e culturais, sem produtos de síntese química.",
    referenciaNorma: "IN 46/2011 (BR) — controle biológico · IBD",
    obrigatorio: true,
    fotosMinimas: 1,
    descricaoMinima: 80,
  },
  {
    codigo: "ORG-1.4",
    capitulo: "Insumos e manejo",
    pergunta:
      "Sementes e mudas de origem orgânica; quando indisponíveis, uso não orgânico justificado e documentado.",
    referenciaNorma: "IN 46/2011 (BR) — sementes e mudas · IBD",
    obrigatorio: true,
    fotosMinimas: 1,
    descricaoMinima: 80,
  },
  {
    codigo: "ORG-2.1",
    capitulo: "Conversão e contaminação",
    pergunta:
      "Período de conversão (12–18 meses) cumprido e documentado para todas as áreas em transição ao orgânico.",
    referenciaNorma: "IN 46/2011 (BR) — período de conversão · IBD",
    obrigatorio: true,
    fotosMinimas: 1,
    descricaoMinima: 90,
  },
  {
    codigo: "ORG-2.2",
    capitulo: "Conversão e contaminação",
    pergunta:
      "Barreiras vegetais ou faixas de segurança contra deriva de agrotóxicos das lavouras vizinhas convencionais.",
    referenciaNorma: "IN 46/2011 (BR) — barreiras de contaminação · IBD",
    obrigatorio: true,
    fotosMinimas: 2,
    descricaoMinima: 90,
  },
  {
    codigo: "ORG-3.1",
    capitulo: "Rastreabilidade e armazenamento",
    pergunta:
      "Lotes de café orgânico identificados e rastreáveis do talhão à venda, com registros de colheita por área.",
    referenciaNorma: "IN 46/2011 (BR) — rastreabilidade · IBD",
    obrigatorio: true,
    fotosMinimas: 1,
    descricaoMinima: 90,
  },
  {
    codigo: "ORG-3.2",
    capitulo: "Rastreabilidade e armazenamento",
    pergunta:
      "Armazenamento segregado do café orgânico, sem contato com produto convencional ou com produtos proibidos.",
    referenciaNorma: "IN 46/2011 (BR) — armazenamento segregado · IBD",
    obrigatorio: true,
    fotosMinimas: 2,
    descricaoMinima: 90,
  },
  {
    codigo: "ORG-3.3",
    capitulo: "Rastreabilidade e armazenamento",
    pergunta:
      "Embalagens limpas, de primeiro uso ou higienizadas, identificadas como produto orgânico.",
    referenciaNorma: "IN 46/2011 (BR) — embalagens · IBD",
    obrigatorio: true,
    fotosMinimas: 1,
    descricaoMinima: 80,
  },
  {
    codigo: "ORG-4.1",
    capitulo: "Gestão e inspeção",
    pergunta:
      "Plano de manejo orgânico atualizado e aprovado, descrevendo áreas, práticas, insumos e medidas de conversão.",
    referenciaNorma: "IN 46/2011 (BR) — plano de manejo orgânico · IBD",
    obrigatorio: true,
    fotosMinimas: 1,
    descricaoMinima: 100,
  },
  {
    codigo: "ORG-4.2",
    capitulo: "Gestão e inspeção",
    pergunta:
      "Registros de manejo (caderno de campo) completos: plantio, tratos, colheita e movimentações do café.",
    referenciaNorma: "IN 46/2011 (BR) — registros de manejo · IBD",
    obrigatorio: true,
    fotosMinimas: 1,
    descricaoMinima: 80,
  },
  {
    codigo: "ORG-4.3",
    capitulo: "Gestão e inspeção",
    pergunta:
      "Inspeção anual da certificadora realizada, com as não conformidades apontadas tratadas dentro do prazo.",
    referenciaNorma: "IN 46/2011 (BR) — inspeção anual · IBD",
    obrigatorio: true,
    fotosMinimas: 1,
    descricaoMinima: 80,
  },
];

export const BIBLIOTECA_NORMAS: Record<NormaBiblioteca, TemplateChecklist> = {
  quatro_c: {
    norma: "quatro_c",
    nome: "Auditoria interna — 4C",
    versaoNorma: "v4",
    descricao:
      "Código de conduta 4C: dimensões econômica, social e ambiental da produção de café.",
    itens: ITENS_4C,
  },
  organico: {
    norma: "organico",
    nome: "Auditoria interna — Orgânico (IBD/BR)",
    versaoNorma: "IN 46/2011",
    descricao:
      "Produção orgânica de café: insumos permitidos, conversão, rastreabilidade e plano de manejo.",
    itens: ITENS_ORGANICO,
  },
};

export const ROTULO_NORMA_BIBLIOTECA: Record<NormaBiblioteca, string> = {
  quatro_c: "4C",
  organico: "Orgânico (IBD/BR)",
};
