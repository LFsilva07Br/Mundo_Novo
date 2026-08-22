# Mundo Novo Café — Sistema de Gestão de Certificação

Sistema de gestão de certificações de fazendas de café (Rainforest Alliance 1.4, 4C, Orgânico) da consultoria **Mundo Novo** — painel do gestor + app de campo offline-first para consultores.

## Documentação

A documentação viva do produto fica na rota **`/docs`** do sistema publicado:

- **Funcional** — o que o sistema faz, em linguagem de negócio ([docs/funcional.md](docs/funcional.md))
- **Técnica** — arquitetura e decisões técnicas ([docs/tecnica.md](docs/tecnica.md))

Ambas são atualizadas no mesmo commit de cada funcionalidade e publicadas automaticamente a cada push.

## Stack

Next.js 16 · TypeScript · Tailwind v4 + shadcn/ui · Supabase (Postgres/Auth/Storage) · Vercel · Vitest · GitHub Actions

## Como rodar

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # testes automatizados
npm run build   # build de produção
```

Para conectar o banco: copie `.env.example` para `.env.local` e preencha com as chaves do projeto Supabase.
