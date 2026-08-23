-- ============================================================
-- Mundo Novo Café — Migration 0012: Financeiro da consultoria
-- Contratos de mensalidade com os clientes da carteira e as
-- faturas geradas por competência (gestão do negócio da Mundo Novo).
-- ============================================================

create table public.contratos_financeiros (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  descricao text not null,
  valor_mensal numeric(12,2) not null check (valor_mensal > 0),
  -- Dia do mês do vencimento; até 28 para existir em qualquer mês.
  dia_vencimento smallint not null check (dia_vencimento between 1 and 28),
  inicio date not null,
  fim date check (fim is null or fim > inicio),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.faturas (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos_financeiros (id) on delete cascade,
  -- Competência no formato AAAA-MM (ex.: 2026-08).
  competencia text not null check (competencia ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  valor numeric(12,2) not null check (valor > 0),
  vencimento date not null,
  pago_em date,
  -- Status persistido por conveniência de filtro; a fonte da verdade é a
  -- função pura statusFatura(vencimento, pago_em, hoje) em regras.ts.
  status text not null default 'em_aberto'
    check (status in ('em_aberto', 'paga', 'atrasada')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (contrato_id, competencia)
);

create index faturas_competencia_idx on public.faturas (competencia);

create trigger contratos_financeiros_atualizado_em
  before update on public.contratos_financeiros
  for each row execute function public.tocar_atualizado_em();
create trigger faturas_atualizado_em
  before update on public.faturas
  for each row execute function public.tocar_atualizado_em();

-- Financeiro é dado interno da consultoria: só gestão vê e escreve
-- (nem consultores, nem o portal do produtor).
alter table public.contratos_financeiros enable row level security;
alter table public.faturas enable row level security;

do $$
declare t text;
begin
  foreach t in array array['contratos_financeiros', 'faturas'] loop
    execute format(
      'create policy "gestao le" on public.%I for select to authenticated using (public.eh_gestao())', t);
    execute format(
      'create policy "gestao insere" on public.%I for insert to authenticated with check (public.eh_gestao())', t);
    execute format(
      'create policy "gestao atualiza" on public.%I for update to authenticated using (public.eh_gestao()) with check (public.eh_gestao())', t);
    execute format(
      'create policy "gestao remove" on public.%I for delete to authenticated using (public.eh_gestao())', t);
  end loop;
end $$;
