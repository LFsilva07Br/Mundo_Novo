# Documentação Técnica

> **Mundo Novo Café — Sistema de Gestão de Certificação**
> Arquitetura, decisões técnicas e guia de desenvolvimento.
> Atualizada a cada alteração publicada.

## Stack

| Camada | Tecnologia | Observações |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) | Atenção: nesta versão o middleware chama-se `proxy.ts` |
| Linguagem | TypeScript (strict) | Domínio nomeado em português |
| Estilo | Tailwind CSS v4 + shadcn/ui (Base UI) | Tema customizado "verde café" em `src/app/globals.css` |
| Banco / Auth / Storage | **Supabase** (Postgres, RLS, Auth, Storage) | Migrations versionadas em `supabase/migrations/` |
| Hospedagem | **Vercel** | Deploy automático a cada push na `main` |
| Testes | Vitest + Testing Library (unidade/componente); Playwright planejado para E2E | CI no GitHub Actions a cada push |
| App de campo | PWA offline-first (Fase 4) | IndexedDB + fila de sincronização |
| Robô ALAICE | Python via GitHub Actions (Fase 8) | Agendado diariamente às 06:00 |

## Arquitetura

```
Navegador (gestor)  ──┐
                      ├──► Next.js (Vercel) ──► Supabase (Postgres + RLS + Auth + Storage)
PWA (consultor)  ─────┘            ▲
                                   │ escreve vencimentos
                Robô Python (GitHub Actions, diário)
```

- **Autenticação**: Supabase Auth com cookies via `@supabase/ssr`. O `src/proxy.ts` renova a sessão a cada requisição e protege `/painel/*`.
- **Modo demonstração**: enquanto as variáveis `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` não existem, o app roda sem autenticação com um aviso visível (`hasSupabaseEnv()` em `src/lib/supabase/env.ts`). Isso permite publicar na Vercel antes de conectar o banco.
- **Autorização**: papéis e o flag de alçada ficam na tabela `perfis`, espelhada de `auth.users` por trigger. Row Level Security em todas as tabelas.

## Estrutura de pastas

```
src/
  app/
    login/          # autenticação (Server Action `entrar`)
    painel/         # painel do gestor (layout com sidebar)
    docs/           # documentação interativa (renderiza docs/*.md)
  components/
    ui/             # componentes shadcn/ui
    barra-lateral.tsx
  lib/
    supabase/       # clientes server/browser + guarda de env
    vencimentos.ts  # regras de status e disparos de alerta
  proxy.ts          # sessão + proteção de rotas (Next 16)
docs/               # fonte da documentação (funcional.md, tecnica.md)
supabase/migrations/  # schema SQL versionado
```

## Modelo de dados (fundação)

Hierarquia definida na especificação: **Grupo → Cliente → Imóvel Rural → Talhão**, com Certificação como entidade própria por cliente.

Migration `0001_fundacao.sql`:

- enum `papel_usuario`: diretoria, juridico, comercial, gestor, consultor, auditor
- `perfis`: id (= auth.users), nome, papel, `alcada_aprovacao boolean` (regra: alçada é permissão, não etapa), ativo
- trigger `handle_new_user` cria o perfil no primeiro login
- RLS: usuário lê o próprio perfil; gestor/diretoria leem todos

As fases seguintes adicionam migrations incrementais (grupos, clientes, imóveis, talhões, safras, certificações, checklists, visitas, NCs/CAPAs, colaboradores, treinamentos, alertas).

## Regras de negócio codificadas

`src/lib/vencimentos.ts` — coberto por testes:

- `statusVencimento`: vencido (< 0 dias) · crítico (≤ 30) · atenção (≤ 120) · ok
- `disparosAtingidos`: marcos padrão 180/150/120/90/60/30 dias, com override por cliente; alerta persiste até resolução
- Formatação pt-BR de datas e áreas (hectares)

## Qualidade

- **Testes**: toda funcionalidade nasce com testes no mesmo commit (`*.test.ts[x]` ao lado do código). `npm test` roda tudo.
- **CI**: GitHub Actions executa lint + testes + build a cada push. Nada quebrado chega à `main`.
- **Documentação**: `docs/funcional.md` e `docs/tecnica.md` são atualizados no mesmo commit de cada funcionalidade e publicados na rota `/docs`.

## Como rodar localmente

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # testes
npm run lint       # lint
npm run build      # build de produção
```

Para conectar o Supabase: copie `.env.example` para `.env.local` e preencha com as chaves do projeto (Dashboard → Project Settings → API).

## Decisões registradas

| Decisão | Motivo |
|---|---|
| PWA em vez de app nativo | Decisão da reunião de 19/08 — evita lojas de aplicativo e reduz custo inicial |
| Supabase | Postgres gerenciado com RLS, Auth e Storage integrados; plano gratuito para começar |
| Domínio em português | O produto, a equipe e a cliente falam português; o código do domínio acompanha |
| Robô como GitHub Actions | Sem servidor próprio; log visível; grava no Supabase via API |
| Docs dentro do app | A Vercel publica a cada commit — documentação sempre sincronizada com o código |
