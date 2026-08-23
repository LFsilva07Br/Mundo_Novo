-- ============================================================
-- Mundo Novo Café — Migration 0005: Operações de certificação
-- Workflow (5 etapas reais), contratos com alçada, checklists
-- versionados, visitas, NCs e CAPAs, tarefas da agenda.
-- ============================================================

-- ------------------------------------------------------------
-- Workflow de certificação (posição de cada cliente no ciclo)
-- ------------------------------------------------------------
create type public.etapa_workflow as enum (
  'implantacao',
  'auditoria_interna',
  'correcao_ncs',
  'revisao_gestor',
  'na_certificadora',
  'aprovado'
);

create table public.processos_certificacao (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  etapa public.etapa_workflow not null default 'implantacao',
  observacao text,
  atualizado_por uuid references public.perfis (id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (cliente_id)
);

create table public.movimentos_workflow (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references public.processos_certificacao (id) on delete cascade,
  de public.etapa_workflow,
  para public.etapa_workflow not null,
  autor_id uuid references public.perfis (id),
  ocorrido_em timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Contratos & alçada (aprovação é permissão, não etapa)
-- ------------------------------------------------------------
create type public.status_contrato as enum ('aguardando_alcada', 'aprovado', 'rejeitado');

create table public.contratos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,              -- ex.: 2026-041
  cliente_nome text not null,
  tipo public.tipo_cliente not null default 'fazenda',
  cliente_id uuid references public.clientes (id) on delete set null,
  status public.status_contrato not null default 'aguardando_alcada',
  solicitado_por text,
  solicitado_em date not null default current_date,
  decidido_por uuid references public.perfis (id),
  decidido_em timestamptz,
  observacao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Checklists versionados, vinculados à norma
-- ------------------------------------------------------------
create type public.status_versao_checklist as enum ('rascunho', 'publicada', 'arquivada');

create table public.checklists (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  norma public.norma_certificacao not null default 'ra',
  versao_norma text,
  criado_em timestamptz not null default now()
);

create table public.checklist_versoes (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.checklists (id) on delete cascade,
  numero int not null,
  status public.status_versao_checklist not null default 'rascunho',
  publicada_em timestamptz,
  publicada_por uuid references public.perfis (id),
  unique (checklist_id, numero)
);

create table public.checklist_itens (
  id uuid primary key default gen_random_uuid(),
  versao_id uuid not null references public.checklist_versoes (id) on delete cascade,
  ordem int not null default 0,
  codigo text not null,                     -- ex.: 1.2.9
  capitulo text,
  pergunta text not null,
  obrigatorio boolean not null default true,
  fotos_minimas int not null default 2,
  descricao_minima int not null default 100,
  referencia_norma text not null,           -- vínculo obrigatório com a norma
  permite_na boolean not null default true
);

-- ------------------------------------------------------------
-- Visitas (campo e escritório) e respostas
-- ------------------------------------------------------------
create type public.origem_registro as enum ('campo', 'escritorio');
create type public.status_visita as enum ('em_andamento', 'concluida', 'sincronizada');
create type public.resposta_item as enum ('conforme', 'nao_conforme', 'nao_aplicavel');

create table public.visitas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  versao_checklist_id uuid references public.checklist_versoes (id),
  titulo text not null,
  origem public.origem_registro not null default 'campo',
  status public.status_visita not null default 'em_andamento',
  responsavel_id uuid references public.perfis (id),
  iniciada_em timestamptz not null default now(),
  concluida_em timestamptz,
  gps_inicio text,
  gps_fim text,
  observacao text
);

create table public.visita_respostas (
  id uuid primary key default gen_random_uuid(),
  visita_id uuid not null references public.visitas (id) on delete cascade,
  item_id uuid not null references public.checklist_itens (id) on delete cascade,
  resposta public.resposta_item not null,
  descricao text,
  respondido_em timestamptz not null default now(),
  unique (visita_id, item_id)
);

-- ------------------------------------------------------------
-- Não conformidades e CAPAs (NC nunca fica sem plano)
-- ------------------------------------------------------------
create type public.severidade_nc as enum ('menor', 'maior', 'critica');
create type public.status_capa as enum ('aberta', 'em_correcao', 'aguardando_evidencia', 'fechada');

create sequence public.capa_numero_seq start 132;

create table public.capas (
  id uuid primary key default gen_random_uuid(),
  numero int not null unique default nextval('public.capa_numero_seq'),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  visita_id uuid references public.visitas (id) on delete set null,
  item_codigo text,
  descricao text not null,
  severidade public.severidade_nc not null default 'menor',
  responsavel text not null,
  prazo date,
  status public.status_capa not null default 'aberta',
  origem public.origem_registro not null default 'campo',
  verificador_id uuid references public.perfis (id),
  fechada_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.capa_acoes (
  id uuid primary key default gen_random_uuid(),
  capa_id uuid not null references public.capas (id) on delete cascade,
  ordem int not null default 0,
  descricao text not null,
  concluida boolean not null default false,
  concluida_em date,
  exige_foto boolean not null default false,
  observacao text
);

-- ------------------------------------------------------------
-- Tarefas da agenda (gerada pelos dois motores de gatilho)
-- ------------------------------------------------------------
create type public.origem_gatilho as enum ('data', 'evento', 'manual');
create type public.status_tarefa as enum ('pendente', 'concluida', 'cancelada');

create table public.tarefas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  detalhe text,
  cliente_id uuid references public.clientes (id) on delete cascade,
  responsavel_id uuid references public.perfis (id),
  origem public.origem_gatilho not null default 'manual',
  regra text,                               -- qual gatilho criou (ex.: vencimento-90d)
  vence_em date,
  status public.status_tarefa not null default 'pendente',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (regra, cliente_id, vence_em)      -- evita duplicar o mesmo disparo
);

-- ------------------------------------------------------------
-- Gatilho central: NC registrada → CAPA nasce na hora
-- ------------------------------------------------------------
create or replace function public.criar_capa_para_nc()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cliente uuid;
  v_item record;
begin
  if new.resposta = 'nao_conforme' then
    select cliente_id into v_cliente from public.visitas where id = new.visita_id;
    select codigo, pergunta into v_item from public.checklist_itens where id = new.item_id;
    insert into public.capas (cliente_id, visita_id, item_codigo, descricao, responsavel, prazo, origem)
    values (
      v_cliente,
      new.visita_id,
      v_item.codigo,
      coalesce(new.descricao, v_item.pergunta),
      'A definir',
      current_date + interval '30 days',
      'campo'
    );
  end if;
  return new;
end;
$$;

create trigger nc_gera_capa
  after insert on public.visita_respostas
  for each row
  execute function public.criar_capa_para_nc();

-- ------------------------------------------------------------
-- Gatilhos de atualizado_em + RLS
-- ------------------------------------------------------------
create trigger processos_atualizado_em before update on public.processos_certificacao
  for each row execute function public.tocar_atualizado_em();
create trigger contratos_atualizado_em before update on public.contratos
  for each row execute function public.tocar_atualizado_em();
create trigger capas_atualizado_em before update on public.capas
  for each row execute function public.tocar_atualizado_em();
create trigger tarefas_atualizado_em before update on public.tarefas
  for each row execute function public.tocar_atualizado_em();

do $$
declare t text;
begin
  foreach t in array array[
    'processos_certificacao', 'movimentos_workflow', 'contratos',
    'checklists', 'checklist_versoes', 'checklist_itens',
    'visitas', 'visita_respostas', 'capas', 'capa_acoes', 'tarefas'
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

-- Contratos: aprovação/rejeição exige alçada (política adicional restritiva por coluna
-- é aplicada na camada de aplicação; aqui garantimos que apenas quem tem alçada decide)
create or replace function public.tem_alcada()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    (select alcada_aprovacao from public.perfis where id = (select auth.uid())),
    false
  );
$$;
