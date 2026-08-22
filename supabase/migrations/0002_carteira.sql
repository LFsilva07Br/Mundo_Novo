-- ============================================================
-- Mundo Novo Café — Migration 0002: Carteira
-- Hierarquia: Grupo → Cliente → Imóvel Rural → Talhão
-- Regras: documentos pertencem ao imóvel; cliente pode ser
-- Fazenda ou Cadeia de Suprimentos; fazenda passa por implantação.
-- ============================================================

create type public.administracao_grupo as enum ('mundo_novo', 'terceiro');
create type public.tipo_cliente as enum ('fazenda', 'cadeia_suprimentos');
create type public.fase_cliente as enum ('implantacao', 'ativo', 'inativo');
create type public.area_contato as enum
  ('proprietario', 'ambiental', 'agricola', 'rh_social', 'administrativo', 'outro');
create type public.tipo_registro_contato as enum
  ('ligacao', 'email', 'whatsapp', 'reuniao', 'visita');
create type public.norma_certificacao as enum ('ra', 'quatro_c', 'organico');
create type public.status_certificacao as enum
  ('em_implantacao', 'ativa', 'em_renovacao', 'vencida', 'suspensa');
create type public.tipo_documento_imovel as enum
  ('car', 'matricula', 'licenca', 'dispensa_licenca', 'itr',
   'georreferenciamento', 'averbacao_reserva');
create type public.status_documento as enum ('ok', 'proximo_vencimento', 'vencido', 'pendente');

-- ------------------------------------------------------------
-- Grupos
-- ------------------------------------------------------------
create table public.grupos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  administracao public.administracao_grupo not null default 'mundo_novo',
  nome_administrador text,
  cidade text,
  uf char(2),
  contato_nome text,
  contato_telefone text,
  contato_email text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.grupos is
  'Grupo de clientes — administrado pela Mundo Novo ou por terceiro (ex.: Expocaccer). '
  'Cliente sem grupo é cliente direto.';

-- ------------------------------------------------------------
-- Clientes
-- ------------------------------------------------------------
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid references public.grupos (id) on delete set null,
  nome text not null,
  tipo public.tipo_cliente not null default 'fazenda',
  fase public.fase_cliente not null default 'implantacao',
  produtor text,
  cidade text,
  uf char(2),
  regiao text,
  id_ra text,
  cliente_desde date,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on column public.clientes.fase is
  'Regra do produto: a fazenda passa por implantação antes de habilitar avaliações.';

create table public.contatos_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  nome text not null,
  area public.area_contato not null default 'outro',
  telefone text,
  email text,
  criado_em timestamptz not null default now()
);

comment on table public.contatos_cliente is
  'Contato por área de responsabilidade — os e-mails automáticos usam esta tabela.';

create table public.registros_contato (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  tipo public.tipo_registro_contato not null,
  assunto text not null,
  detalhes text,
  duracao_minutos int,
  autor_id uuid references public.perfis (id),
  ocorrido_em timestamptz not null default now(),
  criado_em timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Certificações (entidade própria, por cliente)
-- ------------------------------------------------------------
create table public.certificacoes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  norma public.norma_certificacao not null,
  versao_norma text,
  certificadora text,
  principal boolean not null default false,
  status public.status_certificacao not null default 'em_implantacao',
  emitida_em date,
  vence_em date,
  renovacao_anual boolean not null default true,
  identificacao text,
  verificada_pelo_robo_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on column public.certificacoes.verificada_pelo_robo_em is
  'Última confirmação da data de vencimento no site da certificadora (robô ALAICE).';

-- ------------------------------------------------------------
-- Imóveis rurais (documentos são POR IMÓVEL)
-- ------------------------------------------------------------
create table public.imoveis_rurais (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  nome text not null,
  proprietarios text,
  cidade text,
  uf char(2),
  car text,
  matriculas text,
  area_total_ha numeric(10,4) not null default 0,
  area_cafe_ha numeric(10,4) not null default 0,
  area_app_ha numeric(10,4) not null default 0,
  area_reserva_ha numeric(10,4) not null default 0,
  possui_captacao_agua boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.documentos_imovel (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid not null references public.imoveis_rurais (id) on delete cascade,
  tipo public.tipo_documento_imovel not null,
  identificacao text,
  vence_em date,
  status public.status_documento not null default 'ok',
  observacao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.captacoes_agua (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid not null references public.imoveis_rurais (id) on delete cascade,
  tipo_captacao text not null,
  processo text,
  classificacao text,
  vence_em date,
  status public.status_documento not null default 'ok',
  criado_em timestamptz not null default now()
);

comment on table public.captacoes_agua is
  'Outorgas e usos insignificantes de água por imóvel — requisito da reunião de 19/08/2026.';

-- ------------------------------------------------------------
-- Talhões e histórico por safra
-- ------------------------------------------------------------
create table public.talhoes (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid not null references public.imoveis_rurais (id) on delete cascade,
  nome text not null,
  area_ha numeric(10,4) not null default 0,
  plantas_por_ha int,
  espacamento text,
  variedade text,
  ano_plantio int,
  area_irrigada_ha numeric(10,4) not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.safras (
  id uuid primary key default gen_random_uuid(),
  rotulo text not null unique,          -- ex.: '2026/27'
  inicio date,
  fim date
);

create table public.talhao_safras (
  id uuid primary key default gen_random_uuid(),
  talhao_id uuid not null references public.talhoes (id) on delete cascade,
  safra_id uuid not null references public.safras (id) on delete cascade,
  estado_lavoura text,                  -- produção, plantio, esqueletado, poda, recepa, decote…
  previsao_sacas numeric(10,2),
  colheita_efetiva_sacas numeric(10,2),
  previsao_poda_renovacao text,
  metodologia_previsao text,
  atualizado_por text,
  atualizado_em timestamptz not null default now(),
  unique (talhao_id, safra_id)
);

comment on table public.talhao_safras is
  'Histórico por safra do talhão: previsão × colheita efetiva e manejo — '
  'comparativo entre safras exigido pela cliente.';

-- ------------------------------------------------------------
-- Gatilhos de atualizado_em
-- ------------------------------------------------------------
create trigger grupos_atualizado_em before update on public.grupos
  for each row execute function public.tocar_atualizado_em();
create trigger clientes_atualizado_em before update on public.clientes
  for each row execute function public.tocar_atualizado_em();
create trigger certificacoes_atualizado_em before update on public.certificacoes
  for each row execute function public.tocar_atualizado_em();
create trigger imoveis_atualizado_em before update on public.imoveis_rurais
  for each row execute function public.tocar_atualizado_em();
create trigger documentos_imovel_atualizado_em before update on public.documentos_imovel
  for each row execute function public.tocar_atualizado_em();
create trigger talhoes_atualizado_em before update on public.talhoes
  for each row execute function public.tocar_atualizado_em();

-- ------------------------------------------------------------
-- RLS: equipe autenticada e ativa lê tudo; escrita pela equipe.
-- (Portal do cliente, quando existir, terá papéis próprios.)
-- ------------------------------------------------------------
create or replace function public.eh_equipe_ativa()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    (select ativo from public.perfis where id = (select auth.uid())),
    false
  );
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'grupos', 'clientes', 'contatos_cliente', 'registros_contato',
    'certificacoes', 'imoveis_rurais', 'documentos_imovel',
    'captacoes_agua', 'talhoes', 'safras', 'talhao_safras'
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
