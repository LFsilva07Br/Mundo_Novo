/**
 * Talhões reais da Fazenda Alto da Serra — planilha
 * "ESTIMATIVA DE SAFRA - PODA E RENOVAÇÃO" enviada pela cliente.
 * Safra de referência: 2025/26 (aba mais recente); histórico consolidado
 * extraído das abas 2021-2022 a 2024-2025.
 */

export type TalhaoDemo = {
  nome: string;
  produtor: string;
  imovel: string;
  areaHa: number;
  plantasPorHa?: number;
  espacamento?: string;
  variedade: string;
  anoPlantio: number;
  /** Estado físico da lavoura na safra 2025/26 */
  estadoLavoura: string;
  previsao2526Sacas: number;
  colheita2425Sacas?: number;
  previsaoPodaRenovacao?: string;
};

export const TALHOES_ALTO_DA_SERRA: TalhaoDemo[] = [
  { nome: "Garagem", produtor: "Sílvio", imovel: "Sítio Alto da Serra (Garagem)", areaHa: 5.34, plantasPorHa: 4081, espacamento: "3,50 x 0,70", variedade: "M. Novo 376-4", anoPlantio: 2010, estadoLavoura: "Produção", previsao2526Sacas: 373.8, colheita2425Sacas: 51, previsaoPodaRenovacao: "Poda e esqueletamento" },
  { nome: "João", produtor: "Sílvio", imovel: "Sítio Alto da Serra", areaHa: 3, plantasPorHa: 4166, espacamento: "3,00 x 0,80", variedade: "Catuaí 99", anoPlantio: 2000, estadoLavoura: "Produção", previsao2526Sacas: 240, colheita2425Sacas: 0 },
  { nome: "João Novo", produtor: "Sílvio", imovel: "Sítio Alto da Serra", areaHa: 4, plantasPorHa: 4761, espacamento: "3,50 x 0,60", variedade: "Catuaí 99", anoPlantio: 2025, estadoLavoura: "Plantio", previsao2526Sacas: 0 },
  { nome: "São Bento", produtor: "Sílvio", imovel: "Sítio Serra da Boa Vista", areaHa: 6.59, plantasPorHa: 4081, espacamento: "3,50 x 0,70", variedade: "M. Novo 376-4", anoPlantio: 2017, estadoLavoura: "Produção", previsao2526Sacas: 527.2, colheita2425Sacas: 0 },
  { nome: "Baixada", produtor: "Sílvio", imovel: "Sítio Alto da Serra (Garagem)", areaHa: 2.32, plantasPorHa: 4201, espacamento: "3,40 x 0,70", variedade: "Icatu Vermelho", anoPlantio: 2019, estadoLavoura: "Produção", previsao2526Sacas: 139.2, colheita2425Sacas: 16 },
  { nome: "Mangueira", produtor: "Sílvio", imovel: "Sítio Alto da Serra (Garagem)", areaHa: 3.71, plantasPorHa: 4201, espacamento: "3,40 x 0,70", variedade: "Catuaí 99", anoPlantio: 2016, estadoLavoura: "Produção", previsao2526Sacas: 111.3, colheita2425Sacas: 211 },
  { nome: "Barracão", produtor: "Sílvio", imovel: "Sítio Alto da Serra (Garagem)", areaHa: 2.1, plantasPorHa: 4201, espacamento: "3,40 x 0,70", variedade: "Arara", anoPlantio: 2020, estadoLavoura: "Produção", previsao2526Sacas: 126, colheita2425Sacas: 14 },
  { nome: "Santa Luzia 1", produtor: "Sílvio", imovel: "Sítio Santa Luzia", areaHa: 1.45, plantasPorHa: 4081, espacamento: "3,50 x 0,70", variedade: "M. Novo 376-4", anoPlantio: 2016, estadoLavoura: "Produção", previsao2526Sacas: 116, colheita2425Sacas: 0 },
  { nome: "Santa Luzia SP", produtor: "Sílvio", imovel: "Sítio Santa Luzia", areaHa: 4.2, espacamento: "3,50 x 0,70", variedade: "M. Novo 376-4", anoPlantio: 2016, estadoLavoura: "Produção", previsao2526Sacas: 336, colheita2425Sacas: 0 },
  { nome: "Santa Luzia 2", produtor: "Sílvio", imovel: "Sítio Santa Luzia", areaHa: 7.87, plantasPorHa: 4081, espacamento: "3,50 x 0,70", variedade: "M. Novo 376-4", anoPlantio: 2014, estadoLavoura: "Produção", previsao2526Sacas: 550.9, colheita2425Sacas: 7, previsaoPodaRenovacao: "Poda" },
  { nome: "Santo Antônio", produtor: "Sílvio", imovel: "Serra da Boa Vista", areaHa: 3.74, plantasPorHa: 3676, espacamento: "3,40 x 0,80", variedade: "M. Novo 376-4", anoPlantio: 2004, estadoLavoura: "Produção", previsao2526Sacas: 187, colheita2425Sacas: 142 },
  { nome: "Tabuleiro", produtor: "Winicius/Tâmara", imovel: "Sítio Tabuleiro", areaHa: 2.6, plantasPorHa: 4202, espacamento: "3,40 x 0,70", variedade: "Colombiano/Arara", anoPlantio: 2021, estadoLavoura: "Produção", previsao2526Sacas: 150 },
  { nome: "Santa Inês 1", produtor: "Carter", imovel: "Sítio Santa Inês", areaHa: 3.38, plantasPorHa: 4464, espacamento: "3,20 x 0,70", variedade: "Catuai 99", anoPlantio: 2014, estadoLavoura: "Produção", previsao2526Sacas: 236.6, colheita2425Sacas: 0 },
  { nome: "Santa Inês 2", produtor: "Carter", imovel: "Sítio Santa Inês", areaHa: 0.62, plantasPorHa: 4201, espacamento: "3,40 x 0,70", variedade: "Icatu Vermelho", anoPlantio: 2019, estadoLavoura: "Produção", previsao2526Sacas: 24.8, colheita2425Sacas: 8 },
  { nome: "Nsª Srª da Aparecida", produtor: "Carter", imovel: "Nossa Senhora Aparecida", areaHa: 6.52, plantasPorHa: 4201, espacamento: "3,40 x 0,70", variedade: "Icatu Vermelho", anoPlantio: 2019, estadoLavoura: "Produção", previsao2526Sacas: 260.8, colheita2425Sacas: 79, previsaoPodaRenovacao: "Poda e esqueletamento" },
  { nome: "Iapar", produtor: "Matheus", imovel: "Sítio São Mateus", areaHa: 0.48, plantasPorHa: 4201, espacamento: "3,40 x 0,70", variedade: "IPR 100", anoPlantio: 2018, estadoLavoura: "Produção", previsao2526Sacas: 20, colheita2425Sacas: 8 },
  { nome: "Arara", produtor: "Matheus", imovel: "Sítio São Mateus", areaHa: 0.72, plantasPorHa: 4201, espacamento: "3,40 x 0,70", variedade: "Arara", anoPlantio: 2020, estadoLavoura: "Produção", previsao2526Sacas: 30, colheita2425Sacas: 12 },
  { nome: "Rubi", produtor: "Matheus", imovel: "Sítio São Mateus", areaHa: 2.18, plantasPorHa: 3676, espacamento: "3,40 x 0,80", variedade: "Rubi MG 1192", anoPlantio: 2006, estadoLavoura: "Esqueletado", previsao2526Sacas: 0, colheita2425Sacas: 0 },
  { nome: "Catuaí 99", produtor: "Matheus", imovel: "Sítio Geovana", areaHa: 1.4, plantasPorHa: 5102, espacamento: "2,80 x 0,70", variedade: "Catuaí 99", anoPlantio: 2000, estadoLavoura: "Esqueletado", previsao2526Sacas: 0, colheita2425Sacas: 0 },
];

/** Comparativo consolidado por safra (previsão × colheita efetiva, em sacas). */
export type SafraConsolidada = {
  safra: string;
  previsaoSacas: number | null;
  colheitaEfetivaSacas: number | null;
  observacao?: string;
};

export const HISTORICO_SAFRAS_ALTO_DA_SERRA: SafraConsolidada[] = [
  { safra: "2021/22", previsaoSacas: 2228, colheitaEfetivaSacas: 2139 },
  { safra: "2022/23", previsaoSacas: 1487, colheitaEfetivaSacas: 1251 },
  { safra: "2023/24", previsaoSacas: 2975, colheitaEfetivaSacas: null, observacao: "colheita não consolidada na planilha" },
  { safra: "2024/25", previsaoSacas: 1080, colheitaEfetivaSacas: 548, observacao: "ano de poda/esqueletamento em vários talhões" },
  { safra: "2025/26", previsaoSacas: 3430, colheitaEfetivaSacas: null, observacao: "em andamento" },
];
