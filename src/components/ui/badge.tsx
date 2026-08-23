import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/*
 * ============================================================================
 * SEMÂNTICA DAS VARIANTES — leia antes de escolher uma
 * ============================================================================
 * A regra é: a variante indica O QUE o selo comunica, não que cor ele deve ter.
 * Cor vem do token; token vem da semântica.
 *
 *   default ..... Identidade / rótulo neutro em destaque. Verde primário
 *                 sólido. Use para o nome de uma certificação, um contador
 *                 principal. NÃO use para status — não diz nada sobre saúde.
 *
 *   secondary ... Rótulo neutro discreto (categoria, tipo, contagem
 *                 secundária). Verde bem claro, sem carga de alerta.
 *
 *   outline ..... Metadado sem peso visual (versão do checklist, código,
 *                 data). Só contorno.
 *
 *   ghost ....... Igual ao outline, mas sem contorno: para grades densas onde
 *                 vários selos lado a lado virariam ruído.
 *
 *   link ........ Selo que na verdade é um link. Sublinha no hover.
 *
 *   success ..... ESTADO BOM E ENCERRADO: conforme, aprovado, em dia, CAPA
 *                 concluído, visita sincronizada. É o "pode seguir".
 *
 *   warning ..... ESTADO QUE PEDE AÇÃO MAS AINDA TEM PRAZO: vencimento se
 *                 aproximando (janelas de 180 a 30 dias), pendência aberta
 *                 dentro do prazo, item aguardando aprovação. É o "olhe para
 *                 mim esta semana".
 *
 *   destructive . ESTADO RUIM OU JÁ VENCIDO: não conformidade, licença
 *                 expirada, sincronização falhou, prazo estourado. É o
 *                 "resolva agora". Nunca use só como enfeite vermelho.
 *
 * Por que `warning` e `success` passaram a existir: elas não eram oferecidas
 * pelo primitivo, então cada tela inventou a sua — `bg-warning/10 text-warning`
 * em compliance e agro, `bg-warning/15` no editor de checklist, só
 * `text-warning` com `variant="outline"` em social. Resultado: quatro
 * aparências para o mesmo significado e quatro chances de errar o contraste.
 *
 * Contraste (calculado sobre a tinta composta, não sobre branco puro — ver o
 * cabeçalho de src/app/globals.css):
 *   warning     #924c06 sobre bg-warning/10 ....... 5,56:1  ✅ (era 2,86:1)
 *   destructive #a32b23 sobre bg-destructive/10 ... 6,10:1  ✅ (era 4,28:1)
 *   success     #2d6a4f sobre bg-success/10 ....... 5,53:1  ✅
 *
 * Foco: o anel vem da regra global `:focus-visible` de globals.css. O
 * `focus-visible:ring-ring/50` que existia aqui foi removido — não chegava a
 * 3:1 e competia com o anel real.
 * ============================================================================
 */
const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive dark:bg-destructive/20 [a]:hover:bg-destructive/20",
        warning:
          "bg-warning/10 text-warning dark:bg-warning/20 [a]:hover:bg-warning/20",
        success:
          "bg-success/10 text-success dark:bg-success/20 [a]:hover:bg-success/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
