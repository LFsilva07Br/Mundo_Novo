# Documentação Funcional

> **Mundo Novo Café — Sistema de Gestão de Certificação**
> Esta documentação descreve o que o sistema faz, em linguagem de negócio.
> Ela é atualizada automaticamente a cada alteração publicada.

## O que é o sistema

Plataforma que substitui as planilhas, o FoodChecker e o Microsoft 365 no controle das certificações de fazendas de café (Rainforest Alliance 1.4 via ALAICE, 4C e Orgânico) da consultoria Mundo Novo — 52 clientes, entre grupo próprio e externos.

São duas experiências sobre a mesma base de dados:

- **Painel do Gestor** (computador) — visão consolidada, configuração e acompanhamento.
- **App do Consultor** (celular, funciona sem internet) — execução do trabalho de campo.

## Regras de ouro do sistema

1. **Não conformidade nunca fica sem plano de ação.** Marcar um item como não conforme cria o CAPA na hora, com responsável e prazo. O checklist não fecha sem isso.
2. **Alerta persiste até a resolução.** O aviso só desaparece quando a pendência é resolvida — com repique diário nos últimos 30 dias.
3. **Alçada é permissão, não etapa.** Quem não tem o flag de aprovação simplesmente não vê os botões de aprovar/rejeitar contratos.
4. **Documentos pertencem ao imóvel rural.** CAR, matrícula, licenças e outorgas são controlados por imóvel — uma fazenda pode ter vários.
5. **Checklist versionado.** Alterações do gestor só chegam ao app de campo após a publicação de uma nova versão.
6. **A fazenda passa por implantação antes de ser avaliada.** Só após concluir a implantação as fases de avaliação/certificação são habilitadas.
7. **Trabalho de escritório também conta.** Auditorias documentais e ações internas são registradas para demonstrar o valor da consultoria.

## Módulos

### ✅ Disponível — Fundação

| Funcionalidade | Descrição |
|---|---|
| Login | Entrada com e-mail e senha (biometria no app de campo virá na Fase 4) |
| Painel base | Estrutura de navegação com todos os módulos do sistema |
| Documentação viva | Esta documentação, atualizada a cada alteração |
| Manual do usuário | Guia de uso tela a tela em `/manual`, com imagens reais do sistema regeneradas automaticamente a cada nova versão publicada |
| **Grupos** | Estrutura da carteira: Grupo Alta Mogiana e Grupo Cerrado Mineiro (administrados pela Mundo Novo), Expocaccer (grupo externo) e clientes diretos, com contagem de clientes e conformidade média |
| **Clientes** | Carteira real com 8 clientes — fazendas e cadeias de suprimento — com certificações (RA, 4C, Orgânico), conformidade, vencimento em cores e ficha completa com contatos por área e imóveis rurais (CAR, matrícula, áreas e captação de água da planilha de controle ambiental) |

| **Dashboard** | Indicadores calculados da carteira (clientes, certificações, vencimentos em 90 dias, CAPAs, conformidade média) e certificados ordenados por vencimento |
| **Imóveis & Talhões** | Talhões do Alto da Serra com ficha completa (plantas/ha, espaçamento, variedade, ano, estado da lavoura) e comparativo entre 5 safras (previsão × colheita efetiva) |
| **Contratos & Alçada** | Fila de aprovação com seletor "ver como": sem alçada, os botões não aparecem; contrato parado >10 dias mostra escalonamento |
| **Workflow (Certificações)** | Kanban com as 5 etapas reais e os 8 clientes distribuídos; notificação automática ao gestor em "Na certificadora" |
| **CAPAs** | Planos de ação com severidade, responsável, prazo, origem Campo/Escritório e ranking de gaps |
| **Social & Colaboradores** | Trabalhadores reais (função, CBO, salário, benefícios, adicionais, funções habilitadas), moradias com parentesco, treinamentos NR com vencimento calculado e exames por cargo |
| **Editor de Checklist** | 10 itens reais da norma RA 1.4, cada um vinculado ao capítulo da norma, com exigências (foto mín., descrição mín.) que valem no app |
| **Alertas & Automação** | Os dois motores lado a lado: régua de disparos por data (padrão validado 90/60/30/15/7) e gatilhos por evento |
| **Visitas & Ações** | Registros de campo e de escritório com etiqueta de origem — inclui GPS/horário de início e fim no app |
| **Relatórios** | Estimativa de safra por produtor, controle ambiental (composição de áreas) e conformidade por cliente |
| **Usuários & Permissões** | Equipe real com papéis e o flag de alçada |

> **Modo demonstração:** enquanto o banco de dados não é conectado, todas as telas exibem os dados reais das planilhas e do protótipo validado, em modo somente leitura. Cadastro, edição e movimentação chegam junto com a conexão do banco.

### 🔜 Fase 1 — Cadastros e permissões

- **Grupos**: entidade própria, administrada pela Mundo Novo ou por terceiro (ex.: Expocaccer). Cliente sem grupo é cliente direto.
- **Clientes**: tipo, ID-RA, status do certificado, validade, acesso, contatos **por área** (proprietário, ambiental, agrícola, RH/social) e registro de contatos (ligações, e-mails).
- **Imóveis rurais**: CAR, matrícula(s), licença/dispensa de licenciamento, áreas (total, café, APP, reserva legal) e captações de água (outorgas/uso insignificante) — cada documento com vencimento monitorado.
- **Talhões**: área, nº de plantas/ha, espaçamento, variedade, ano de plantio, estado da lavoura, irrigação — com histórico por safra (previsão × colheita efetiva, poda e renovação).
- **Usuários & permissões**: papéis (diretoria, jurídico, comercial, gestor, consultor, auditor) e o flag de **alçada de aprovação de contratos**.

### 🔜 Fases seguintes

- **Fase 2** — Certificações por cliente, contratos com alçada, workflow Kanban (Auditoria interna → Correção de NCs → Revisão do gestor → Na certificadora → Aprovado).
- **Fase 3** — Editor de checklist por norma, visitas, registro de NC e CAPA automático.
- **Fase 4** — App do consultor: 100% offline, fotos com GPS e horário, assinatura do produtor, fila de sincronização, registro de início/fim de checklist com localização.
- **Fase 5** — Social & Colaboradores: trabalhadores fixos e temporários (função, CBO, salário, benefícios, adicionais), moradias, matriz de treinamentos (NRs) e exames ocupacionais por cargo — todos com vencimento monitorado.
- **Fase 6** — Motores de automação: gatilhos por data (disparos 180/150/120/90/60/30 dias, com override por cliente) e por evento (se X → então Y); agenda unificada com etiqueta de origem.
- **Fase 7** — Relatórios: estimativa de safra por talhão/produtor (comparativo entre safras), controle ambiental, social, conformidade e pacote para auditoria externa — exportação PDF/Excel com a marca da consultoria.
- **Fase 8** — Robô que confere diariamente os vencimentos no site da certificadora ALAICE.

## Referências do produto

- Protótipo navegável de 23 telas aprovado em agosto/2026 (painel gestor + app consultor).
- Planilhas reais absorvidas pelo sistema: Controle Ambiental, Lista de Trabalhadores e Estimativa de Safra (fazendas Alto da Serra e Dutra da Serra).
- Reunião de validação com a cliente em 19/08/2026: módulo social, recursos hídricos, etapa de implantação, geolocalização de consultores e confronto declarado × CAR.

## Visão de futuro (backlog)

Sistema de comercialização, integração com rastreabilidade (Corgo), importação de mapas das fazendas, portal do cliente e uso por cooperativas.
