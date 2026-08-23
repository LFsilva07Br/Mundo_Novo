# Handover — Mundo Novo Café · Sistema de Gestão de Certificação

> **Para quem chega agora (humano ou assistente de IA).**
> Este documento é a memória completa do projeto: contexto de negócio, o que existe,
> como foi decidido, o que está pendente e como trabalhar aqui.
> Atualizado em 23/08/2026 · 94 commits · 1.210 testes automatizados.

---

## 1. O que é o projeto

Sistema de gestão de certificação para a **Mundo Novo Café**, consultoria que atende
fazendas de café em Minas Gerais e São Paulo. O sistema substitui planilhas, o
FoodChecker e o Microsoft 365 no controle das certificações **Rainforest Alliance 1.4**
(principal), **4C** e **Orgânico**.

**Pessoas do projeto**
| Quem | Papel |
|---|---|
| Luiz Felipe Silva | PO do projeto (não programa — todo o código é feito por assistente de IA) |
| João Paulo Almeida Torres | Arquiteto/consultor técnico — autor do protótipo v2 e do relatório de estrutura |
| Tâmara Isa da Silva | Cliente — gestora da Mundo Novo Café |

**Estado atual:** sistema completo em produção, com banco real, autenticação e três
usuários ativos. As 13 fases do roadmap estão concluídas. A meta original era operar em
nov/dez 2026 com proposta em 31/10 — foi entregue com ~2 meses de antecedência.

---

## 2. Endereços e acessos

| Recurso | Onde |
|---|---|
| Sistema em produção | https://mundo-novo-seven.vercel.app |
| Repositório | https://github.com/LFsilva07Br/Mundo_Novo |
| Banco de dados | Supabase, projeto `mundo-novo`, ref `qyegfrctafjghgprnihl`, região São Paulo (`sa-east-1`) |
| Hospedagem | Vercel, projeto `mundo-novo` (equipe `new-world2`) |
| Documentação viva | `/docs` no sistema (abas Funcional e Técnica) |
| Manual do usuário | `/manual` no sistema (35 telas com print real) |
| Roadmap com progresso | `/painel/roadmap` |

**Segredos** (nunca versionados): ficam em `.env.local` na máquina do PO e nas variáveis
de ambiente da Vercel — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `SUPABASE_DB_PASSWORD`, `SMTP_*`.
No GitHub há os segredos `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (usados pelo robô).

**Rotas públicas** (sem login): `/login`, `/docs`, `/manual`, `/queixa/[cliente]`,
`/queixa/acompanhar`. Todo o resto exige autenticação.

---

## 3. Stack e decisões de arquitetura

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) | ⚠️ nesta versão o middleware chama-se `proxy.ts`, não `middleware.ts` |
| Linguagem | TypeScript strict | Domínio nomeado **em português** |
| Estilo | Tailwind v4 + shadcn/ui (Base UI) | Tema "verde café" em `src/app/globals.css` |
| Banco/Auth/Storage | **Supabase** (PostgreSQL 17 + RLS) | Postgres puro: migrations em SQL padrão, portável |
| Hospedagem | Vercel | Deploy por `vercel deploy --prod --yes` |
| Testes | Vitest + Testing Library; Playwright (E2E e acessibilidade) | CI no GitHub Actions |
| App de campo | PWA offline-first (IndexedDB via `idb`) | Decisão da reunião de 19/08: evita lojas de aplicativo |
| Robô | Python via GitHub Actions (diário 06:00) | Sem servidor próprio |
| E-mail | SMTP genérico (`nodemailer`) | Gratuito: funciona com Gmail (senha de app) |

### Padrão de camadas (siga ao criar módulo novo)

```
src/lib/<modulo>/
  consultas.ts   # leitura; createClient() null → devolve dados demo
  acoes.ts       # "use server", validação com zod, revalidatePath
  regras.ts      # funções PURAS testáveis (a lógica de negócio mora aqui)
  dados-demo.ts  # dados de exemplo realistas
