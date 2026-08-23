-- ============================================================
-- Mundo Novo Café — Migration 0011: Módulos da norma expandidos
-- Agroquímicos, EPI/atas, casos sociais e queixas, plano de gestão,
-- achados externos, DS/DI, planejamento de visitas, push e trilha.
-- ============================================================

-- ------------------------------------------------------------
-- Agroquímicos: catálogo (com lista proibida RA) e aplicações
-- ------------------------------------------------------------
create table public.produtos_agroquimicos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ingrediente_ativo text,
  proibido_ra boolean not null default false,   -- lista de banidos da Rainforest
  observacao text,
  criado_em timestamptz not null default now()
);

create table public.aplicacoes_defensivos (
  id uuid primary key default gen_random_uuid(),
  talhao_id uuid not null references public.talhoes (id) on delete cascade,
  produto_id uuid references public.produtos_agroquimicos (id) on delete set null,
  produto_nome text not null,
  dose text,
  data date not null default current_date,
  aplicador_id uuid references public.trabalhadores (id) on delete set null,
  equipamento text,
  observacao text,
  criado_por uuid references public.perfis (id),
  criado_em timestamptz not null default now()
);

-- Destinação de embalagens (tríplice lavagem / devolução)
create table public.destinacoes_embalagens (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  data date not null default current_date,
  quantidade int,
  descricao text,
  comprovante_caminho text,                     -- bucket evidencias
  criado_em timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Social: fichas de EPI e assinatura de treinamentos
-- ------------------------------------------------------------
create table public.fichas_epi (
  id uuid primary key default gen_random_uuid(),
  trabalhador_id uuid not null references public.trabalhadores (id) on delete cascade,
  epi text not null,
  ca text,                                      -- certificado de aprovação
  quantidade int not null default 1,
  entregue_em date not null default current_date,
  assinatura_caminho text,                      -- bucket evidencias
  criado_em timestamptz not null default now()
);

alter table public.treinamento_participacoes
  add column assinatura_caminho text,
  add column ata_caminho text;

-- ------------------------------------------------------------
-- Avaliar-e-tratar (cap. 5.1) e canal de queixas (1.5.1)
-- ------------------------------------------------------------
create type public.tipo_caso_social as enum
  ('trabalho_infantil', 'trabalho_forcado', 'discriminacao', 'assedio', 'outro');
create type public.status_caso as enum ('aberto', 'em_remediacao', 'encerrado');

create table public.casos_sociais (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  tipo public.tipo_caso_social not null,
  origem text not null default 'monitoramento', -- monitoramento | queixa | auditoria
  descricao text not null,
  remediacao text,
  status public.status_caso not null default 'aberto',
  responsavel_id uuid references public.perfis (id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create type public.status_queixa as enum ('recebida', 'em_analise', 'tratada');

create table public.queixas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  mensagem text not null,
  anonima boolean not null default true,
  contato text,                                 -- opcional, se não anônima
  status public.status_queixa not null default 'recebida',
  caso_id uuid references public.casos_sociais (id) on delete set null,
  criado_em timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Plano de gestão e avaliação de risco anual (cap. 1.3)
-- ------------------------------------------------------------
create table public.planos_gestao (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  ano int not null,
  riscos jsonb not null default '[]',           -- [{area, risco, probabilidade, impacto, mitigacao}]
  metas jsonb not null default '[]',            -- [{meta, prazo, responsavel, concluida}]
  observacao text,
  atualizado_em timestamptz not null default now(),
  unique (cliente_id, ano)
);

-- ------------------------------------------------------------
-- Achados da auditoria externa (certificadora)
-- ------------------------------------------------------------
create table public.achados_externos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  certificadora text,
  codigo text,                                  -- código do achado na certificadora
  item_norma text,
  descricao text not null,
  severidade public.severidade_nc not null default 'menor',
  prazo date,
  status public.status_capa not null default 'aberta',
  capa_id uuid references public.capas (id) on delete set null,
  encontrado_em date not null default current_date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Diferencial de Sustentabilidade / Investimentos (DS/DI)
-- ------------------------------------------------------------
create type public.tipo_pagamento_ds as enum ('diferencial', 'investimento');

create table public.pagamentos_sustentabilidade (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  negociacao_id uuid references public.negociacoes (id) on delete set null,
  tipo public.tipo_pagamento_ds not null,
  valor numeric(12,2) not null,
  data date not null default current_date,
  descricao text,
  comprovante_caminho text,
  criado_em timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Planejamento anual de visitas (cobertura 100%)
-- ------------------------------------------------------------
create table public.planejamento_visitas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  ano int not null,
  mes_previsto int not null check (mes_previsto between 1 and 12),
  tipo text not null default 'auditoria_interna',
  visita_id uuid references public.visitas (id) on delete set null,
  observacao text,
  criado_em timestamptz not null default now(),
  unique (cliente_id, ano, tipo)
);

-- ------------------------------------------------------------
-- Notificações push (PWA)
-- ------------------------------------------------------------
create table public.push_assinaturas (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfis (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  criado_em timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Trilha de auditoria do sistema (log imutável em nível de app)
-- ------------------------------------------------------------
create table public.trilha_auditoria (
  id uuid primary key default gen_random_uuid(),
  tabela text not null,
  registro_id text,
  acao text not null,                           -- inserir | atualizar | remover
  autor_id uuid,
  dados jsonb,
  ocorrido_em timestamptz not null default now()
);

-- Trigger genérico de trilha para tabelas críticas
create or replace function public.registrar_trilha()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.trilha_auditoria (tabela, registro_id, acao, autor_id, dados)
  values (
    tg_table_name,
    coalesce((case when tg_op = 'DELETE' then old.id else new.id end)::text, ''),
    lower(tg_op),
    (select auth.uid()),
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'clientes', 'certificacoes', 'contratos', 'capas', 'checklist_versoes',
    'perfis', 'lotes', 'negociacoes', 'aplicacoes_defensivos', 'casos_sociais'
  ] loop
    execute format(
      'create trigger trilha_%I after insert or update or delete on public.%I
         for each row execute function public.registrar_trilha()', t, t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- Gatilhos de atualizado_em + RLS
-- ------------------------------------------------------------
create trigger casos_atualizado_em before update on public.casos_sociais
  for each row execute function public.tocar_atualizado_em();
create trigger achados_atualizado_em before update on public.achados_externos
  for each row execute function public.tocar_atualizado_em();

do $$
declare t text;
begin
  foreach t in array array[
    'produtos_agroquimicos', 'aplicacoes_defensivos', 'destinacoes_embalagens',
    'fichas_epi', 'casos_sociais', 'queixas', 'planos_gestao',
    'achados_externos', 'pagamentos_sustentabilidade', 'planejamento_visitas',
    'push_assinaturas'
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

-- Trilha: somente leitura para gestão (nada de update/delete — imutável)
alter table public.trilha_auditoria enable row level security;
create policy "gestao le trilha" on public.trilha_auditoria
  for select to authenticated using (public.eh_gestao());

-- Push: cada perfil gerencia as próprias assinaturas
create policy "perfil gerencia proprio push" on public.push_assinaturas
  for all to authenticated
  using (perfil_id = (select auth.uid()))
  with check (perfil_id = (select auth.uid()));
