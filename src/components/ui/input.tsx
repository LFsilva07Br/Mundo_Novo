import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/*
 * Foco: o anel visível vem da regra global `:focus-visible` de
 * `src/app/globals.css` (2px sólidos de --ring com 2px de afastamento). O
 * `focus-visible:ring-ring/50` que existia aqui foi removido — era um halo de
 * 50% de opacidade que não alcançava 3:1 e ainda disputava com o anel real.
 *
 * A borda usa --input, escurecido de #e3e1d6 para #8d8878 nesta revisão:
 * 1,31:1 → 3,54:1 sobre cartão branco (WCAG 2.2 SC 1.4.11). Sem isso o campo
 * simplesmente não tinha contorno perceptível.
 */
const inputVariants = cva(
  "w-full min-w-0 rounded-lg border border-input bg-transparent text-base transition-colors file:inline-flex file:border-0 file:bg-transparent file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      size: {
        // 32px — padrão do painel administrativo, inalterado.
        default: "h-8 px-2.5 py-1 file:h-6 file:text-sm",
        // 44px — alvo de toque confortável para o app de campo e para o portal
        // do produtor (dedo, luva, tela ao sol). Só quem pedir `size="lg"`
        // recebe o campo maior; o padrão continua com 32px.
        lg: "h-11 px-3 py-2 text-base file:h-8 file:text-base md:text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

// `size` nativo de <input> é numérico (largura em caracteres) e conflita com a
// nossa variante; por isso ele sai do tipo herdado.
type InputProps = Omit<React.ComponentProps<"input">, "size"> &
  VariantProps<typeof inputVariants>

function Input({ className, type, size = "default", ...props }: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(inputVariants({ size }), className)}
      {...props}
    />
  )
}

export { Input, inputVariants }