```

**Modo demonstração:** sem as variáveis do Supabase o sistema roda sem login, com dados
de exemplo e uma faixa de aviso. É isso que permite testes, prints do manual e a suíte
E2E sem tocar em dado real de cliente. `hasSupabaseEnv()` em `src/lib/supabase/env.ts`.

---

## 4. Modelo de dados

Hierarquia central: **Grupo → Cliente → Imóvel Rural → Talhão**, com Certificação como
entidade própria por cliente. 12 migrations em `supabase/migrations/`, todas com RLS.

| Migration | Conteúdo |
|---|---|
| 0001 | Perfis, papéis, flag de alçada, trigger de criação de perfil |
| 0002 | Carteira: grupos, clientes, contatos por área, certificações, imóveis, documentos, captações de água, talhões, safras |
| 0003 | Carga inicial com a carteira real |
| 0004 | Social: trabalhadores, moradias, treinamentos, exames |
| 0005 | Operações: workflow, contratos, checklists versionados, visitas, CAPAs, tarefas **+ trigger `nc_gera_capa`** |
| 0006 | Carga das operações (checklist RA 1.4, workflow, CAPAs) |
| 0007 | Coluna de conformidade por cliente |
| 0008 | Log de execuções do robô |
| 0009 | Fotos de visita, evidências de CAPA, override de alertas, bucket `evidencias`, troca de senha obrigatória |
| 0010 | Portal do produtor (`perfis.cliente_id` + políticas), comercialização, mapas, fila de e-mails |
| 0011 | Agroquímicos, EPI, casos sociais, queixas, plano de gestão, achados externos, DS/DI, planejamento, push, **trilha de auditoria** |
| 0012 | Financeiro da consultoria |

**Regras implementadas no próprio banco:**
- Resposta `nao_conforme` inserida → **CAPA criada automaticamente** (trigger).
- `eh_equipe_ativa()` — equipe é perfil ativo **sem** `cliente_id`; com `cliente_id` é produtor (portal) e só vê os próprios dados.
- `trilha_auditoria` grava insert/update/delete de 10 tabelas críticas; é somente leitura, nem a gestão apaga.

### De → Para das planilhas da cliente
O mapeamento completo (100% dos campos das três planilhas: Controle Ambiental, Lista de
Trabalhadores e Estimativa de Safra) está em **`docs/tecnica.md`**, junto com o diagrama
ER renderizado em `/docs`.

---

## 5. Regras de negócio inegociáveis

Estas regras vieram do cliente e do relatório do JP. **Não flexibilizar sem decisão do PO:**

1. **NC nunca fica sem plano de ação** — marcar item como não conforme cria o CAPA na hora; o checklist não fecha sem o plano.
2. **Alerta persiste até a resolução** — não é notificação única; some só quando a pendência é concluída.
3. **Alçada é permissão, não etapa** — flag booleano por usuário; quem não tem, não vê os botões (e o servidor recusa a ação).
4. **Documentos pertencem ao imóvel rural** — CAR, matrícula, licenças e outorgas são por imóvel; uma fazenda tem vários.
5. **Checklist versionado** — alterações só valem depois de publicar a versão; visitas em andamento continuam na versão em que começaram.
6. **Fazenda passa por implantação** antes de habilitar avaliação/certificação.
7. **Trabalho de escritório também conta** — auditorias documentais são registradas junto com as visitas de campo.
8. **Sorteio amostral é da certificadora** — não é etapa nossa.
9. **Não vender mais café certificado do que se produz** — o balanço de volume cruza previsão de safra × lotes e alerta o estouro.

---

## 6. O que existe hoje (48 páginas, 14 rotas de API)

### Painel do gestor
Dashboard (com **nota de prontidão para auditoria**), Grupos, Clientes (+ficha),
Imóveis & Talhões (+mapas KML), Contratos com alçada, Workflow (6 etapas), **Agenda com
visão semanal**, Planejamento anual, Visitas/auditorias, CAPAs, Social & Colaboradores,
Compliance social, Agroquímicos, Comercialização, Auditoria externa, Sustentabilidade
(DS/DI), EUDR, Checklists versionados, Alertas & Automação, Usuários, Relatórios,
E-mails, Financeiro, Dossiê do auditor, Trilha de auditoria, Exportação, Roadmap.

### App de campo (`/campo`) — PWA offline
Instalável no celular. Pacote de dados baixado para o aparelho, checklist offline com
rascunho contínuo no IndexedDB, fotos com GPS e hora automáticos, assinatura do produtor
na tela, fila de sincronização, biometria opcional, notificações locais.

### Portal do produtor (`/portal`)
O produtor entra com login próprio e vê apenas os dados dele: certificado, pendências
(podendo enviar foto de evidência), fazenda e relatórios.

### Canal público de queixas (`/queixa/[cliente]`)
Exigência RA 1.5.1. Anônimo por padrão, protocolo de acompanhamento, proteção anti-robô,
aviso de celular emprestado e botão "sair e limpar".

### Automação
- **Motor por data** (`/api/gatilhos`, cron diário 06:00): varre certificados, documentos de imóvel, outorgas, treinamentos e CAPAs; cria tarefas idempotentes.
- **Motor por evento**: NC→CAPA, cliente em "Na certificadora"→notifica gestor, contrato parado >10 dias→escalona.
- **Resumo semanal** (`/api/resumo-semanal`, segundas 07:00).
- **Robô de certificados** (GitHub Actions, 06:00): ver seção 8.

---

## 7. Convenções obrigatórias do repositório

Estão em `AGENTS.md` (lido automaticamente por assistentes de IA):

1. **Tudo em português brasileiro** — interface, domínio, commits, documentação.
2. **Documentação viva**: todo commit de funcionalidade atualiza `docs/funcional.md` e/ou `docs/tecnica.md` **no mesmo commit**.
3. **Testes obrigatórios**: toda funcionalidade nasce com teste (`*.test.ts[x]` ao lado do código). `npm test` e `npm run lint` antes de commitar.
4. **Manual**: toda tela nova ganha entrada em `src/lib/manual.ts` no mesmo commit.
5. **Banco**: só por migration nova em `supabase/migrations/` (nunca editar migration aplicada); RLS em toda tabela.
6. **Tema**: usar tokens (`primary`, `warning`, `destructive`…), nunca cor solta.
7. **O PO não é dev** — mensagens de erro, textos de tela e docs funcionais em linguagem de negócio.

### Comandos

```bash
npm install
npm run dev          # desenvolvimento
npm test             # 1.210 testes (use -- --maxWorkers=2 em máquina carregada)
npm run lint
npm run build
npm run manual       # regenera os 35 prints do manual
npx playwright test  # E2E + acessibilidade (axe-core)
vercel deploy --prod --yes
npx supabase db push --password "$SUPABASE_DB_PASSWORD"   # aplica migrations
```

### Armadilhas conhecidas (economizam horas)

- **Next 16**: middleware é `proxy.ts`; `params`/`searchParams` são Promises (`await params`).
- **`output: "standalone"`** está condicionado a `!process.env.VERCEL` — na Vercel quebra o build; é para Docker/on-premise.
- **`.env.local` contém `VERCEL`** (criado pelo `vercel link`): isso desliga o standalone em builds locais. O script do manual já contorna.
- **`AGENTS.md` é reescrito pelo `next dev`** — ele mantém um bloco entre marcadores; as convenções do projeto ficam fora dele e já foram restauradas uma vez.
- **Testes de Dialog em jsdom**: use `findBy*` depois de abrir o diálogo, senão fica instável.
- **Node**: o projeto usa Node 26 (`~/.nvm/versions/node/v26.2.0/bin`); o padrão do shell pode ser antigo demais.

---

## 8. Pendências e decisões em aberto

### Precisa de ação do PO/cliente
| Item | Detalhe |
|---|---|
| **E-mail** | Código pronto (SMTP). Falta gerar uma **senha de app do Gmail** e preencher `SMTP_HOST/PORT/USER/PASS/FROM` na Vercel. Enquanto isso os avisos ficam registrados como pendentes em `/painel/emails`. |
| **Contatos do portal** | `src/lib/portal/contato.ts` tem telefones/nomes **de exemplo**. Precisa dos dados reais antes de mostrar ao produtor — em especial o canal da certificadora (que deve ser diferente do consultor da fazenda). |
| **44 clientes restantes** | Só 8 dos 52 estão cadastrados (os do protótipo validado). Faltam as planilhas dos demais para importar. |
| **Portal da certificadora** | O domínio `alaice.org.br` **não existe**; o portal MyRA da Rainforest exige login e não tem API. O robô opera em **verificação assistida**, com link direto ao portal. Vale confirmar com a Tâmara qual portal a certificadora realmente usa. |
| **Deploy automático** | Falta instalar o app da Vercel no GitHub (`vercel.com/account/git`) para o deploy sair do manual. |
| **LGPD** | Único item da análise de produto que o PO deixou **em avaliação**. O sistema guarda dados pessoais sensíveis de trabalhadores (salário, nascimento, saúde ocupacional) — recomendado tratar: base legal, política de retenção, exclusão sob demanda. |

### Backlog técnico conhecido
- Suíte E2E do painel foi iniciada por um agente e **não chegou a ser commitada** — existe `e2e/acessibilidade.spec.ts` e `playwright.config.ts`; falta a cobertura dos fluxos.
- Tema escuro é **código morto**: `next-themes` instalado, sem provider, `.dark` nunca aplicada. Decidir entre ativar (corrigindo contrastes já mapeados) ou remover.
- Integrações Microsoft (Power BI, Outlook/Teams, Planner) — previstas no roadmap do JP para **depois** do MVP.
- Rastreabilidade com o sistema Corgo — visão de futuro citada pela cliente.

---

## 9. Histórico das decisões (por que está assim)

- **19/08/2026 — reunião com a cliente.** Definiu PWA em vez de app nativo (custo/lojas), nuvem em vez de servidor físico, e acrescentou: módulo social completo, recursos hídricos, etapa de implantação, geolocalização dos consultores, confronto declarado × CAR e registro do trabalho de escritório.
- **Relatório do JP (protótipo v2).** Estabeleceu Grupo como entidade própria, Imóvel Rural entre Cliente e Talhão, alçada como permissão binária, as 5 etapas reais do workflow e as integrações do MVP.
- **Planilhas reais da cliente** (Alto da Serra e Dutra da Serra) foram a base do modelo de dados — o de→para está documentado.
- **Análise de produto (23/08).** 23 itens sugeridos a partir da norma RA e da rotina de consultoria; o PO aprovou todos exceto LGPD. Viraram as fases 10–13.
- **Auditoria de UI/UX (23/08).** Quatro auditorias independentes (painel, campo, portal/queixas, acessibilidade WCAG 2.2). Encontraram **6 bugs críticos reais** — o mais grave: as fotos de evidência nunca anexavam no app de campo, o que impedia concluir qualquer visita com NC. Todos corrigidos.

---

## 10. Como continuar o trabalho

1. Clone o repositório e rode `npm install`.
2. Para trabalhar sem banco, não crie `.env.local`: o sistema sobe em modo demonstração com dados realistas.
3. Para trabalhar com o banco real, peça ao PO as chaves do Supabase.
4. Leia `AGENTS.md` (convenções), `docs/funcional.md` (o que o sistema faz) e `docs/tecnica.md` (como funciona, de→para, diagrama).
5. Ao entregar qualquer funcionalidade: **teste + documentação + entrada no manual, no mesmo commit**.

> **Princípio que guiou o projeto:** o sistema existe para que um item não conforme nunca
> fique sem plano de ação e para que nenhum vencimento passe despercebido. Toda decisão
> de produto deve ser lida contra isso.
