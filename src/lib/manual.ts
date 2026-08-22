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
    titulo: "Painel principal",
    rota: "/painel",
    resumo:
      "Página inicial após o login: mostra o andamento da construção do sistema e, em breve, os indicadores da carteira.",
    passos: [
      "Use o menu verde à esquerda para navegar entre os módulos do sistema.",
      "Os módulos marcados com “Em breve” ainda estão em construção — a etiqueta some quando entram no ar.",
      "Acompanhe no quadro central o que cada fase do projeto entrega e o que está em andamento.",
    ],
    dicas: [
      "O rodapé do menu mostra com qual usuário você está conectado.",
      "O link Documentação abre a especificação completa do produto.",
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
