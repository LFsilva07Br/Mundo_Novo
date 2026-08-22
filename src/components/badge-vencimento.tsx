import { cn } from "@/lib/utils";
import {
  diasAte,
  formatarData,
  rotuloStatusVencimento,
  statusVencimento,
} from "@/lib/vencimentos";

const CORES: Record<string, string> = {
  vencido: "bg-destructive/10 text-destructive",
  critico: "bg-destructive/10 text-destructive",
  atencao: "bg-warning/10 text-warning",
  ok: "bg-secondary text-secondary-foreground",
};

export function BadgeVencimento({ venceEm }: { venceEm?: string }) {
  if (!venceEm) {
    return (
      <span className="inline-flex rounded-lg bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
        Sem vencimento
      </span>
    );
  }

  const data = new Date(`${venceEm}T12:00:00`);
  const status = statusVencimento(data);
  const dias = diasAte(data);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold",
        CORES[status],
      )}
    >
      {status === "vencido"
        ? `Vencido em ${formatarData(data)}`
        : `${rotuloStatusVencimento(status)} · vence ${formatarData(data)} (${dias} dias)`}
    </span>
  );
}
