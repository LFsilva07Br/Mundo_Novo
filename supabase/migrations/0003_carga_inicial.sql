-- ============================================================
-- Mundo Novo Café — Migration 0003: Carga inicial (carteira real)
-- Fonte: protótipo v2 validado pelo JP + planilhas da cliente
-- (Controle Ambiental e Estimativa de Safra — Alto da Serra).
-- UUIDs fixos para permitir referências estáveis e reexecução controlada.
-- ============================================================

-- Grupos ------------------------------------------------------
insert into public.grupos (id, nome, administracao, nome_administrador, cidade, uf) values
  ('11111111-0000-4000-8000-000000000001', 'Grupo Alta Mogiana',    'mundo_novo', null,                      'São Sebastião do Paraíso', 'MG'),
  ('11111111-0000-4000-8000-000000000002', 'Grupo Cerrado Mineiro', 'mundo_novo', null,                      'Patrocínio',               'MG'),
  ('11111111-0000-4000-8000-000000000003', 'Expocaccer',            'terceiro',   'Expocaccer (cooperativa)', 'Patrocínio',               'MG');

-- Clientes ----------------------------------------------------
insert into public.clientes (id, grupo_id, nome, tipo, fase, produtor, cidade, uf, regiao) values
  ('22222222-0000-4000-8000-000000000001', '11111111-0000-4000-8000-000000000001', 'Fazenda Alto da Serra',      'fazenda',            'ativo', 'Silvio Dutra', 'São Sebastião do Paraíso', 'MG', 'Sudoeste / Alta Mogiana'),
  ('22222222-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000002', 'Fazenda Bernardes',          'fazenda',            'ativo', null,           'Patrocínio',               'MG', 'Cerrado Mineiro'),
  ('22222222-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000002', 'Fazenda Cedro',              'fazenda',            'ativo', null,           'Serra do Salitre',         'MG', 'Cerrado Mineiro'),
  ('22222222-0000-4000-8000-000000000004', '11111111-0000-4000-8000-000000000002', 'Fazenda Chapadão de Ferro',  'fazenda',            'ativo', null,           'Guimarânia',               'MG', 'Cerrado Mineiro'),
  ('22222222-0000-4000-8000-000000000005', '11111111-0000-4000-8000-000000000002', 'Fazenda Lagoinha',           'fazenda',            'ativo', null,           'Pedrinópolis',             'MG', 'Cerrado Mineiro'),
  ('22222222-0000-4000-8000-000000000006', '11111111-0000-4000-8000-000000000002', 'Fazenda Lambari',            'fazenda',            'ativo', null,           'Monte Carmelo',            'MG', 'Cerrado Mineiro'),
  ('22222222-0000-4000-8000-000000000007', null,                                    'Fazenda Tecoara',            'fazenda',            'ativo', null,           'São Sebastião do Paraíso', 'MG', 'Sudoeste de Minas'),
  ('22222222-0000-4000-8000-000000000008', '11111111-0000-4000-8000-000000000003', 'Fazendas Guatambu',          'cadeia_suprimentos', 'ativo', null,           'São Sebastião do Paraíso', 'MG', 'Sudoeste / Alta Mogiana');

-- Certificações ----------------------------------------------
insert into public.certificacoes (cliente_id, norma, versao_norma, certificadora, principal, status, vence_em, renovacao_anual) values
  ('22222222-0000-4000-8000-000000000001', 'ra',       '1.4', 'ALAICE',      true,  'ativa',          '2026-08-14', true),
  ('22222222-0000-4000-8000-000000000002', 'ra',       '1.4', 'ALAICE',      true,  'ativa',          '2027-05-29', true),
  ('22222222-0000-4000-8000-000000000002', 'quatro_c', null,  '4C Services', false, 'ativa',          null,         true),
  ('22222222-0000-4000-8000-000000000003', 'ra',       '1.4', 'ALAICE',      true,  'ativa',          '2026-08-14', true),
  ('22222222-0000-4000-8000-000000000004', 'ra',       '1.4', 'ALAICE',      true,  'ativa',          '2026-08-14', true),
  ('22222222-0000-4000-8000-000000000005', 'ra',       '1.4', 'ALAICE',      true,  'ativa',          '2026-08-14', true),
  ('22222222-0000-4000-8000-000000000006', 'ra',       '1.4', 'ALAICE',      true,  'ativa',          '2026-09-30', true),
  ('22222222-0000-4000-8000-000000000006', 'organico', null,  'IBD',         false, 'em_implantacao', null,         true),
  ('22222222-0000-4000-8000-000000000007', 'ra',       '1.4', 'ALAICE',      true,  'ativa',          '2026-10-12', true),
  ('22222222-0000-4000-8000-000000000008', 'ra',       '1.4', 'ALAICE',      true,  'ativa',          '2026-11-03', true);

