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

### ✅ Disponível

| Funcionalidade | Descrição |
|---|---|
| Login e acesso | E-mail e senha, convite por e-mail com definição de senha própria e recuperação de senha |
| Documentação viva | Esta documentação, atualizada a cada alteração |
| Manual do usuário | Guia de uso tela a tela em `/manual`, com imagens reais regeneradas a cada versão publicada |
| **Dashboard** | Indicadores calculados da carteira e certificados ordenados por vencimento |
| **Grupos** | Cartões dos grupos reais com **cadastro e edição** |
| **Clientes** | Carteira real com busca, filtros, **novo cliente** (nasce em Implantação), edição, contatos por área e **registro de contatos** (ligações, e-mails, visitas) |
| **Imóveis & Talhões** | Imóveis com documentos (status/vencimento) e captações de água; talhões com ficha completa; **lançamento de safra** e comparativo entre 5 safras |
| **Contratos & Alçada** | Fila real de aprovação — quem não tem alçada não vê os botões; decisão registrada com autor e data; escalonamento >10 dias |
| **Certificações (Workflow)** | Kanban real das 6 etapas (Implantação primeiro); avanço de 1 em 1 etapa com histórico; chegada em "Na certificadora" **notifica o gestor automaticamente** |
| **Visitas & Auditorias** | Execução de checklist no navegador (campo ou escritório): Conforme/NC/N.A., descrição mínima em tempo real, **NC abre CAPA automaticamente no banco**, conformidade calculada ao concluir |
| **CAPAs** | Planos reais com ações marcáveis; **CAPA só fecha com todas as ações concluídas**; nova CAPA sempre com responsável e prazo; ranking de gaps |
| **Agenda** | Tarefas dos **dois motores** com etiqueta de origem (⏱ data / ⚡ evento); alerta persiste até concluir; motor roda todo dia às 06:00 (e sob demanda) |
| **Social & Colaboradores** | Trabalhadores reais com **cadastro/edição**, moradias, **registro de treinamentos** com vencimento calculado e exames por cargo |
| **Editor de Checklist** | Itens reais da RA 1.4 **versionados**: rascunho → edição → publicação (só a versão publicada vale nas visitas) |
| **Alertas & Automação** | Régua de disparos validada (90/60/30/15/7 + longos) e gatilhos por evento; robô ALAICE diário às 06:00 com log de execuções e modo verificação assistida |
| **Usuários & Permissões** | Equipe real do banco: papéis e alçada editáveis e **convite de novos usuários por e-mail** |
| **Relatórios** | Estimativa de safra por produtor, controle ambiental e conformidade por cliente |

> **Sistema conectado:** o banco de dados está no ar (região São Paulo) com a carteira real carregada; todas as telas acima leem e gravam de verdade, com login obrigatório. O modo demonstração continua existindo apenas para desenvolvimento sem banco.

### 🔜 Próximas entregas

- **App do consultor (Fase 4)** — PWA 100% offline no celular: checklist em campo, fotos com GPS e horário, assinatura do produtor, fila de sincronização e registro de início/fim com localização.
- **Fotos e anexos nas NCs** — upload de evidências fotográficas (com mínimo por item) no fluxo de visita e nas ações de CAPA.
- **Relatórios exportáveis** — PDF/Excel com a marca da consultoria, relatório mensal por cliente e pacote para auditoria externa (com opção de ocultar NCs já tratadas).
- **Overrides por cliente na régua de alertas** e resumo semanal por e-mail ao gestor.
- **Robô ALAICE — raspagem completa** — hoje o robô roda diariamente com verificação assistida; a leitura automática de datas no site depende de validação da estrutura do site da certificadora.
- **Integrações Microsoft** (Power BI, Outlook/Teams, Planner) — pós-MVP, conforme roadmap.

## Referências do produto

- Protótipo navegável de 23 telas aprovado em agosto/2026 (painel gestor + app consultor).
- Planilhas reais absorvidas pelo sistema: Controle Ambiental, Lista de Trabalhadores e Estimativa de Safra (fazendas Alto da Serra e Dutra da Serra).
- Reunião de validação com a cliente em 19/08/2026: módulo social, recursos hídricos, etapa de implantação, geolocalização de consultores e confronto declarado × CAR.

## Visão de futuro (backlog)

Sistema de comercialização, integração com rastreabilidade (Corgo), importação de mapas das fazendas, portal do cliente e uso por cooperativas.
