-- ============================================================
-- Mundo Novo Café — Migration 0006: Carga inicial das operações
-- Social (planilha Dutra da Serra), checklist RA 1.4 v1 publicado,
-- posição dos clientes no workflow, contratos e CAPAs iniciais.
-- ============================================================

-- Social — trabalhadores reais (Fazenda Alto da Serra) ---------
insert into public.trabalhadores (id, cliente_id, nome, funcao, cbo, salario, admissao, nascimento, genero, moradia, insalubridade, funcoes_habilitadas) values
  ('66666666-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'Antonio Sales Ferreira',            'Trabalhador Agrop. em Geral', '621005', 1783.10, '2017-12-20', '1970-03-26', 'masculino', true,  false, '{Trator,Benefício,Outros}'),
  ('66666666-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001', 'Delorme de Abreu',                  'Trabalhador Agrop. em Geral', '621005', 1783.10, '2016-05-10', '1953-02-08', 'masculino', true,  false, '{Outros}'),
  ('66666666-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000001', 'Edio Araujo dos Santos',            'Trabalhador Agrop. em Geral', '621005', 1783.10, '2026-06-05', '1971-09-23', 'masculino', true,  false, '{Outros}'),
  ('66666666-0000-4000-8000-000000000004', '22222222-0000-4000-8000-000000000001', 'Leandra Carla de Oliveira Pandini', 'Trabalhador Agrop. em Geral', '621005', 1783.10, '2026-06-05', '1981-02-11', 'feminino',  true,  false, '{Outros}'),
  ('66666666-0000-4000-8000-000000000005', '22222222-0000-4000-8000-000000000001', 'Ricardo Aparecido de Abreu',        'Tratorista Agrícola',         '641015', 1890.00, '2020-02-11', '1986-04-17', 'masculino', false, true,  '{Abastecimento,"Aplicação de defensivos",Colhedeira,Trator,Lavador,Outros}'),
  ('66666666-0000-4000-8000-000000000006', '22222222-0000-4000-8000-000000000001', 'Rogerio Aparecido de Abreu',        'Tratorista Agrícola',         '641015', 1890.00, '2016-05-10', '1980-05-29', 'masculino', false, false, '{Trator,Lavador,Outros}');

-- Moradias e moradores ----------------------------------------
insert into public.moradias (id, cliente_id, nome) values
  ('77777777-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', 'Casa 01'),
  ('77777777-0000-4000-8000-000000000002', '22222222-0000-4000-8000-000000000001', 'Casa 02'),
  ('77777777-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000001', 'Casa 03');

insert into public.moradores (moradia_id, trabalhador_id, nome, parentesco, nascimento, genero) values
  ('77777777-0000-4000-8000-000000000001', '66666666-0000-4000-8000-000000000001', 'Antônio Sales Ferreira', 'Colaborador', '1970-03-26', 'masculino'),
  ('77777777-0000-4000-8000-000000000001', null, 'Josiane Maria Emygdio', 'Esposa', null, 'feminino'),
  ('77777777-0000-4000-8000-000000000001', null, 'Fabricio', 'Filho', null, 'masculino'),
  ('77777777-0000-4000-8000-000000000001', null, 'Gustavo Henrique Emygdio dos Santos', 'Enteado', '2016-03-31', 'masculino'),
  ('77777777-0000-4000-8000-000000000001', null, 'Francisco Emygdio da Silva', 'Enteado', '2018-12-22', 'masculino'),
  ('77777777-0000-4000-8000-000000000002', '66666666-0000-4000-8000-000000000002', 'Delorme de Abreu', 'Colaborador', '1953-02-08', 'masculino'),
  ('77777777-0000-4000-8000-000000000002', null, 'Jacilda Damacena de Abreu', 'Esposa', '1960-09-05', 'feminino');

-- Treinamentos e participações --------------------------------
insert into public.treinamentos (id, nome, norma, periodicidade_meses) values
  ('88888888-0000-4000-8000-000000000001', 'Defensivos',                        'NR-31',      12),
  ('88888888-0000-4000-8000-000000000002', 'Noções de Primeiros Socorros',      null,         12),
  ('88888888-0000-4000-8000-000000000003', 'NR 11 e 17 — Ergonomia',            'NR-11/17',   12),
  ('88888888-0000-4000-8000-000000000004', 'Prevenção de Acidentes e Uso de EPI', null,       12),
  ('88888888-0000-4000-8000-000000000005', 'Combate a Incêndio',                null,         12),
  ('88888888-0000-4000-8000-000000000006', 'Colhedeira',                        'NR-31',      24);

-- Turma de março (Antonio, Delorme, Ricardo, Rogerio) e turma de junho (Edio, Leandra)
insert into public.treinamento_participacoes (treinamento_id, trabalhador_id, realizado_em, vence_em)
select t.id, w.id, d.realizado, (d.realizado + (t.periodicidade_meses || ' months')::interval)::date
from (values
  ('88888888-0000-4000-8000-000000000001', '66666666-0000-4000-8000-000000000001', '2026-03-06'::date),
  ('88888888-0000-4000-8000-000000000001', '66666666-0000-4000-8000-000000000005', '2026-03-06'),
  ('88888888-0000-4000-8000-000000000002', '66666666-0000-4000-8000-000000000001', '2026-03-03'),
  ('88888888-0000-4000-8000-000000000002', '66666666-0000-4000-8000-000000000002', '2026-03-03'),
  ('88888888-0000-4000-8000-000000000002', '66666666-0000-4000-8000-000000000005', '2026-03-03'),
  ('88888888-0000-4000-8000-000000000002', '66666666-0000-4000-8000-000000000006', '2026-03-03'),
  ('88888888-0000-4000-8000-000000000002', '66666666-0000-4000-8000-000000000003', '2026-06-08'),
  ('88888888-0000-4000-8000-000000000002', '66666666-0000-4000-8000-000000000004', '2026-06-08'),
  ('88888888-0000-4000-8000-000000000003', '66666666-0000-4000-8000-000000000001', '2026-03-02'),
  ('88888888-0000-4000-8000-000000000003', '66666666-0000-4000-8000-000000000002', '2026-03-02'),
  ('88888888-0000-4000-8000-000000000003', '66666666-0000-4000-8000-000000000005', '2026-03-02'),
  ('88888888-0000-4000-8000-000000000003', '66666666-0000-4000-8000-000000000006', '2026-03-02'),
  ('88888888-0000-4000-8000-000000000003', '66666666-0000-4000-8000-000000000003', '2026-06-05'),
  ('88888888-0000-4000-8000-000000000003', '66666666-0000-4000-8000-000000000004', '2026-06-05'),
  ('88888888-0000-4000-8000-000000000004', '66666666-0000-4000-8000-000000000001', '2026-03-02'),
  ('88888888-0000-4000-8000-000000000004', '66666666-0000-4000-8000-000000000002', '2026-03-02'),
  ('88888888-0000-4000-8000-000000000004', '66666666-0000-4000-8000-000000000005', '2026-03-02'),
  ('88888888-0000-4000-8000-000000000004', '66666666-0000-4000-8000-000000000006', '2026-03-02'),
  ('88888888-0000-4000-8000-000000000004', '66666666-0000-4000-8000-000000000003', '2026-06-05'),
  ('88888888-0000-4000-8000-000000000004', '66666666-0000-4000-8000-000000000004', '2026-06-05'),
  ('88888888-0000-4000-8000-000000000005', '66666666-0000-4000-8000-000000000003', '2026-06-08'),
  ('88888888-0000-4000-8000-000000000005', '66666666-0000-4000-8000-000000000004', '2026-06-08')
) as d(treinamento, trabalhador, realizado)
join public.treinamentos t on t.id = d.treinamento::uuid
join public.trabalhadores w on w.id = d.trabalhador::uuid;

-- Exames por cargo --------------------------------------------
insert into public.exames_cargo (cargo, exame, periodicidade) values
  ('Tratorista Agrícola', 'Avaliação Clínica Ocupacional', 'Anual'),
  ('Tratorista Agrícola', 'Hemograma com contagem de plaquetas', 'Anual'),
  ('Tratorista Agrícola', 'Acetilcolinesterase eritrocitária', 'Anual'),
  ('Tratorista Agrícola', 'Audiometria tonal ocupacional', 'Anual'),
  ('Tratorista Agrícola', 'Avaliação da acuidade visual', 'Anual'),
  ('Trabalhador Rural', 'Avaliação Clínica Ocupacional', 'Anual'),
  ('Operador de Secador', 'Avaliação Clínica Ocupacional', 'Anual'),
  ('Operador de Secador', 'Audiometria tonal ocupacional', 'Anual'),
  ('Auxiliar de Escritório', 'Avaliação Clínica Ocupacional', 'Bienal');

-- Checklist RA 1.4 — versão 1 publicada -----------------------
insert into public.checklists (id, nome, norma, versao_norma) values
  ('99999999-0000-4000-8000-000000000001', 'Auditoria interna — Rainforest Alliance', 'ra', '1.4');

insert into public.checklist_versoes (id, checklist_id, numero, status, publicada_em) values
  ('99999999-0000-4000-8000-000000000002', '99999999-0000-4000-8000-000000000001', 1, 'publicada', now());

insert into public.checklist_itens (versao_id, ordem, codigo, capitulo, pergunta, referencia_norma) values
  ('99999999-0000-4000-8000-000000000002', 1,  '1.2.8', 'Cap. 1 · Gerência', 'Registros para propósitos de certificação e conformidade mantidos por, no mínimo, cinco anos.', 'RA 1.4 — cap. 1.2.8'),
  ('99999999-0000-4000-8000-000000000002', 2,  '1.2.9', 'Cap. 1 · Gerência', 'Mapa atualizado da fazenda, incluindo áreas de produção, moradias, escolas, ecossistemas naturais e áreas de risco identificadas.', 'RA 1.4 — cap. 1.2.9'),
  ('99999999-0000-4000-8000-000000000002', 3,  '1.4.1', 'Cap. 1 · Gerência', 'Sistema de inspeção interna implementado, avaliando anualmente a conformidade de todos os atores do escopo.', 'RA 1.4 — cap. 1.4.1'),
  ('99999999-0000-4000-8000-000000000002', 4,  '1.5.1', 'Cap. 1 · Gerência', 'Mecanismo de queixa acessível em qualquer idioma, com denúncias anônimas e proteção contra retaliação.', 'RA 1.4 — cap. 1.5.1'),
  ('99999999-0000-4000-8000-000000000002', 5,  '2.1.3', 'Cap. 2 · Rastreabilidade', 'Produto certificado mantido fisicamente separado do não certificado em todas as etapas.', 'RA 1.4 — cap. 2.1.3'),
  ('99999999-0000-4000-8000-000000000002', 6,  '2.1.5', 'Cap. 2 · Rastreabilidade', 'Produtos certificados rastreáveis até a fazenda de origem, com documentos de compra/venda completos.', 'RA 1.4 — cap. 2.1.5'),
  ('99999999-0000-4000-8000-000000000002', 7,  'EST-1', 'Estrutural · Infraestrutura', 'Depósito de defensivos em conformidade — alvenaria, piso impermeável e sinalização adequada.', 'RA 1.4 — infraestrutura'),
  ('99999999-0000-4000-8000-000000000002', 8,  'EST-2', 'Estrutural · Infraestrutura', 'Fiação elétrica do barracão de máquinas sem exposição nos disjuntores.', 'RA 1.4 — infraestrutura'),
  ('99999999-0000-4000-8000-000000000002', 9,  'EST-3', 'Estrutural · Infraestrutura', 'EPIs armazenados no local adequado, organizados e em bom estado.', 'RA 1.4 — infraestrutura'),
  ('99999999-0000-4000-8000-000000000002', 10, 'EST-4', 'Estrutural · Infraestrutura', 'Moradias dos colaboradores em bom estado de conservação.', 'RA 1.4 — infraestrutura');

-- Workflow — posição atual dos 8 clientes ---------------------
insert into public.processos_certificacao (cliente_id, etapa) values
  ('22222222-0000-4000-8000-000000000001', 'auditoria_interna'),
  ('22222222-0000-4000-8000-000000000006', 'auditoria_interna'),
  ('22222222-0000-4000-8000-000000000002', 'correcao_ncs'),
  ('22222222-0000-4000-8000-000000000007', 'correcao_ncs'),
  ('22222222-0000-4000-8000-000000000003', 'revisao_gestor'),
  ('22222222-0000-4000-8000-000000000008', 'revisao_gestor'),
  ('22222222-0000-4000-8000-000000000004', 'na_certificadora'),
  ('22222222-0000-4000-8000-000000000005', 'aprovado');

-- Contratos aguardando alçada ---------------------------------
insert into public.contratos (codigo, cliente_nome, tipo, solicitado_por, solicitado_em) values
  ('2026-041', 'Fazenda Rio Verde (novo cadastro)', 'fazenda',            'Adriano Carvalho',    '2026-07-15'),
  ('2026-039', 'Sítio Boa Vista',                   'cadeia_suprimentos', 'Raiane Gomes Borges', '2026-07-10');

-- CAPAs iniciais ----------------------------------------------
insert into public.capas (numero, cliente_id, item_codigo, descricao, severidade, responsavel, prazo, status, origem) values
  (131, '22222222-0000-4000-8000-000000000001', 'EST-1', 'Depósito de defensivos sem sinalização adequada e piso não impermeável', 'maior', 'Silvio Dutra',           '2026-09-15', 'em_correcao',          'campo'),
  (130, '22222222-0000-4000-8000-000000000007', 'EST-2', 'Fiação exposta nos disjuntores do barracão de máquinas',                  'maior', 'Produtor responsável',   '2026-09-05', 'aguardando_evidencia', 'campo'),
  (129, '22222222-0000-4000-8000-000000000004', '1.2.8', 'Registros de aplicação de defensivos incompletos no último ciclo',        'menor', 'Gestor da fazenda',      '2026-09-30', 'aberta',               'escritorio'),
  (128, '22222222-0000-4000-8000-000000000003', '1.5.1', 'Mecanismo de queixa sem canal anônimo divulgado aos colaboradores',       'menor', 'RH da fazenda',          '2026-10-10', 'em_correcao',          'escritorio'),
  (127, '22222222-0000-4000-8000-000000000006', 'EST-3', 'EPIs armazenados fora do local adequado',                                 'menor', 'Encarregado de campo',   null,         'fechada',              'campo');

insert into public.capa_acoes (capa_id, ordem, descricao, concluida, concluida_em) values
  ((select id from public.capas where numero = 131), 1, 'Instalar sinalização NR-31 no depósito', false, null),
  ((select id from public.capas where numero = 131), 2, 'Impermeabilizar o piso do depósito', false, null),
  ((select id from public.capas where numero = 131), 3, 'Instalar trava/cadeado na porta', true, '2026-08-20');
