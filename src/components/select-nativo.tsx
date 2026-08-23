import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Select nativo com o mesmo visual do Input — usado nos formulários
 * da carteira porque envia o valor direto no FormData da Server Action.
 */
export function SelectNativo({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select-nativo"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        className,
      )}
      {...props}
    />
  );
}