-- Contatos por área (Alto da Serra) --------------------------
insert into public.contatos_cliente (cliente_id, nome, area) values
  ('22222222-0000-4000-8000-000000000001', 'Silvio Dutra',            'proprietario'),
  ('22222222-0000-4000-8000-000000000001', 'Tâmara Isa da Silva',     'ambiental'),
  ('22222222-0000-4000-8000-000000000001', 'Winicius Baquião Dutra',  'agricola');

-- Imóveis rurais (Alto da Serra — planilha de controle ambiental)
insert into public.imoveis_rurais (id, cliente_id, nome, proprietarios, cidade, uf, car, matriculas, area_total_ha, area_cafe_ha, area_app_ha, area_reserva_ha, possui_captacao_agua) values
  ('33333333-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'Serra da Boa Vista',                  'Silvio Dutra',                              null, 'SP', 'SP-3547908-B4A2.C0A0.F075.4955.8CC7.7440', '7323',            4.2038,  3.74,  0,      0,       false),
  ('33333333-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001', 'Sítio Serra da Boa Vista',            'Silvio Dutra',                              null, 'SP', 'SP-3547908-8473.450D.6019.45DD.953E.686B', '6390',            9.0505,  6.59,  0,      0,       false),
  ('33333333-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000001', 'Sítio Santa Luzia',                   'Silvio Dutra',                              null, 'MG', 'MG-3164704-08A7.1857.781A.44CB.B3C4.DEAD', '45266',           24.523,  13.52, 0,      11.1745, false),
  ('33333333-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000001', 'Sítio Alto da Serra',                 'Luzia Albina Baquião Dutra e Silvio Dutra', null, 'MG', 'MG-3164704-0C7D.52B3.4818.4315.A418.CED6', '37626',           7.9763,  7,     0,      0,       false),
  ('33333333-0000-4000-8000-000000000005', '22222222-0000-4000-8000-000000000001', 'Sítio Alto da Serra (Garagem)',       'Silvio Dutra',                              null, 'MG', 'MG-3164704-6E05.9C43.F267.4519.BCA4.18A1', '37.624 / 40.734', 24.5757, 13.47, 0.6815, 6.7477,  true),
  ('33333333-0000-4000-8000-000000000006', '22222222-0000-4000-8000-000000000001', 'Sítio Serra da Boa Vista (Terezinha)','Maria Terezinha Dutra Varo / Maria Helena', null, 'MG', 'MG-3164704-3D7E.9BDC.BFB2.410C.8BCE.870C', '37629',           9.655,   0,     0.6038, 9.655,   false),
  ('33333333-0000-4000-8000-000000000007', '22222222-0000-4000-8000-000000000001', 'Sítio Geovana',                       'Elenice Dutra',                             null, 'MG', 'MG-3164704-211D.94DD.FC6A.43EA.A86B.DE7A', '37625',           2.0217,  1.4,   0,      0,       false),
  ('33333333-0000-4000-8000-000000000008', '22222222-0000-4000-8000-000000000001', 'Sítio São Mateus',                    'Elenice Dutra',                             null, 'SP', 'SP-3547908-8209.8B0E.FCE3.4480.93BE.9868', '7325',            7.7688,  3.38,  0,      0,       false),
  ('33333333-0000-4000-8000-000000000009', '22222222-0000-4000-8000-000000000001', 'Nossa Senhora Aparecida',             'Adriana Martins Lana Dutra / Carter Dutra', null, 'MG', 'MG-3164704-FAA4.347D.33F9.4A89.A60D.7EFF', '45267',           8.4181,  6.52,  0.4109, 1.3978,  true),
  ('33333333-0000-4000-8000-000000000010', '22222222-0000-4000-8000-000000000001', 'Sítio Santa Inês',                    'Maria Inês Dutra',                          null, 'SP', 'SP-3547908-069B88894447402E975CA213E7E6E', '7324',            5.96,    4,     0,      1.49,    false),
  ('33333333-0000-4000-8000-000000000011', '22222222-0000-4000-8000-000000000001', 'Sítio Tabuleiro',                     'Tâmara Isa da Silva / Winicius Baquião Dutra', null, 'SP', 'SP-3547908-6DEE.6B91.AD2B.46C4.A975.51CE', '8758',         3.0677,  2.6,   0,      0.193,   false);

-- Documentos por imóvel: CAR de todos + dispensas de licenciamento
insert into public.documentos_imovel (imovel_id, tipo, identificacao, status)
select id, 'car'::public.tipo_documento_imovel, car, 'ok'::public.status_documento
from public.imoveis_rurais
where cliente_id = '22222222-0000-4000-8000-000000000001';

insert into public.documentos_imovel (imovel_id, tipo, identificacao, status, observacao) values
  ('33333333-0000-4000-8000-000000000001', 'dispensa_licenca', 'Certidão de Dispensa de Licenciamento Ambiental', 'ok', 'Não se aplica vencimento'),
  ('33333333-0000-4000-8000-000000000002', 'licenca',          'Licenciamento ambiental',                          'vencido', 'Regularização pendente'),
  ('33333333-0000-4000-8000-000000000003', 'dispensa_licenca', 'Certidão de Dispensa de Licenciamento Ambiental', 'ok', null),
  ('33333333-0000-4000-8000-000000000004', 'dispensa_licenca', 'Certidão de Dispensa de Licenciamento Ambiental', 'ok', null),
  ('33333333-0000-4000-8000-000000000005', 'dispensa_licenca', 'Certidão de Dispensa de Licenciamento Ambiental', 'ok', null),
  ('33333333-0000-4000-8000-000000000006', 'licenca',          'Licenciamento ambiental',                          'vencido', 'Regularização pendente'),
  ('33333333-0000-4000-8000-000000000007', 'dispensa_licenca', 'Certidão de Dispensa de Licenciamento Ambiental', 'ok', null),
  ('33333333-0000-4000-8000-000000000008', 'dispensa_licenca', 'Certidão de Dispensa de Licenciamento Ambiental', 'ok', null),
  ('33333333-0000-4000-8000-000000000009', 'dispensa_licenca', 'Certidão de Dispensa de Licenciamento Ambiental', 'ok', null),
  ('33333333-0000-4000-8000-000000000010', 'dispensa_licenca', 'Certidão de Dispensa de Licenciamento Ambiental', 'ok', null);

-- Captações de água (planilha — Descrições Usos da Água)
insert into public.captacoes_agua (imovel_id, tipo_captacao, processo, classificacao, vence_em, status) values
  ('33333333-0000-4000-8000-000000000005', 'Captação de água em surgência (nascente)',                'Nº 0000001119/2024', 'Uso insignificante', '2027-01-15', 'ok'),
  ('33333333-0000-4000-8000-000000000009', 'Captação de água subterrânea por poço manual (cisterna)', 'Nº 0000026153/2023', 'Uso insignificante', '2026-05-31', 'vencido');

-- Talhões (planilha de estimativa de safra) ------------------
insert into public.talhoes (id, imovel_id, nome, area_ha, plantas_por_ha, espacamento, variedade, ano_plantio) values
  ('44444444-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000005', 'Garagem',              5.34, 4081, '3,50 x 0,70', 'M. Novo 376-4',    2010),
  ('44444444-0000-4000-8000-000000000002', '33333333-0000-4000-8000-000000000004', 'João',                 3.00, 4166, '3,00 x 0,80', 'Catuaí 99',        2000),
  ('44444444-0000-4000-8000-000000000003', '33333333-0000-4000-8000-000000000004', 'João Novo',            4.00, 4761, '3,50 x 0,60', 'Catuaí 99',        2025),
  ('44444444-0000-4000-8000-000000000004', '33333333-0000-4000-8000-000000000002', 'São Bento',            6.59, 4081, '3,50 x 0,70', 'M. Novo 376-4',    2017),
  ('44444444-0000-4000-8000-000000000005', '33333333-0000-4000-8000-000000000005', 'Baixada',              2.32, 4201, '3,40 x 0,70', 'Icatu Vermelho',   2019),
  ('44444444-0000-4000-8000-000000000006', '33333333-0000-4000-8000-000000000005', 'Mangueira',            3.71, 4201, '3,40 x 0,70', 'Catuaí 99',        2016),
  ('44444444-0000-4000-8000-000000000007', '33333333-0000-4000-8000-000000000005', 'Barracão',             2.10, 4201, '3,40 x 0,70', 'Arara',            2020),
  ('44444444-0000-4000-8000-000000000008', '33333333-0000-4000-8000-000000000003', 'Santa Luzia 1',        1.45, 4081, '3,50 x 0,70', 'M. Novo 376-4',    2016),
  ('44444444-0000-4000-8000-000000000009', '33333333-0000-4000-8000-000000000003', 'Santa Luzia SP',       4.20, null, '3,50 x 0,70', 'M. Novo 376-4',    2016),
  ('44444444-0000-4000-8000-000000000010', '33333333-0000-4000-8000-000000000003', 'Santa Luzia 2',        7.87, 4081, '3,50 x 0,70', 'M. Novo 376-4',    2014),
  ('44444444-0000-4000-8000-000000000011', '33333333-0000-4000-8000-000000000001', 'Santo Antônio',        3.74, 3676, '3,40 x 0,80', 'M. Novo 376-4',    2004),
  ('44444444-0000-4000-8000-000000000012', '33333333-0000-4000-8000-000000000011', 'Tabuleiro',            2.60, 4202, '3,40 x 0,70', 'Colombiano/Arara', 2021),
  ('44444444-0000-4000-8000-000000000013', '33333333-0000-4000-8000-000000000010', 'Santa Inês 1',         3.38, 4464, '3,20 x 0,70', 'Catuai 99',        2014),
  ('44444444-0000-4000-8000-000000000014', '33333333-0000-4000-8000-000000000010', 'Santa Inês 2',         0.62, 4201, '3,40 x 0,70', 'Icatu Vermelho',   2019),
  ('44444444-0000-4000-8000-000000000015', '33333333-0000-4000-8000-000000000009', 'Nsª Srª da Aparecida', 6.52, 4201, '3,40 x 0,70', 'Icatu Vermelho',   2019),
  ('44444444-0000-4000-8000-000000000016', '33333333-0000-4000-8000-000000000008', 'Iapar',                0.48, 4201, '3,40 x 0,70', 'IPR 100',          2018),
  ('44444444-0000-4000-8000-000000000017', '33333333-0000-4000-8000-000000000008', 'Arara',                0.72, 4201, '3,40 x 0,70', 'Arara',            2020),
  ('44444444-0000-4000-8000-000000000018', '33333333-0000-4000-8000-000000000008', 'Rubi',                 2.18, 3676, '3,40 x 0,80', 'Rubi MG 1192',     2006),
  ('44444444-0000-4000-8000-000000000019', '33333333-0000-4000-8000-000000000007', 'Catuaí 99',            1.40, 5102, '2,80 x 0,70', 'Catuaí 99',        2000);

-- Safras ------------------------------------------------------
insert into public.safras (id, rotulo) values
  ('55555555-0000-4000-8000-000000000001', '2021/22'),
  ('55555555-0000-4000-8000-000000000002', '2022/23'),
  ('55555555-0000-4000-8000-000000000003', '2023/24'),
  ('55555555-0000-4000-8000-000000000004', '2024/25'),
  ('55555555-0000-4000-8000-000000000005', '2025/26');

-- Histórico 2025/26 por talhão (estado, previsão, poda) -------
insert into public.talhao_safras (talhao_id, safra_id, estado_lavoura, previsao_sacas, previsao_poda_renovacao) values
  ('44444444-0000-4000-8000-000000000001', '55555555-0000-4000-8000-000000000005', 'Produção',    373.8, 'Poda e esqueletamento'),
  ('44444444-0000-4000-8000-000000000002', '55555555-0000-4000-8000-000000000005', 'Produção',    240,   null),
  ('44444444-0000-4000-8000-000000000003', '55555555-0000-4000-8000-000000000005', 'Plantio',     0,     null),
  ('44444444-0000-4000-8000-000000000004', '55555555-0000-4000-8000-000000000005', 'Produção',    527.2, null),
  ('44444444-0000-4000-8000-000000000005', '55555555-0000-4000-8000-000000000005', 'Produção',    139.2, null),
  ('44444444-0000-4000-8000-000000000006', '55555555-0000-4000-8000-000000000005', 'Produção',    111.3, null),
  ('44444444-0000-4000-8000-000000000007', '55555555-0000-4000-8000-000000000005', 'Produção',    126,   null),
  ('44444444-0000-4000-8000-000000000008', '55555555-0000-4000-8000-000000000005', 'Produção',    116,   null),
  ('44444444-0000-4000-8000-000000000009', '55555555-0000-4000-8000-000000000005', 'Produção',    336,   null),
  ('44444444-0000-4000-8000-000000000010', '55555555-0000-4000-8000-000000000005', 'Produção',    550.9, 'Poda'),
  ('44444444-0000-4000-8000-000000000011', '55555555-0000-4000-8000-000000000005', 'Produção',    187,   null),
  ('44444444-0000-4000-8000-000000000012', '55555555-0000-4000-8000-000000000005', 'Produção',    150,   null),
  ('44444444-0000-4000-8000-000000000013', '55555555-0000-4000-8000-000000000005', 'Produção',    236.6, null),
  ('44444444-0000-4000-8000-000000000014', '55555555-0000-4000-8000-000000000005', 'Produção',    24.8,  null),
  ('44444444-0000-4000-8000-000000000015', '55555555-0000-4000-8000-000000000005', 'Produção',    260.8, 'Poda e esqueletamento'),
  ('44444444-0000-4000-8000-000000000016', '55555555-0000-4000-8000-000000000005', 'Produção',    20,    null),
  ('44444444-0000-4000-8000-000000000017', '55555555-0000-4000-8000-000000000005', 'Produção',    30,    null),
  ('44444444-0000-4000-8000-000000000018', '55555555-0000-4000-8000-000000000005', 'Esqueletado', 0,     null),
  ('44444444-0000-4000-8000-000000000019', '55555555-0000-4000-8000-000000000005', 'Esqueletado', 0,     null);

-- Histórico 2024/25 (previsão × colheita efetiva conhecidas) --
insert into public.talhao_safras (talhao_id, safra_id, previsao_sacas, colheita_efetiva_sacas) values
  ('44444444-0000-4000-8000-000000000001', '55555555-0000-4000-8000-000000000004', 120, 51),
  ('44444444-0000-4000-8000-000000000004', '55555555-0000-4000-8000-000000000004', 0,   0),
  ('44444444-0000-4000-8000-000000000005', '55555555-0000-4000-8000-000000000004', 100, 16),
  ('44444444-0000-4000-8000-000000000006', '55555555-0000-4000-8000-000000000004', 250, 211),
  ('44444444-0000-4000-8000-000000000007', '55555555-0000-4000-8000-000000000004', 80,  14),
  ('44444444-0000-4000-8000-000000000010', '55555555-0000-4000-8000-000000000004', 30,  7),
  ('44444444-0000-4000-8000-000000000011', '55555555-0000-4000-8000-000000000004', 190, 142),
  ('44444444-0000-4000-8000-000000000013', '55555555-0000-4000-8000-000000000004', 0,   0),
  ('44444444-0000-4000-8000-000000000014', '55555555-0000-4000-8000-000000000004', 30,  8),
  ('44444444-0000-4000-8000-000000000015', '55555555-0000-4000-8000-000000000004', 230, 79),
  ('44444444-0000-4000-8000-000000000016', '55555555-0000-4000-8000-000000000004', 20,  8),
  ('44444444-0000-4000-8000-000000000017', '55555555-0000-4000-8000-000000000004', 30,  12),
  ('44444444-0000-4000-8000-000000000018', '55555555-0000-4000-8000-000000000004', 0,   0),
  ('44444444-0000-4000-8000-000000000019', '55555555-0000-4000-8000-000000000004', 0,   0);
