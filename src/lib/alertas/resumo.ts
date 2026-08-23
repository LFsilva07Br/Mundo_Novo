/**
 * Resumo semanal da carteira para o gestor.
 * Funções puras (testáveis) usadas pelo cron /api/resumo-semanal:
 * o route handler coleta os números no banco e este módulo monta o
 * texto da tarefa e o HTML do futuro e-mail.
 */

export type DadosResumoSemanal = {
  /** Segunda-feira da semana do resumo, em ISO (aaaa-mm-dd). */
  semana: string;
  /** Tarefas pendentes agrupadas pela origem (data, evento, manual). */
  tarefasPendentesPorOrigem: { origem: string; total: number }[];
  capasAbertas: number;
  /** CAPAs abertas com prazo nos próximos 7 dias (ou estourado). */
  capasPrazoProximo: number;
  certificadosProximos90Dias: number;
  contratosAguardandoAlcada: number;
};

const ROTULOS_ORIGEM: Record<string, string> = {
  data: "gatilhos por data",
  evento: "gatilhos por evento",
  manual: "criadas manualmente",
};

/** Segunda-feira (00h, fuso local) da semana da data informada, em ISO. */
export function segundaFeiraDaSemana(data: Date = new Date()): string {
  const base = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  // getDay(): 0 = domingo … 6 = sábado; domingo pertence à semana anterior.
  const recuo = (base.getDay() + 6) % 7;
  base.setDate(base.getDate() - recuo);
  const mes = String(base.getMonth() + 1).padStart(2, "0");
  const dia = String(base.getDate()).padStart(2, "0");
  return `${base.getFullYear()}-${mes}-${dia}`;
}

function totalTarefasPendentes(dados: DadosResumoSemanal): number {
  return dados.tarefasPendentesPorOrigem.reduce((soma, o) => soma + o.total, 0);
}

/** Texto curto gravado no campo `detalhe` da tarefa de resumo. */
export function montarDetalheResumo(dados: DadosResumoSemanal): string {
  const porOrigem = dados.tarefasPendentesPorOrigem
    .map((o) => `${o.total} ${ROTULOS_ORIGEM[o.origem] ?? o.origem}`)
    .join(", ");
  return [
    `Tarefas pendentes: ${totalTarefasPendentes(dados)}${porOrigem ? ` (${porOrigem})` : ""}`,
    `CAPAs abertas: ${dados.capasAbertas} (${dados.capasPrazoProximo} com prazo próximo)`,
    `Certificados nos próximos 90 dias: ${dados.certificadosProximos90Dias}`,
    `Contratos aguardando alçada: ${dados.contratosAguardandoAlcada}`,
  ].join(" · ");
}

/**
 * HTML do e-mail semanal do gestor.
 *
 * IMPORTANTE: o envio por e-mail ainda NÃO está plugado — não há serviço
 * de e-mail configurado no projeto. Quando houver (ex.: Resend/SES), o
 * route handler /api/resumo-semanal deve chamar esta função e enviar o
 * resultado ao gestor; até lá, o resumo fica registrado como tarefa na
 * Agenda e no JSON de resposta do cron.
 */
export function montarResumoHtml(dados: DadosResumoSemanal): string {
  const linhasOrigem = dados.tarefasPendentesPorOrigem
    .map(
      (o) =>
        `<li>${o.total} ${ROTULOS_ORIGEM[o.origem] ?? o.origem}</li>`,
    )
    .join("");

  return `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2a1f;">
  <h1 style="font-size: 20px;">Resumo semanal da carteira</h1>
  <p style="color: #55614f;">Semana de ${dados.semana} — Mundo Novo Café</p>

  <h2 style="font-size: 16px;">Tarefas pendentes: ${totalTarefasPendentes(dados)}</h2>
  <ul>${linhasOrigem}</ul>

  <h2 style="font-size: 16px;">CAPAs</h2>
  <p>${dados.capasAbertas} abertas — ${dados.capasPrazoProximo} com prazo nos próximos 7 dias (ou estourado).</p>

  <h2 style="font-size: 16px;">Certificados</h2>
  <p>${dados.certificadosProximos90Dias} certificado(s) vencem nos próximos 90 dias.</p>

  <h2 style="font-size: 16px;">Contratos</h2>
  <p>${dados.contratosAguardandoAlcada} contrato(s) aguardando aprovação de alçada.</p>

  <p style="font-size: 12px; color: #8a927f;">Gerado automaticamente toda segunda-feira pelo painel Mundo Novo Café.</p>
</div>`.trim();
}
