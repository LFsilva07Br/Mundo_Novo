-- ============================================================
-- Mundo Novo Café — Migration 0004: Módulo Social & Colaboradores
-- Trabalhadores, moradias, treinamentos (NRs) e exames por cargo.
-- Vencimentos entram no mesmo motor de alertas dos certificados.
-- ============================================================

create type public.genero_trabalhador as enum ('masculino', 'feminino', 'outro');
create type public.vinculo_trabalhador as enum ('fixo', 'temporario');

create table public.trabalhadores (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  nome text not null,
  vinculo public.vinculo_trabalhador not null default 'fixo',
  funcao text not null,
  cbo text,
  salario numeric(10,2),
  admissao date,
  nascimento date,
  genero public.genero_trabalhador,
  cultura text default 'Café',
  moradia boolean not null default false,
  alimentacao boolean not null default false,
  transporte boolean not null default false,
  cesta_basica boolean not null default false,
  gratificacoes boolean not null default false,
  insalubridade boolean not null default false,
  periculosidade boolean not null default false,
  funcoes_habilitadas text[] not null default '{}',
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.moradias (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  nome text not null,                       -- ex.: Casa 01
  observacao text,
  criado_em timestamptz not null default now()
);

create table public.moradores (
  id uuid primary key default gen_random_uuid(),
  moradia_id uuid not null references public.moradias (id) on delete cascade,
  trabalhador_id uuid references public.trabalhadores (id) on delete set null,
  nome text not null,
  parentesco text not null default 'Colaborador',
  nascimento date,
  genero public.genero_trabalhador
);

create table public.treinamentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  norma text,                               -- ex.: NR-31
  periodicidade_meses int not null default 12,
  criado_em timestamptz not null default now()
);

create table public.treinamento_participacoes (
  id uuid primary key default gen_random_uuid(),
  treinamento_id uuid not null references public.treinamentos (id) on delete cascade,
  trabalhador_id uuid not null references public.trabalhadores (id) on delete cascade,
  realizado_em date not null,
  vence_em date,                            -- realizado + periodicidade (mantido pelo app)
  observacao text,
  unique (treinamento_id, trabalhador_id, realizado_em)
);

create table public.exames_cargo (
  id uuid primary key default gen_random_uuid(),
  cargo text not null,
  exame text not null,
  periodicidade text not null default 'Anual'
);

create trigger trabalhadores_atualizado_em before update on public.trabalhadores
  for each row execute function public.tocar_atualizado_em();

do $$
declare t text;
begin
  foreach t in array array[
    'trabalhadores', 'moradias', 'moradores',
    'treinamentos', 'treinamento_participacoes', 'exames_cargo'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "equipe le" on public.%I for select to authenticated using (public.eh_equipe_ativa())', t);
    execute format(
      'create policy "equipe insere" on public.%I for insert to authenticated with check (public.eh_equipe_ativa())', t);
    execute format(
      'create policy "equipe atualiza" on public.%I for update to authenticated using (public.eh_equipe_ativa()) with check (public.eh_equipe_ativa())', t);
    execute format(
      'create policy "equipe remove" on public.%I for delete to authenticated using (public.eh_equipe_ativa())', t);
  end loop;
end $$;
