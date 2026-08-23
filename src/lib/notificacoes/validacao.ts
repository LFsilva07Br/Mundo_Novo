import { z } from "zod";

/**
 * Validação (zod) da assinatura de push enviada pelo aparelho.
 * Fora de acoes.ts porque arquivos "use server" só exportam funções
 * assíncronas — e o esquema precisa ser testável.
 */

export const esquemaAssinaturaPush = z.object({
  endpoint: z
    .url("A assinatura de push veio sem um endereço válido.")
    .max(2000, "Endereço de push longo demais."),
  p256dh: z.string().trim().min(1, "A assinatura veio sem a chave p256dh."),
  auth: z.string().trim().min(1, "A assinatura veio sem a chave auth."),
});

export type AssinaturaPush = z.infer<typeof esquemaAssinaturaPush>;
