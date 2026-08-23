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

export type TipoRegistroContato =
  | "ligacao"
  | "email"
  | "whatsapp"
  | "reuniao"
  | "visita";

/** Registro de contato feito com o cliente (ligação, visita, reunião…). */
export type RegistroContato = {
  id: string;
  clienteId: string;
  tipo: TipoRegistroContato;
  assunto: string;
  detalhes?: string;
  duracaoMinutos?: number;
  /** Nome de quem registrou o contato. */
  autor?: string;
  /** ISO com data e hora. */
  ocorridoEm: string;
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

export const ROTULO_TIPO_REGISTRO: Record<TipoRegistroContato, string> = {
  ligacao: "Ligação",
  email: "E-mail",
  whatsapp: "WhatsApp",
  reuniao: "Reunião",
  visita: "Visita",
};

export const ROTULO_FASE: Record<FaseCliente, string> = {
  implantacao: "Implantação",
  ativo: "Ativo",
  inativo: "Inativo",
};
