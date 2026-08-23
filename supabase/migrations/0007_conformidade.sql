-- ============================================================
-- Mundo Novo Café — Migration 0007: conformidade consolidada
-- Percentual mantido por cliente até o motor de checklists
-- passar a calculá-lo automaticamente a partir das visitas.
-- ============================================================

alter table public.clientes add column conformidade int;

update public.clientes set conformidade = v.c
from (values
  ('22222222-0000-4000-8000-000000000001'::uuid, 88),
  ('22222222-0000-4000-8000-000000000002'::uuid, 94),
  ('22222222-0000-4000-8000-000000000003'::uuid, 79),
  ('22222222-0000-4000-8000-000000000004'::uuid, 71),
  ('22222222-0000-4000-8000-000000000005'::uuid, 85),
  ('22222222-0000-4000-8000-000000000006'::uuid, 90),
  ('22222222-0000-4000-8000-000000000007'::uuid, 68),
  ('22222222-0000-4000-8000-000000000008'::uuid, 76)
) as v(id, c)
where clientes.id = v.id;
