<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

# Convenções do projeto Mundo Novo

- **Idioma**: interface, domínio, commits e documentação em **português brasileiro**. Nomes de código do domínio em português (`vencimentos.ts`, `perfis`, `alcada_aprovacao`); termos técnicos de infraestrutura podem ficar em inglês.
- **Documentação viva (obrigatória)**: todo commit que adiciona ou altera funcionalidade DEVE atualizar `docs/funcional.md` (linguagem de negócio) e/ou `docs/tecnica.md` (arquitetura) no mesmo commit. Elas são publicadas na rota `/docs`.
- **Testes (obrigatórios)**: toda funcionalidade nasce com testes no mesmo commit (`*.test.ts[x]` ao lado do código). Rodar `npm test` e `npm run lint` antes de commitar. O CI (GitHub Actions) roda lint + testes + build a cada push.
- **Banco**: alterações de schema sempre via nova migration SQL em `supabase/migrations/` (nunca editar migration já aplicada). Toda tabela com RLS habilitado e políticas explícitas.
- **Autenticação**: `@supabase/ssr` com cookies; sessão renovada em `src/proxy.ts` (Next 16 usa `proxy.ts`, não `middleware.ts`). O app deve continuar buildando sem env do Supabase (modo demonstração via `hasSupabaseEnv()`).
- **Tema**: paleta "verde café" definida em `src/app/globals.css`; usar tokens (`primary`, `warning`, `destructive`, `coffee`…), nunca hex solto em componentes.
- **Usuário do projeto**: o PO (Luiz Felipe) não é dev — mensagens de erro, textos de UI e docs funcionais em linguagem clara de negócio.

## Regras de negócio inegociáveis (ver docs/funcional.md)

1. NC nunca fica sem CAPA (criado automaticamente; checklist não fecha sem plano).
2. Alerta persiste até a resolução (disparos 180/150/120/90/60/30 dias, override por cliente).
3. Alçada de contrato é flag de permissão por usuário, não etapa de workflow.
4. CAR, matrícula, licenças e outorgas pertencem ao imóvel rural, não à fazenda.
5. Checklist versionado: alterações só chegam ao app após publicação.
6. Fazenda passa por etapa de implantação antes de habilitar avaliações.

<!-- END:nextjs-agent-rules -->
