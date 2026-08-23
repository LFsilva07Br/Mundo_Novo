-- ============================================================
-- Mundo Novo Café — Migration 0008: Execuções do robô ALAICE
-- Log diário da verificação de vencimentos no site da certificadora.
-- ============================================================

create type public.status_execucao_robo as enum
  ('sucesso', 'divergencia_corrigida', 'falha', 'verificacao_assistida');

create table public.execucoes_robo (
  id uuid primary key default gen_random_uuid(),
  executado_em timestamptz not null default now(),
  status public.status_execucao_robo not null,
  certificados_consultados int not null default 0,
  divergencias int not null default 0,
  duracao_segundos numeric(8,2),
  log text,
  criado_em timestamptz not null default now()
);

alter table public.execucoes_robo enable row level security;

create policy "equipe le" on public.execucoes_robo
  for select to authenticated using (public.eh_equipe_ativa());
-- Escrita apenas via service role (robô) — sem política de insert para authenticated.
