import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CircleDashed, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard",
};

type EstadoFase = "concluida" | "em-andamento" | "planejada";

const fases: { nome: string; descricao: string; estado: EstadoFase }[] = [
  {
    nome: "Fase 0 — Fundação",
    descricao:
      "Projeto no ar: identidade visual, login, painel, documentação interativa, testes e implantação contínua.",
    estado: "em-andamento",
  },
  {
    nome: "Fase 1 — Cadastros e permissões",
    descricao:
      "Grupos, clientes, imóveis rurais (CAR, licenças, outorgas), talhões com histórico de safra e alçada de aprovação.",
    estado: "planejada",
  },
  {
    nome: "Fase 2 — Certificações, contratos e workflow",
    descricao:
      "Certificações por cliente, contratos com alçada e Kanban das 5 etapas reais, incluindo etapa de implantação.",
    estado: "planejada",
  },
  {
    nome: "Fase 3 — Checklist, NC e CAPA",
    descricao:
      "Editor versionado vinculado à norma; NC nunca fica sem plano de ação.",
    estado: "planejada",
  },
  {
    nome: "Fase 4 — App do consultor (offline)",
    descricao:
      "PWA de campo com fotos, GPS, assinatura e fila de sincronização.",
    estado: "planejada",
  },
  {
    nome: "Fase 5 — Social & Colaboradores",
    descricao:
      "Trabalhadores, moradias, treinamentos (NRs) e exames com vencimentos.",
    estado: "planejada",
  },
  {
    nome: "Fase 6 — Automação e alertas",
    descricao:
      "Motores por data e por evento; alertas persistentes até a resolução.",
    estado: "planejada",
  },
  {
    nome: "Fase 7 — Relatórios",
    descricao:
      "Safra, ambiental, social e conformidade — exportação PDF/Excel.",
    estado: "planejada",
  },
  {
    nome: "Fase 8 — Robô ALAICE",
    descricao:
      "Verificação diária de vencimentos no site da certificadora.",
    estado: "planejada",
  },
];

function IconeEstado({ estado }: { estado: EstadoFase }) {
  if (estado === "concluida")
    return <CheckCircle2 className="size-5 text-success" />;
  if (estado === "em-andamento")
    return <Loader2 className="size-5 animate-spin text-warning" />;
  return <CircleDashed className="size-5 text-muted-foreground/50" />;
}

export default function PaginaDashboard() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Sistema em construção 🚧
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe aqui o avanço de cada fase. A cada entrega, esta página dá
          lugar ao dashboard de indicadores do protótipo aprovado.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roadmap de implantação</CardTitle>
          <CardDescription>
            Meta: sistema operacional para a Mundo Novo Café entre novembro e
            dezembro de 2026 · proposta em 31 de outubro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {fases.map((fase) => (
              <li key={fase.nome} className="flex gap-3">
                <IconeEstado estado={fase.estado} />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                    {fase.nome}
                    {fase.estado === "em-andamento" ? (
                      <Badge variant="secondary">Em andamento</Badge>
                    ) : null}
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    {fase.descricao}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        A especificação completa está na{" "}
        <Link
          href="/docs"
          className="font-semibold text-primary underline underline-offset-2"
        >
          documentação interativa
        </Link>
        , atualizada a cada alteração do sistema.
      </p>
    </div>
  );
}
