"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function concluirTarefa(id: string): Promise<void> {
  const supabase = await createClient();
  if (!supabase) return;
  await supabase
    .from("tarefas")
    .update({ status: "concluida" })
    .eq("id", id);
  revalidatePath("/painel/agenda");
}

export async function executarMotorAgora(): Promise<void> {
  // Disparo manual do motor de gatilhos (mesma rota chamada pelo cron)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/api/gatilhos`
    : null;
  if (!url || !process.env.CRON_SECRET) return;
  await fetch(url, {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    cache: "no-store",
  });
  revalidatePath("/painel/agenda");
}
