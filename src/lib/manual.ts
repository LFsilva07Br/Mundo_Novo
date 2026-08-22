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
