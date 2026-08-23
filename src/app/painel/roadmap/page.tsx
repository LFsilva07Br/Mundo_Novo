import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Roadmap de implantação",
};

type Fase = {
  nome: string;
  descricao: string;
  percentual: number;
  observacao?: string;
};

const fases: Fase[] = [
  {
    nome: "Fase 0 — Fundação",
    descricao:
      "Identidade visual, login, banco de dados, documentação viva, manual automático, testes e implantação contínua.",
    percentual: 100,
  },
  {
    nome: "Fase 1 — Cadastros e permissões",
    descricao:
      "Grupos, clientes, contatos por área, imóveis rurais (CAR, licenças, outorgas), talhões com histórico de safra, usuários e alçada.",
    percentual: 100,
  },
  {
    nome: "Fase 2 — Certificações, contratos e workflow",
    descricao:
      "Workflow Kanban das 6 etapas com histórico, contratos decididos por alçada real e notificação automática ao gestor.",
    percentual: 100,
  },
  {
    nome: "Fase 3 — Checklist, NC e CAPA",
    descricao:
      "Editor versionado da norma RA 1.4, execução de auditorias, NC→CAPA automático no banco e evidências fotográficas.",
    percentual: 100,
  },
  {
    nome: "Fase 4 — App do consultor (offline)",
    descricao:
      "PWA instalável com checklist offline, fotos com GPS, assinatura do produtor, fila de sincronização e desbloqueio por biometria.",
    percentual: 100,
  },
  {
    nome: "Fase 5 — Social & Colaboradores",
    descricao:
      "Trabalhadores, moradias, treinamentos com vencimento calculado e exames por cargo.",
    percentual: 100,
  },
  {
    nome: "Fase 6 — Automação e alertas",
    descricao:
      "Motores por data e por evento, overrides por cliente, resumo semanal e alertas persistentes.",
    percentual: 95,
    observacao: "Envio por e-mail aguarda configuração do SMTP (gratuito)",
  },
  {
    nome: "Fase 7 — Relatórios",
    descricao:
      "Exportação Excel/PDF, relatório mensal do cliente com a marca da consultoria e pacote de auditoria externa.",
    percentual: 100,
  },
  {
    nome: "Fase 8 — Robô da certificadora",
    descricao:
      "Verificação diária dos certificados com log de execuções — modo verificação assistida com link ao diretório oficial da Rainforest Alliance.",
    percentual: 90,
    observacao: "Portal MyRA exige login e não tem API — verificação assistida é o modo definitivo",
  },
  {
    nome: "Fase 9 — Expansões (portal, comercialização, mapas)",
    descricao:
      "Portal do produtor, módulo de comercialização com rastreabilidade por lote, mapas das fazendas (KML/CAR) e suíte de testes ponta a ponta.",
    percentual: 95,
    observacao: "Suíte ponta a ponta em finalização",
  },
  {
    nome: "Fase 10 — Norma expandida (agro & rastreio)",
    descricao:
      "Aplicações de defensivos por talhão com checagem de treinamento do aplicador, lista de produtos proibidos RA, destinação de embalagens, balanço de volume certificado e pagamentos DS/DI.",
    percentual: 100,
  },
  {
    nome: "Fase 11 — Compliance social",
    descricao:
      "Fichas de EPI e atas de treinamento assinadas, sistema avaliar-e-tratar (cap. 5.1), canal digital de queixas e plano de gestão anual com avaliação de risco.",
    percentual: 100,
  },
  {
    nome: "Fase 12 — Comunicação & planejamento",
    descricao:
      "Notificações no aparelho, cobrança por WhatsApp, planejamento anual de visitas (cobertura 100%), nota de prontidão para auditoria e evolução histórica da conformidade.",
    percentual: 100,
  },
  {
    nome: "Fase 13 — Confiança & dados",
    descricao:
      "Modo auditor externo (somente leitura), gestão de achados da certificadora, trilha de auditoria do sistema, relatório EUDR (polígonos), biblioteca multi-normas (4C/Orgânico) e exportação/backup completo.",
    percentual: 35,
    observacao: "Achados externos e DS/DI entregues; trilha gravando no banco",
  },
];

function BarraProgresso({ percentual }: { percentual: number }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          percentual >= 100 ? "bg-success" : "bg-primary",
        )}
        style={{ width: `${Math.min(percentual, 100)}%` }}
      />
    </div>
  );
}

export default function PaginaRoadmap() {
  const media = Math.round(
    fases.reduce((s, f) => s + f.percentual, 0) / fases.length,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/painel"
        className="flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar ao painel
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-2">
            Roadmap de implantação
            <Badge variant="secondary" className="text-sm">
              {media}% concluído
            </Badge>
          </CardTitle>
          <CardDescription>
            Meta original: sistema operacional entre novembro e dezembro de
            2026 · proposta em 31 de outubro. Situação: as fases de software
            do MVP foram entregues com ~2 meses de antecedência.
          </CardDescription>
          <BarraProgresso percentual={media} />
        </CardHeader>
        <CardContent>
          <ul className="space-y-5">
            {fases.map((fase) => (
              <li key={fase.nome} className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold">{fase.nome}</p>
                  <span
                    className={cn(
                      "text-sm font-extrabold",
                      fase.percentual >= 100
                        ? "text-success"
                        : "text-primary",
                    )}
                  >
                    {fase.percentual}%
                  </span>
                </div>
                <BarraProgresso percentual={fase.percentual} />
                <p className="text-[13px] text-muted-foreground">
                  {fase.descricao}
                </p>
                {fase.observacao ? (
                  <p className="text-xs font-semibold text-warning">
                    ⏳ {fase.observacao}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
