-- ============================================================
-- Mundo Novo Café — Migration 0010: Portal do cliente,
-- comercialização, mapas e fila de e-mails.
-- ============================================================

-- ------------------------------------------------------------
-- Portal do cliente: perfil vinculado a um cliente
-- (perfil com cliente_id = usuário do PORTAL, não da equipe)
-- ------------------------------------------------------------
alter table public.perfis add column cliente_id uuid references public.clientes (id) on delete set null;

comment on column public.perfis.cliente_id is
  'Quando preenchido, o perfil é de um PRODUTOR (portal do cliente) e só enxerga os dados do próprio cliente.';

-- Equipe = ativo E sem vínculo de cliente (portal não é equipe)
create or replace function public.eh_equipe_ativa()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    (select ativo and cliente_id is null from public.perfis where id = (select auth.uid())),
    false
  );
$$;

create or replace function public.cliente_do_portal()
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select cliente_id from public.perfis
  where id = (select auth.uid()) and ativo;
$$;

-- Leitura do próprio cliente no portal
create policy "portal le o proprio cliente" on public.clientes
  for select to authenticated
  using (id = public.cliente_do_portal());

create policy "portal le proprias certificacoes" on public.certificacoes
  for select to authenticated
  using (cliente_id = public.cliente_do_portal());

create policy "portal le proprias capas" on public.capas
  for select to authenticated
  using (cliente_id = public.cliente_do_portal());

create policy "portal le acoes das proprias capas" on public.capa_acoes
  for select to authenticated
  using (exists (
    select 1 from public.capas c
    where c.id = capa_id and c.cliente_id = public.cliente_do_portal()
  ));

create policy "portal le proprios imoveis" on public.imoveis_rurais
  for select to authenticated
  using (cliente_id = public.cliente_do_portal());

create policy "portal le proprios talhoes" on public.talhoes
  for select to authenticated
  using (exists (
    select 1 from public.imoveis_rurais i
    where i.id = imovel_id and i.cliente_id = public.cliente_do_portal()
  ));

create policy "portal le proprias visitas" on public.visitas
  for select to authenticated
  using (cliente_id = public.cliente_do_portal());

create policy "portal le o proprio perfil ja coberto" on public.tarefas
  for select to authenticated
  using (cliente_id = public.cliente_do_portal());

-- Portal pode anexar evidência nas próprias CAPAs (responder pendência)
create policy "portal anexa evidencia na propria capa" on public.capa_evidencias
  for insert to authenticated
  with check (exists (
    select 1 from public.capas c
    where c.id = capa_id and c.cliente_id = public.cliente_do_portal()
  ));

create policy "portal le evidencias das proprias capas" on public.capa_evidencias
  for select to authenticated
  using (exists (
    select 1 from public.capas c
    where c.id = capa_id and c.cliente_id = public.cliente_do_portal()
  ));

-- ------------------------------------------------------------
-- Comercialização (lotes e negociações)
-- ------------------------------------------------------------
create type public.status_lote as enum ('estoque', 'negociado', 'entregue');
create type public.status_negociacao as enum ('proposta', 'fechada', 'cancelada');

create table public.lotes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  safra_id uuid references public.safras (id) on delete set null,
  identificacao text not null,              -- ex.: LOTE-2026-001
  sacas numeric(10,2) not null default 0,
  origem_talhoes text,                      -- rastreabilidade: talhões de origem
  peneira text,
  bebida text,                              -- classificação da bebida
  status public.status_lote not null default 'estoque',
  observacao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (cliente_id, identificacao)
);

create table public.negociacoes (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references public.lotes (id) on delete cascade,
  comprador text not null,
  sacas numeric(10,2) not null,
  preco_por_saca numeric(10,2) not null,
  data date not null default current_date,
  contrato text,
  status public.status_negociacao not null default 'proposta',
  observacao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Mapas das fazendas (KML/GeoJSON por imóvel)
-- ------------------------------------------------------------
create table public.mapas_imovel (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid not null references public.imoveis_rurais (id) on delete cascade,
  nome text not null,
  caminho_arquivo text,                     -- original no bucket 'evidencias' (pasta mapas/)
  geojson jsonb not null,
  criado_em timestamptz not null default now()
);

create policy "portal le mapas dos proprios imoveis" on public.mapas_imovel
  for select to authenticated
  using (exists (
    select 1 from public.imoveis_rurais i
    where i.id = imovel_id and i.cliente_id = public.cliente_do_portal()
  ));

-- ------------------------------------------------------------
-- Fila/log de e-mails (envio por SMTP configurável)
-- ------------------------------------------------------------
create type public.status_email as enum ('pendente', 'enviado', 'falha');

create table public.envios_email (
  id uuid primary key default gen_random_uuid(),
  destinatario text not null,
  assunto text not null,
  corpo_html text not null,
  origem text not null,                     -- alerta | resumo-semanal | convite-portal…
  status public.status_email not null default 'pendente',
  erro text,
  enviado_em timestamptz,
  criado_em timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Gatilhos e RLS
-- ------------------------------------------------------------
create trigger lotes_atualizado_em before update on public.lotes
  for each row execute function public.tocar_atualizado_em();
create trigger negociacoes_atualizado_em before update on public.negociacoes
  for each row execute function public.tocar_atualizado_em();

do $$
declare t text;
begin
  foreach t in array array['lotes', 'negociacoes', 'mapas_imovel', 'envios_email'] loop
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

-- Portal vê os próprios lotes/negociações (transparência da comercialização)
create policy "portal le proprios lotes" on public.lotes
  for select to authenticated
  using (cliente_id = public.cliente_do_portal());

create policy "portal le proprias negociacoes" on public.negociacoes
  for select to authenticated
  using (exists (
    select 1 from public.lotes l
    where l.id = lote_id and l.cliente_id = public.cliente_do_portal()
  ));
