import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Página não encontrada dentro do painel — sem jargão, com saída óbvia. */
export default function NaoEncontradoPainel() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-dashed px-6 py-12 text-center">
      <Compass className="size-10 text-muted-foreground" aria-hidden />
      <h1 className="text-xl font-extrabold tracking-tight">
        Esta página não existe (ou não existe mais)
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        O endereço pode estar errado, ou o registro que você procura foi
        removido ou pertence a outro cliente. Nada foi perdido — use o menu
        lateral para chegar onde precisa.
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <Button render={<Link href="/painel" />}>Ir para o painel</Button>
        <Button variant="outline" render={<Link href="/painel/clientes" />}>
          Ver a carteira de clientes
        </Button>
      </div>
    </div>
  );
}
