import nodemailer from "nodemailer";

/**
 * Remetente de e-mail por SMTP genérico (gratuito com Gmail e senha de app).
 *
 * Variáveis de ambiente:
 * - SMTP_HOST — servidor SMTP (ex.: smtp.gmail.com)
 * - SMTP_PORT — porta (padrão 587; 465 liga TLS implícito)
 * - SMTP_USER — usuário/login (ex.: conta do Gmail)
 * - SMTP_PASS — senha (no Gmail, uma "senha de app")
 * - SMTP_FROM — remetente exibido (padrão: SMTP_USER)
 *
 * Todo envio é registrado na tabela `envios_email` (pendente → enviado/falha).
 * Falha de e-mail NUNCA derruba o fluxo chamador: sem SMTP configurado o
 * registro fica pendente com o erro "SMTP não configurado" e nada é lançado.
 */

export type VariaveisSmtp = Record<string, string | undefined>;

export type OpcoesTransporte = {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
};

export type MensagemEmail = {
  para: string;
  assunto: string;
  html: string;
  /** Origem do disparo, gravada no registro (ex.: "gatilho", "resumo-semanal"). */
  origem: string;
};

export type ResultadoEnvio = {
  /** true quando a mensagem saiu de fato pelo SMTP. */
  enviado: boolean;
  /** Status gravado em envios_email. */
  status: "pendente" | "enviado" | "falha";
  erro?: string;
};

/** Cliente de banco mínimo exigido pelo envio (compatível com o service client). */
export type ClienteEnvios = {
  from(tabela: string): {
    insert(valores: Record<string, unknown>): {
      select(colunas: string): {
        single(): PromiseLike<{
          data: { id: string } | null;
          error: { message: string } | null;
        }>;
      };
    };
    update(valores: Record<string, unknown>): {
      eq(
        coluna: string,
        valor: string,
      ): PromiseLike<{ error: { message: string } | null }>;
    };
  };
};

/**
 * Monta as opções do transporte nodemailer a partir das variáveis de
 * ambiente (função pura). Devolve null quando falta host, usuário ou senha.
 */
export function montarOpcoesTransporte(
  env: VariaveisSmtp,
): OpcoesTransporte | null {
  const host = env.SMTP_HOST?.trim();
  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  const porta = Number(env.SMTP_PORT ?? "587");
  const port = Number.isFinite(porta) && porta > 0 ? porta : 587;
  return { host, port, secure: port === 465, auth: { user, pass } };
}

/** Remetente exibido nos e-mails: SMTP_FROM, com fallback para SMTP_USER. */
export function remetentePadrao(env: VariaveisSmtp): string | null {
  return env.SMTP_FROM?.trim() || env.SMTP_USER?.trim() || null;
}

/** true quando o SMTP está configurado (host, usuário e senha presentes). */
export function emailConfigurado(
  env: VariaveisSmtp = process.env,
): boolean {
  return montarOpcoesTransporte(env) !== null;
}

type DependenciasEnvio = {
  /** Variáveis de ambiente (padrão: process.env) — injetável nos testes. */
  env?: VariaveisSmtp;
  /** Função de transporte — injetável nos testes (padrão: nodemailer). */
  transportar?: (
    opcoes: OpcoesTransporte,
    mensagem: { from: string; to: string; subject: string; html: string },
  ) => Promise<void>;
};

async function transportarComNodemailer(
  opcoes: OpcoesTransporte,
  mensagem: { from: string; to: string; subject: string; html: string },
): Promise<void> {
  const transporte = nodemailer.createTransport(opcoes);
  try {
    await transporte.sendMail(mensagem);
  } finally {
    transporte.close();
  }
}

/**
 * Registra o envio em `envios_email` e tenta despachar pelo SMTP.
 *
 * Fluxo: grava como "pendente" → envia → atualiza para "enviado" (com
 * enviado_em) ou "falha" (com o erro). Sem SMTP configurado, o registro
 * permanece "pendente" com o erro "SMTP não configurado". Nunca lança.
 */
export async function enviarEmail(
  mensagem: MensagemEmail,
  supabase: ClienteEnvios,
  deps: DependenciasEnvio = {},
): Promise<ResultadoEnvio> {
  const env = deps.env ?? process.env;
  const transportar = deps.transportar ?? transportarComNodemailer;

  // 1. Registra o envio como pendente (auditoria em /painel/emails).
  let registroId: string | null = null;
  try {
    const { data } = await supabase
      .from("envios_email")
      .insert({
        destinatario: mensagem.para,
        assunto: mensagem.assunto,
        corpo_html: mensagem.html,
        origem: mensagem.origem,
        status: "pendente",
      })
      .select("id")
      .single();
    registroId = data?.id ?? null;
  } catch {
    registroId = null;
  }

  async function atualizarRegistro(valores: Record<string, unknown>) {
    if (!registroId) return;
    try {
      await supabase.from("envios_email").update(valores).eq("id", registroId);
    } catch {
      // Auditoria não pode derrubar o fluxo chamador.
    }
  }

  // 2. Sem SMTP configurado: fica pendente, com o motivo anotado.
  const opcoes = montarOpcoesTransporte(env);
  const remetente = remetentePadrao(env);
  if (!opcoes || !remetente) {
    const erro = "SMTP não configurado";
    await atualizarRegistro({ erro });
    return { enviado: false, status: "pendente", erro };
  }

  // 3. Tenta enviar e atualiza o registro conforme o resultado.
  try {
    await transportar(opcoes, {
      from: remetente,
      to: mensagem.para,
      subject: mensagem.assunto,
      html: mensagem.html,
    });
    await atualizarRegistro({
      status: "enviado",
      erro: null,
      enviado_em: new Date().toISOString(),
    });
    return { enviado: true, status: "enviado" };
  } catch (excecao) {
    const erro =
      excecao instanceof Error ? excecao.message : "erro desconhecido no envio";
    await atualizarRegistro({ status: "falha", erro });
    return { enviado: false, status: "falha", erro };
  }
}
