-- ============================================================
-- Mundo Novo Café — Migration 0001: Fundação
-- Perfis de usuário, papéis e alçada de aprovação.
-- Regra do produto: alçada é PERMISSÃO (flag), não etapa de workflow.
-- ============================================================

create type public.papel_usuario as enum (
  'diretoria',
  'juridico',
  'comercial',
  'gestor',
  'consultor',
  'auditor'
);

create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  email text not null default '',
  papel public.papel_usuario not null default 'consultor',
  alcada_aprovacao boolean not null default false,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.perfis is
  'Perfil de cada usuário do sistema, espelhado de auth.users. '
  'alcada_aprovacao: permissão binária para aprovar contratos.';

-- Mantém atualizado_em em dia
create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger perfis_atualizado_em
  before update on public.perfis
  for each row
  execute function public.tocar_atualizado_em();

-- Cria o perfil automaticamente quando o usuário é criado no Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.perfis enable row level security;

-- Funções auxiliares de autorização (security definer para evitar recursão de RLS)
create or replace function public.papel_atual()
returns public.papel_usuario
language sql
security definer
set search_path = ''
stable
as $$
  select papel from public.perfis where id = (select auth.uid());
$$;

create or replace function public.eh_gestao()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    (select papel in ('gestor', 'diretoria') from public.perfis
      where id = (select auth.uid())),
    false
  );
$$;

-- Cada usuário lê o próprio perfil
create policy "usuario le o proprio perfil"
  on public.perfis for select
  to authenticated
  using ((select auth.uid()) = id);

-- Gestão lê todos os perfis
create policy "gestao le todos os perfis"
  on public.perfis for select
  to authenticated
  using (public.eh_gestao());

-- Gestão atualiza perfis (papel, alçada, ativo)
create policy "gestao atualiza perfis"
  on public.perfis for update
  to authenticated
  using (public.eh_gestao())
  with check (public.eh_gestao());
