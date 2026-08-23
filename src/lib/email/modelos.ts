/**
 * Modelos de HTML dos e-mails automáticos (funções puras).
 * O resumo semanal usa `montarResumoHtml` em src/lib/alertas/resumo.ts;
 * aqui fica o alerta de tarefa criado pelo motor de gatilhos.
 */

export type DadosAlertaTarefa = {
  titulo: string;
  detalhe: string;
  vence_em: string;
};

function escaparHtml(texto: string): string {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** HTML simples do alerta de tarefa: título, detalhe e rodapé do sistema. */
export function montarAlertaHtml(tarefa: DadosAlertaTarefa): string {
  return `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2a1f;">
  <h1 style="font-size: 18px;">${escaparHtml(tarefa.titulo)}</h1>
  <p>${escaparHtml(tarefa.detalhe)}</p>
  <p style="color: #55614f;">Vencimento de referência: ${escaparHtml(tarefa.vence_em)}</p>
  <p style="font-size: 12px; color: #8a927f;">Alerta automático do painel Mundo Novo Café — o aviso persiste até a pendência ser resolvida.</p>
</div>`.trim();
}
