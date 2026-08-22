/** Tipos do domínio da carteira (Grupo → Cliente → Imóvel → Talhão). */

export type AdministracaoGrupo = "mundo_novo" | "terceiro";
export type TipoCliente = "fazenda" | "cadeia_suprimentos";
export type FaseCliente = "implantacao" | "ativo" | "inativo";
export type Norma = "ra" | "quatro_c" | "organico";
export type StatusCertificacao =
  | "em_implantacao"
  | "ativa"
  | "em_renovacao"
  | "vencida"
  | "suspensa";

export type Grupo = {
  id: string;
  nome: string;
  administracao: AdministracaoGrupo;
  nomeAdministrador?: string;
  cidade?: string;
  uf?: string;
  contatoNome?: string;
};

export type Certificacao = {
  norma: Norma;
  certificadora?: string;
  principal?: boolean;
  status: StatusCertificacao;
  /** ISO yyyy-mm-dd */
  venceEm?: string;
};

export type ContatoCliente = {
  nome: string;
  area:
    | "proprietario"
    | "ambiental"
    | "agricola"
    | "rh_social"
    | "administrativo"
    | "outro";
  telefone?: string;
  email?: string;
};

export type ImovelRural = {
  nome: string;
  proprietarios?: string;
  car?: string;
  matriculas?: string;
  areaTotalHa: number;
  areaCafeHa: number;
  areaAppHa?: number;
  areaReservaHa?: number;
  possuiCaptacaoAgua?: boolean;
  talhoes?: string;
};

export type Cliente = {
  id: string;
  grupoId: string | null;
  nome: string;
  tipo: TipoCliente;
  fase: FaseCliente;
  produtor?: string;
  cidade: string;
  uf: string;
  regiao: string;
  idRa?: string;
  conformidade?: number;
  certificacoes: Certificacao[];
  contatos?: ContatoCliente[];
  imoveis?: ImovelRural[];
};

export const ROTULO_NORMA: Record<Norma, string> = {
  ra: "Rainforest Alliance",
  quatro_c: "4C",
  organico: "Orgânico",
};

export const ROTULO_AREA_CONTATO: Record<
  NonNullable<ContatoCliente["area"]>,
  string
> = {
  proprietario: "Proprietário",
  ambiental: "Ambiental",
  agricola: "Agrícola / Talhões",
  rh_social: "RH / Social",
  administrativo: "Administrativo",
  outro: "Outro",
};
