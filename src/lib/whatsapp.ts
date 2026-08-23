import { formatarData } from "@/lib/vencimentos";

/**
 * Integração gratuita com o WhatsApp via links `wa.me` — sem API paga:
 * o link abre o WhatsApp (app ou Web) já com o número e a mensagem
 * preenchidos; quem envia é sempre a própria pessoa da equipe.
 */

/**
 * Normaliza um telefone brasileiro para o formato internacional usado
 * pelo WhatsApp (só dígitos, com DDI 55). Aceita máscaras comuns:
 * "(34) 99999-0000", "034 9 9999-0000", "+55 34 99999-0000"…
 * Devolve `null` quando não há dígitos suficientes para um número BR.
 */
export function normalizarTelefoneBr(telefone: string): string | null {
  let digitos = telefone.replace(/\D/g, "");
  // Remove o zero de operadora/discagem à esquerda ("034…" → "34…").
  digitos = digitos.replace(/^0+/, "");
  // Já veio com DDI 55? (DDD + número = 10 ou 11 dígitos após o 55)
  if (digitos.startsWith("55") && digitos.length >= 12 && digitos.length <= 13) {
    return digitos;
  }
  // Sem DDI: precisa ter DDD (2) + número (8 ou 9).
  if (digitos.length === 10 || digitos.length === 11) {
    return `55${digitos}`;
  }
  return null;
}

/**
 * Monta o link `wa.me` com o telefone normalizado e a mensagem codificada.
 * Devolve `null` quando o telefone não é um número BR válido.
 */
export function linkWhatsApp(telefone: string, mensagem: string): string | null {
  const numero = normalizarTelefoneBr(telefone);
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

// ------------------------------------------------------------------
// Modelos de mensagem prontos (pt-BR, tom cordial da equipe)
// ------------------------------------------------------------------

/** Cobrança de plano de ação (CAPA) com prazo. */
export function mensagemCobrancaCapa(dados: {
  cliente: string;
  descricao: string;
  /** ISO yyyy-mm-dd ou null quando a CAPA não tem prazo. */
  prazo: string | null;
}): string {
  const prazoTexto = dados.prazo
    ? ` O prazo combinado é ${formatarData(new Date(`${dados.prazo}T12:00:00`))}.`
    : "";
  return (
    `Olá! Aqui é da equipe Mundo Novo Café. ` +
    `Estamos acompanhando o plano de ação de ${dados.cliente}: ` +
    `"${dados.descricao}".${prazoTexto} ` +
    `Poderia nos atualizar sobre o andamento? Obrigado!`
  );
}

/** Aviso de vencimento de certificado. */
export function mensagemVencimentoCertificado(dados: {
  cliente: string;
  norma: string;
  /** ISO yyyy-mm-dd. */
  venceEm: string;
}): string {
  return (
    `Olá! Aqui é da equipe Mundo Novo Café. ` +
    `O certificado ${dados.norma} de ${dados.cliente} vence em ` +
    `${formatarData(new Date(`${dados.venceEm}T12:00:00`))}. ` +
    `Vamos organizar juntos a renovação? Qualquer dúvida, é só chamar.`
  );
}

/** Lembrete de visita planejada. */
export function mensagemLembreteVisita(dados: {
  cliente: string;
  /** Texto livre: "outubro de 2026" ou uma data formatada. */
  quando: string;
}): string {
  return (
    `Olá! Aqui é da equipe Mundo Novo Café. ` +
    `Temos uma visita planejada em ${dados.cliente} para ${dados.quando}. ` +
    `Podemos confirmar a melhor data? Obrigado!`
  );
}

/** Mensagem padrão para o contato do cliente (link na ficha). */
export function mensagemContatoPadrao(dados: {
  contato: string;
  cliente: string;
}): string {
  return (
    `Olá, ${dados.contato}! Aqui é da equipe Mundo Novo Café, ` +
    `sobre ${dados.cliente}. Tudo bem?`
  );
}
