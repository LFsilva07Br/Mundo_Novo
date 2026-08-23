"use server";

import { revalidatePath } from "next/cache";
import { validarArquivoEvidencia } from "@/lib/evidencias/regras";
import { createClient } from "@/lib/supabase/server";
import { montarCaminhoComprovante } from "./regras";
import { esquemaPagamento, primeiraMensagem } from "./validacao";

/**
 * Server Actions dos pagamentos de sustentabilidade (DS/DI).
 * O comprovante (opcional) sobe pelo servidor para o bucket privado
 * 'evidencias', na pasta ds/ — o bucket nunca fica público.
 */

export type ResultadoAcao = { ok: true } | { ok: false; erro: string };

const BUCKET = "evidencias";

const ERRO_DEMO =
  "Modo demonstração: conecte o Supabase para gravar alterações de verdade.";

function texto(formData: FormData, campo: string): string | undefined {
  const valor = formData.get(campo);
  if (typeof valor !== "string") return undefined;
  const limpo = valor.trim();
  return limpo === "" ? undefined : limpo;
}

/**
 * Registra um pagamento de DS (diferencial) ou DI (investimento) ao produtor.
 * `formData` traz os campos do formulário e, opcionalmente, o arquivo
 * "comprovante" (foto JPEG/PNG/WebP até 8 MB).
 */
export async function registrarPagamento(
  formData: FormData,
): Promise<ResultadoAcao> {
  const entrada = esquemaPagamento.safeParse({
    clienteId: texto(formData, "clienteId"),
    tipo: texto(formData, "tipo"),
    valor: texto(formData, "valor"),
    data: texto(formData, "data"),
    descricao: texto(formData, "descricao"),
  });
  if (!entrada.success) {
    return { ok: false, erro: primeiraMensagem(entrada.error) };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, erro: ERRO_DEMO };

  // Comprovante é opcional; quando enviado, é validado e sobe primeiro.
  const arquivo = formData.get("comprovante");
  let caminho: string | null = null;
  if (arquivo instanceof File && arquivo.size > 0) {
    const validacao = validarArquivoEvidencia(arquivo);
    if (!validacao.ok) return validacao;

    caminho = montarCaminhoComprovante(entrada.data.clienteId, arquivo.type);
    const { error: erroUpload } = await supabase.storage
      .from(BUCKET)
      .upload(caminho, arquivo, { contentType: arquivo.type });
    if (erroUpload) {
      return {
        ok: false,
        erro: `Falha ao enviar o comprovante: ${erroUpload.message}`,
      };
    }
  }

  const { error } = await supabase.from("pagamentos_sustentabilidade").insert({
    cliente_id: entrada.data.clienteId,
    tipo: entrada.data.tipo,
    valor: entrada.data.valor,
    data: entrada.data.data,
    descricao: entrada.data.descricao ?? null,
    comprovante_caminho: caminho,
  });
  if (error) {
    // Não deixa arquivo órfão no bucket se o registro falhar.
    if (caminho) await supabase.storage.from(BUCKET).remove([caminho]);
    return {
      ok: false,
      erro: `Não foi possível registrar o pagamento: ${error.message}`,
    };
  }

  revalidatePath("/painel/sustentabilidade");
  return { ok: true };
}
