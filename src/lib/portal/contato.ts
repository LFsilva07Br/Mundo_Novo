/**
 * Contatos de ajuda mostrados no rodapé do Portal do Produtor, nas telas de
 * acesso e no canal público de queixas.
 *
 * Ficam aqui, em um só lugar, para o time trocar telefone/consultor sem
 * caçar texto espalhado pelas telas. Podem ser sobrescritos por variável de
 * ambiente no deploy (sem precisar de novo build de código).
 *
 * IMPORTANTE (RA 1.5.1): o contato do CANAL DE QUEIXAS é obrigatoriamente
 * diferente do contato do portal. Quem denuncia não pode ser jogado para o
 * consultor que atende a fazenda — o canal é da certificadora.
 */

export type ContatoAjuda = {
  /** Quem atende (pessoa ou equipe). */
  nome: string;
  /** O que essa pessoa/equipe resolve, em linguagem de produtor. */
  papel: string;
  /** Telefone em formato legível, ex.: "(35) 3531-0000". */
  telefone: string;
  /** WhatsApp em formato legível; o link é montado a partir dele. */
  whatsapp: string;
  /** E-mail de contato. */
  email: string;
};

function env(chave: string, padrao: string): string {
  const valor = process.env[chave];
  return valor && valor.trim() !== "" ? valor.trim() : padrao;
}

/** Ajuda do dia a dia do produtor: consultor da fazenda. */
export const CONTATO_PORTAL: ContatoAjuda = {
  nome: env("NEXT_PUBLIC_CONTATO_PORTAL_NOME", "Silvio Dutra"),
  papel: env(
    "NEXT_PUBLIC_CONTATO_PORTAL_PAPEL",
    "seu consultor da Mundo Novo Café",
  ),
  telefone: env("NEXT_PUBLIC_CONTATO_PORTAL_TELEFONE", "(35) 3531-1000"),
  whatsapp: env("NEXT_PUBLIC_CONTATO_PORTAL_WHATSAPP", "(35) 99999-1000"),
  email: env("NEXT_PUBLIC_CONTATO_PORTAL_EMAIL", "consultoria@mundonovo.agr.br"),
};

/**
 * Canal de queixas: equipe de certificação, NUNCA o consultor da fazenda.
 * Se um dia alguém apontar os dois para o mesmo número, o teste quebra.
 */
export const CONTATO_QUEIXAS: ContatoAjuda = {
  nome: env("NEXT_PUBLIC_CONTATO_QUEIXAS_NOME", "Equipe de Certificação"),
  papel: env(
    "NEXT_PUBLIC_CONTATO_QUEIXAS_PAPEL",
    "equipe de certificação Mundo Novo — não trabalha na fazenda e não fala com o patrão sobre quem procurou o canal",
  ),
  telefone: env("NEXT_PUBLIC_CONTATO_QUEIXAS_TELEFONE", "(35) 3531-1555"),
  whatsapp: env("NEXT_PUBLIC_CONTATO_QUEIXAS_WHATSAPP", "(35) 99888-1555"),
  email: env("NEXT_PUBLIC_CONTATO_QUEIXAS_EMAIL", "escuta@mundonovo.agr.br"),
};

/** Só os dígitos, para montar o link do WhatsApp (padrão Brasil). */
export function linkWhatsapp(numero: string): string {
  const digitos = numero.replace(/\D/g, "");
  return `https://wa.me/55${digitos}`;
}

/** Link de discagem direta a partir do telefone legível. */
export function linkTelefone(numero: string): string {
  return `tel:+55${numero.replace(/\D/g, "")}`;
}
