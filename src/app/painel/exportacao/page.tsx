import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listarClientes } from "@/lib/carteira/consultas";
import { BotoesExportacao } from "./baixar";

export const metadata: Metadata = {
  title: "Exportação de dados",
};

const CONTEUDO_PACOTE = [
  "Clientes, grupos, certificações e vencimentos",
  "Imóveis rurais com documentos, captações de água e talhões por safra",
  "Visitas de checklist com todas as respostas",
  "CAPAs e planos de ação",
  "Módulo social completo: trabalhadores, moradias, treinamentos e EPIs",
  "Lotes, negociações e tarefas da agenda",
];

export default async function PaginaExportacao() {
  const clientes = await listarClientes();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Confiança & portabilidade
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Exportação completa / backup
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Os dados são dos clientes, não do sistema. Aqui a gestão baixa, a
          qualquer momento, um arquivo JSON estruturado com tudo o que está
          guardado — pronto para backup, migração ou para atender um pedido de
          portabilidade da LGPD.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>O que vai no arquivo</CardTitle>
          <CardDescription>
            Um único JSON, organizado por cliente, com a data no nome do
            arquivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {CONTEUDO_PACOTE.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <BotoesExportacao
            clientes={clientes.map((c) => ({ id: c.id, nome: c.nome }))}
          />
        </CardContent>
      </Card>

      <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          <span className="font-bold">Dados sensíveis.</span> O arquivo contém
          dados pessoais de trabalhadores e informações de negócio dos
          clientes. O download é restrito à gestão (gestor e diretoria) —
          guarde o arquivo em local seguro e não o envie por canais abertos.
        </p>
      </div>
    </div>
  );
}
