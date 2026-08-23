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
| **Relatórios** | Estimativa de safra, controle ambiental e conformidade — com **exportação em Excel e PDF**, **relatório mensal do cliente** com a marca da consultoria e **pacote de auditoria externa** (só CAPAs abertas) |
| **📱 App de Campo (PWA)** | App do consultor instalável no celular, **100% offline**: pacote de dados baixado no aparelho, checklist com fotos (GPS/hora automáticos), assinatura do produtor na tela e fila de sincronização — ao reconectar, as visitas sobem e as NCs viram CAPAs |
| **Evidências fotográficas** | Upload de fotos nas NCs (com mínimo por item) e evidências nas ações de CAPA, com galeria (data, GPS, descrição) |
| **Conformidade viva** | Concluir uma auditoria recalcula automaticamente o % do cliente; a ficha mostra o histórico de auditorias |
| **Overrides de alertas** | Régua de disparos personalizada por cliente (com cópia ao administrador do grupo externo) |
| **Resumo semanal** | Toda segunda 07:00 o sistema consolida a semana (tarefas, CAPAs, vencimentos, contratos) para o gestor |
| **Segurança de acesso** | Senha provisória força a troca no primeiro acesso; exportações sem login retornam vazias |

> **Sistema conectado:** o banco de dados está no ar (região São Paulo) com a carteira real carregada; todas as telas acima leem e gravam de verdade, com login obrigatório. O modo demonstração continua existindo apenas para desenvolvimento sem banco.

### 🔜 Próximas entregas

- **Envio de e-mails** — os alertas e o resumo semanal já são gerados; falta plugar um serviço de e-mail para dispará-los também por e-mail (hoje vivem na Agenda).
- **Fonte da certificadora** — o domínio informado da ALAICE não existe e o diretório oficial da Rainforest Alliance é um painel sem API; o robô opera em verificação assistida com link direto ao painel oficial. **Alinhar com a cliente qual portal a certificadora realmente usa.**
- **Cadastro dos demais clientes da carteira** (44 de 52) — via tela ou importação de planilhas.
- **Integrações Microsoft** (Power BI, Outlook/Teams, Planner) — pós-MVP, conforme roadmap.
- **Biometria no app de campo** e limpeza automática de visitas antigas sincronizadas no aparelho.

## Referências do produto

- Protótipo navegável de 23 telas aprovado em agosto/2026 (painel gestor + app consultor).
- Planilhas reais absorvidas pelo sistema: Controle Ambiental, Lista de Trabalhadores e Estimativa de Safra (fazendas Alto da Serra e Dutra da Serra).
- Reunião de validação com a cliente em 19/08/2026: módulo social, recursos hídricos, etapa de implantação, geolocalização de consultores e confronto declarado × CAR.

## Visão de futuro (backlog)

Sistema de comercialização, integração com rastreabilidade (Corgo), importação de mapas das fazendas, portal do cliente e uso por cooperativas.
