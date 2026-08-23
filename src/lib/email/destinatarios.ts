/**
 * Seleção de destinatários dos e-mails automáticos (funções puras).
 *
 * Regras do produto:
 * - Alerta de tarefa vai para os contatos por área do cliente
 *   (`contatos_cliente` com e-mail preenchido).
 * - Resumo semanal (e o fallback quando o cliente não tem contato com
 *   e-mail) vai para os gestores: perfis com papel gestor/diretoria,
 *   ativos, com e-mail e sem vínculo a cliente (usuários internos).
 */

export type ContatoComEmail = {
  email: string | null;
};

export type PerfilGestor = {
  email?: string | null;
  papel?: string | null;
  ativo?: boolean | null;
  /** Perfis de portal do cliente têm cliente_id — nunca recebem o resumo. */
  cliente_id?: string | null;
};

const PAPEIS_GESTORES = new Set(["gestor", "diretoria"]);

function normalizar(lista: (string | null | undefined)[]): string[] {
  const vistos = new Set<string>();
  const resultado: string[] = [];
  for (const bruto of lista) {
    const email = bruto?.trim();
    if (!email || !email.includes("@")) continue;
    const chave = email.toLowerCase();
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    resultado.push(email);
  }
  return resultado;
}

/** E-mails válidos e únicos dos contatos do cliente. */
export function emailsDosContatos(contatos: ContatoComEmail[]): string[] {
  return normalizar(contatos.map((c) => c.email));
}

/** E-mails dos gestores/diretoria ativos, internos (sem cliente_id). */
export function emailsDosGestores(perfis: PerfilGestor[]): string[] {
  return normalizar(
    perfis
      .filter(
        (p) =>
          PAPEIS_GESTORES.has(p.papel ?? "") &&
          p.ativo !== false &&
          p.cliente_id == null,
      )
      .map((p) => p.email),
  );
}
