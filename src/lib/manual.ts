/**
 * Fonte única do Manual do Usuário.
 * Cada tela do sistema tem uma entrada aqui: o script `npm run manual`
 * fotografa a rota e a página /manual monta as instruções com o print.
 * Regra do projeto: toda funcionalidade nova adiciona/atualiza sua seção
 * no mesmo commit.
 */

export type TelaManual = {
  /** Identificador do arquivo do print em public/manual/<id>.png */
  id: string;
  titulo: string;
  rota: string;
  /** Resumo de uma linha do que a tela faz */
  resumo: string;
  /** Passo a passo de uso, em linguagem simples */
  passos: string[];
  /** Dicas ou observações opcionais */
  dicas?: string[];
};

export const TELAS_MANUAL: TelaManual[] = [
  {
    id: "login",
    titulo: "Entrar no sistema",
    rota: "/login",
    resumo: "Tela de acesso ao sistema com e-mail e senha.",
    passos: [
      "Abra o endereço do sistema no navegador do computador ou do celular.",
      "Digite o seu e-mail de trabalho no campo E-mail.",
      "Digite a sua senha no campo Senha.",
      "Toque em Entrar. Você será levado ao painel principal.",
    ],
    dicas: [
      "Se errar a senha, o sistema avisa em vermelho logo abaixo dos campos — basta tentar de novo.",
      "No app de campo (celular), o acesso por biometria chegará na Fase 4.",
    ],
  },
  {
    id: "painel",
    titulo: "Painel da carteira",
    rota: "/painel",
    resumo:
      "Página inicial: indicadores da carteira, certificados por vencimento e atalhos para os módulos.",
    passos: [
      "Os cartões do topo mostram os números-chave: clientes, certificações, vencimentos em 90 dias, CAPAs abertas e conformidade média.",
      "A tabela lista os certificados ordenados pela proximidade do vencimento — as cores seguem a régua de alertas.",
      "Clique no nome de um cliente para abrir a ficha completa.",
      "Use o menu verde à esquerda para navegar entre os módulos.",
    ],
    dicas: [
      "O link “Roadmap de implantação” mostra o andamento da construção do sistema.",
      "O rodapé do menu mostra com qual usuário você está conectado.",
    ],
  },
  {
    id: "imoveis",
    titulo: "Imóveis & Talhões",
    rota: "/painel/imoveis",
    resumo:
      "Hierarquia da fazenda: imóveis rurais (CAR, matrícula) e talhões com ficha completa e histórico por safra.",
    passos: [
      "No menu lateral, clique em Imóveis & Talhões.",
      "A tabela de talhões traz área, plantas/ha, espaçamento, variedade, ano de plantio, estado da lavoura e previsão de colheita.",
      "Abaixo, o comparativo entre safras mostra previsão × colheita efetiva de cada ano — os mesmos números da planilha da fazenda.",
    ],
  },
  {
    id: "contratos",
    titulo: "Contratos & Alçada",
    rota: "/painel/contratos",
    resumo:
      "Fila de contratos aguardando aprovação — apenas usuários com alçada veem os botões.",
    passos: [
      "No menu lateral, clique em Contratos.",
      "Use o seletor “Ver como” para simular a visão de cada pessoa da equipe.",
      "Com alçada: os botões Aprovar e Rejeitar aparecem. Sem alçada: a tela fica somente leitura.",
      "Contratos parados há mais de 10 dias exibem o aviso de escalonamento automático.",
    ],
  },
  {
    id: "workflow",
    titulo: "Workflow de certificação",
    rota: "/painel/workflow",
    resumo:
      "Quadro com as 5 etapas reais do ciclo de certificação de cada cliente.",
    passos: [
      "No menu lateral, clique em Certificações.",
      "Cada coluna é uma etapa: Auditoria interna → Correção de NCs → Revisão do gestor → Na certificadora → Aprovado.",
      "Clique no nome do cliente em qualquer cartão para abrir a ficha.",
    ],
    dicas: [
      "Quando um cliente chega em “Na certificadora”, o gestor do grupo é notificado automaticamente.",
    ],
  },
  {
    id: "capas",
    titulo: "Planos de ação (CAPA)",
    rota: "/painel/capas",
    resumo:
      "Todas as não conformidades e seus planos de ação, com severidade, responsável, prazo e origem.",
    passos: [
      "No menu lateral, clique em CAPAs.",
      "A tabela mostra cada plano com a etiqueta de origem: Campo (visita) ou Escritório (auditoria documental).",
      "O ranking de gaps indica as categorias com mais ocorrências — útil para direcionar treinamentos.",
    ],
    dicas: [
      "Regra de ouro: o CAPA nasce automaticamente ao marcar um item como não conforme — nunca fica NC sem plano.",
    ],
  },
  {
    id: "social",
    titulo: "Social & Colaboradores",
    rota: "/painel/social",
    resumo:
      "Trabalhadores, moradias, treinamentos (NRs) e exames ocupacionais — com vencimentos monitorados.",
    passos: [
      "No menu lateral, clique em Social & Colaboradores.",
      "A tabela de trabalhadores traz função, CBO, salário, admissão, moradia, adicionais e funções habilitadas.",
      "No quadro de treinamentos, o selo colorido indica se a turma está em dia, próxima de vencer ou pendente.",
      "As moradias listam os moradores de cada casa com parentesco, e os exames aparecem por cargo com a periodicidade.",
    ],
  },
  {
    id: "checklists",
    titulo: "Editor de Checklist",
    rota: "/painel/checklists",
    resumo:
      "Itens da norma RA 1.4 com as exigências configuráveis que valem no app de campo.",
    passos: [
      "No menu lateral, clique em Checklists.",
      "Clique em qualquer item da lista para ver suas propriedades no painel à direita.",
      "Cada item define: obrigatoriedade, mínimo de fotos em NC (com GPS automático) e mínimo de caracteres da descrição.",
    ],
    dicas: [
      "Alterações são versionadas — só chegam ao app do consultor após publicar a nova versão.",
    ],
  },
  {
    id: "automacao",
    titulo: "Alertas & Automação",
    rota: "/painel/automacao",
    resumo:
      "Os dois motores de gatilho lado a lado: por proximidade de data e por evento.",
    passos: [
      "No menu lateral, clique em Alertas & Automação.",
      "À esquerda, a régua de disparos antes do vencimento (padrão 90/60/30/15/7 dias, com override por cliente).",
      "À direita, as regras “se acontecer X → então Y” que criam tarefas na hora.",
    ],
    dicas: [
      "Todo alerta persiste até a pendência ser resolvida — não some sozinho.",
    ],
  },
  {
    id: "relatorios",
    titulo: "Relatórios",
    rota: "/painel/relatorios",
    resumo:
      "Estimativa de safra, controle ambiental e conformidade — o valor gerado ao cliente.",
    passos: [
      "No menu lateral, clique em Relatórios.",
      "A estimativa de safra consolida a previsão por produtor; o detalhe por talhão fica em Imóveis & Talhões.",
      "O controle ambiental mostra a composição da área da fazenda (café, reserva, APP, outros).",
      "A conformidade por cliente é calculada automaticamente a partir dos checklists.",
    ],
  },
  {
    id: "grupos",
    titulo: "Grupos",
    rota: "/painel/grupos",
    resumo:
      "Estrutura da carteira: grupos administrados pela Mundo Novo, grupos de terceiros (como a Expocaccer) e clientes diretos.",
    passos: [
      "No menu lateral, clique em Grupos.",
      "Cada cartão mostra quantos clientes o grupo tem e a conformidade média.",
      "Grupos com a etiqueta “Grupo externo” são administrados por terceiros — a Mundo Novo executa a consultoria.",
      "Use o link “Ver todos os clientes” para ir direto à lista completa.",
    ],
  },
  {
    id: "clientes",
    titulo: "Clientes",
    rota: "/painel/clientes",
    resumo:
      "Lista das fazendas e cadeias de suprimento da carteira, com certificações, conformidade e prazo de vencimento.",
    passos: [
      "No menu lateral, clique em Clientes.",
      "Cada linha mostra o tipo (Fazenda ou Cadeia de Suprimentos), o grupo, as certificações e o vencimento da certificação principal.",
      "As cores do vencimento seguem o padrão do sistema: vermelho = crítico (30 dias ou menos), laranja = atenção (até 120 dias).",
      "Clique em um cliente para abrir a ficha completa, com contatos por área e imóveis rurais.",
    ],
    dicas: [
      "Na ficha do cliente, a tabela de imóveis mostra CAR, matrícula e quais imóveis têm captação de água.",
    ],
  },
  {
    id: "docs",
    titulo: "Documentação do produto",
    rota: "/docs",
    resumo:
      "Especificação viva do sistema em duas abas: Funcional (linguagem de negócio) e Técnica (arquitetura).",
    passos: [
      "Clique em Documentação no menu lateral (ou acesse /docs).",
      "Alterne entre as abas Funcional e Técnica no alto da página.",
      "Use a aba Funcional para consultar as regras do produto — é a mesma fonte usada com a cliente.",
    ],
    dicas: [
      "A documentação é atualizada junto com cada alteração do sistema — o que está escrito é o que está no ar.",
    ],
  },
];
