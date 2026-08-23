-- ============================================================
-- Mundo Novo Café — Migration 0009: Evidências, overrides e senha
-- Fotos de visita (GPS/hora), evidências de CAPA, régua de alertas
-- por cliente e troca de senha obrigatória no primeiro acesso.
-- ============================================================

-- Troca de senha obrigatória -----------------------------------
alter table public.perfis add column deve_trocar_senha boolean not null default false;

update public.perfis set deve_trocar_senha = true
where email in ('felipeluiz06silva@gmail.com', 'torresjoao201804@gmail.com');

-- Fotos capturadas nas visitas (armazenadas no bucket 'evidencias')
create table public.visita_fotos (
  id uuid primary key default gen_random_uuid(),
  visita_id uuid not null references public.visitas (id) on delete cascade,
  item_id uuid references public.checklist_itens (id) on delete set null,
  caminho text not null,                 -- caminho no bucket
  gps text,                              -- "lat,long"
  tirada_em timestamptz not null default now(),
  criado_em timestamptz not null default now()
);

-- Evidências anexadas às ações de CAPA
create table public.capa_evidencias (
  id uuid primary key default gen_random_uuid(),
  capa_id uuid not null references public.capas (id) on delete cascade,
  acao_id uuid references public.capa_acoes (id) on delete set null,
  caminho text not null,
  descricao text,
  autor_id uuid references public.perfis (id),
  criado_em timestamptz not null default now()
);

-- Override da régua de disparos por cliente --------------------
create table public.config_alertas_cliente (
  cliente_id uuid primary key references public.clientes (id) on delete cascade,
  dias int[] not null,                   -- ex.: {90,60,30,15,7}
  copia_admin_grupo boolean not null default false,
  atualizado_em timestamptz not null default now()
);

comment on table public.config_alertas_cliente is
  'Régua de disparos específica do cliente — sobrepõe o padrão global do motor por data.';

do $$
declare t text;
begin
  foreach t in array array['visita_fotos', 'capa_evidencias', 'config_alertas_cliente'] loop
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

-- Bucket de evidências: acesso de leitura/escrita para a equipe
insert into storage.buckets (id, name, public)
values ('evidencias', 'evidencias', false)
on conflict (id) do nothing;

create policy "equipe le evidencias" on storage.objects
  for select to authenticated
  using (bucket_id = 'evidencias' and public.eh_equipe_ativa());

create policy "equipe envia evidencias" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'evidencias' and public.eh_equipe_ativa());

create policy "equipe remove evidencias" on storage.objects
  for delete to authenticated
  using (bucket_id = 'evidencias' and public.eh_equipe_ativa());
