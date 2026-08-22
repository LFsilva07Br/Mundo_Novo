/**
 * Módulo Social & Colaboradores — dados reais da planilha
 * "LISTA DE TRABALHADORES - DUTRA DA SERRA" enviada pela cliente.
 */

export type Trabalhador = {
  nome: string;
  funcao: string;
  cbo: string;
  fazenda: string;
  salario: number;
  admissao: string; // ISO
  nascimento: string; // ISO
  genero: "Masculino" | "Feminino";
  moradia: boolean;
  insalubridade: boolean;
  periculosidade: boolean;
  funcoesHabilitadas: string[];
};

export const TRABALHADORES_DEMO: Trabalhador[] = [
  { nome: "Antonio Sales Ferreira", funcao: "Trabalhador Agrop. em Geral", cbo: "621005", fazenda: "Alto da Serra / Silvio Dutra", salario: 1783.1, admissao: "2017-12-20", nascimento: "1970-03-26", genero: "Masculino", moradia: true, insalubridade: false, periculosidade: false, funcoesHabilitadas: ["Trator", "Benefício", "Outros"] },
  { nome: "Delorme de Abreu", funcao: "Trabalhador Agrop. em Geral", cbo: "621005", fazenda: "Alto da Serra / Silvio Dutra", salario: 1783.1, admissao: "2016-05-10", nascimento: "1953-02-08", genero: "Masculino", moradia: true, insalubridade: false, periculosidade: false, funcoesHabilitadas: ["Outros"] },
  { nome: "Edio Araujo dos Santos", funcao: "Trabalhador Agrop. em Geral", cbo: "621005", fazenda: "Alto da Serra / Silvio Dutra", salario: 1783.1, admissao: "2026-06-05", nascimento: "1971-09-23", genero: "Masculino", moradia: true, insalubridade: false, periculosidade: false, funcoesHabilitadas: ["Outros"] },
  { nome: "Leandra Carla de Oliveira Pandini", funcao: "Trabalhador Agrop. em Geral", cbo: "621005", fazenda: "Alto da Serra / Silvio Dutra", salario: 1783.1, admissao: "2026-06-05", nascimento: "1981-02-11", genero: "Feminino", moradia: true, insalubridade: false, periculosidade: false, funcoesHabilitadas: ["Outros"] },
  { nome: "Ricardo Aparecido de Abreu", funcao: "Tratorista Agrícola", cbo: "641015", fazenda: "Alto da Serra / Silvio Dutra", salario: 1890, admissao: "2020-02-11", nascimento: "1986-04-17", genero: "Masculino", moradia: false, insalubridade: true, periculosidade: false, funcoesHabilitadas: ["Abastecimento", "Aplicação de defensivos", "Colhedeira", "Trator", "Lavador", "Outros"] },
  { nome: "Rogerio Aparecido de Abreu", funcao: "Tratorista Agrícola", cbo: "641015", fazenda: "Alto da Serra / Silvio Dutra", salario: 1890, admissao: "2016-05-10", nascimento: "1980-05-29", genero: "Masculino", moradia: false, insalubridade: false, periculosidade: false, funcoesHabilitadas: ["Trator", "Lavador", "Outros"] },
];

export type Moradia = {
  casa: string;
  totalMoradores: number;
  moradores: { nome: string; parentesco: string }[];
};

export const MORADIAS_DEMO: Moradia[] = [
  {
    casa: "Casa 01",
    totalMoradores: 5,
    moradores: [
      { nome: "Antônio Sales Ferreira", parentesco: "Colaborador" },
      { nome: "Josiane Maria Emygdio", parentesco: "Esposa" },
      { nome: "Fabricio", parentesco: "Filho" },
      { nome: "Gustavo Henrique Emygdio dos Santos", parentesco: "Enteado" },
      { nome: "Francisco Emygdio da Silva", parentesco: "Enteado" },
    ],
  },
  {
    casa: "Casa 02",
    totalMoradores: 2,
    moradores: [
      { nome: "Delorme de Abreu", parentesco: "Colaborador" },
      { nome: "Jacilda Damacena de Abreu", parentesco: "Esposa" },
    ],
  },
  {
    casa: "Casa 03",
    totalMoradores: 6,
    moradores: [],
  },
];

export type Treinamento = {
  nome: string;
  periodicidadeMeses: number;
  participantes: number;
  totalTrabalhadores: number;
  ultimaRealizacao?: string; // ISO — turma mais antiga ainda válida
};

export const TREINAMENTOS_DEMO: Treinamento[] = [
  { nome: "Defensivos (NR-31)", periodicidadeMeses: 12, participantes: 2, totalTrabalhadores: 6, ultimaRealizacao: "2026-03-06" },
  { nome: "Noções de Primeiros Socorros", periodicidadeMeses: 12, participantes: 6, totalTrabalhadores: 6, ultimaRealizacao: "2026-03-03" },
  { nome: "NR 11 e 17 — Ergonomia", periodicidadeMeses: 12, participantes: 6, totalTrabalhadores: 6, ultimaRealizacao: "2026-03-02" },
  { nome: "Prevenção de Acidentes e Uso de EPI", periodicidadeMeses: 12, participantes: 6, totalTrabalhadores: 6, ultimaRealizacao: "2026-03-02" },
  { nome: "Combate a Incêndio", periodicidadeMeses: 12, participantes: 2, totalTrabalhadores: 6, ultimaRealizacao: "2026-06-08" },
  { nome: "Colhedeira (NR-31)", periodicidadeMeses: 24, participantes: 0, totalTrabalhadores: 6 },
];

/** Vencimento de um treinamento: última realização + periodicidade. */
export function vencimentoTreinamento(t: Treinamento): Date | null {
  if (!t.ultimaRealizacao) return null;
  const data = new Date(`${t.ultimaRealizacao}T12:00:00`);
  data.setMonth(data.getMonth() + t.periodicidadeMeses);
  return data;
}

export type ExamesCargo = {
  cargo: string;
  periodicidade: string;
  exames: string[];
};

export const EXAMES_POR_CARGO: ExamesCargo[] = [
  { cargo: "Tratorista Agrícola", periodicidade: "Anual", exames: ["Avaliação Clínica Ocupacional", "Hemograma com contagem de plaquetas", "Acetilcolinesterase eritrocitária", "Audiometria tonal ocupacional", "Avaliação da acuidade visual"] },
  { cargo: "Trabalhador Rural", periodicidade: "Anual", exames: ["Avaliação Clínica Ocupacional"] },
  { cargo: "Operador de Secador", periodicidade: "Anual", exames: ["Avaliação Clínica Ocupacional", "Audiometria tonal ocupacional"] },
  { cargo: "Auxiliar de Escritório", periodicidade: "Bienal", exames: ["Avaliação Clínica Ocupacional"] },
];
