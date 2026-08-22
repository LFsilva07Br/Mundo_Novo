import type { Metadata } from "next";
import { BadgeCheck, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EQUIPE_DEMO } from "@/lib/equipe/dados-demo";

export const metadata: Metadata = {
  title: "Usuários & Permissões",
};

export default function PaginaUsuarios() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Administração
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Usuários & Permissões
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipe</CardTitle>
          <CardDescription>
            A alçada de aprovação de contrato é uma <b>permissão por usuário</b>{" "}
            — não é cargo nem etapa de workflow. Quem não tem a permissão
            simplesmente não vê os botões de aprovar/rejeitar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Aprova contrato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EQUIPE_DEMO.map((membro) => (
                <TableRow key={membro.id}>
                  <TableCell className="flex items-center gap-3 font-semibold">
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {membro.nome
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    {membro.nome}
                  </TableCell>
                  <TableCell className="text-sm">{membro.papel}</TableCell>
                  <TableCell>
                    {membro.alcadaAprovacao ? (
                      <Badge className="gap-1 bg-secondary text-secondary-foreground">
                        <BadgeCheck className="size-3.5" />
                        Aprova contrato
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <Minus className="size-3.5" />
                        Sem alçada
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Com o banco conectado, esta tela permitirá convidar usuários, alterar
        papéis e ligar/desligar a alçada — mudanças registradas em histórico.
        Veja o efeito prático da alçada na tela de{" "}
        <a
          href="/painel/contratos"
          className="font-semibold text-primary underline underline-offset-2"
        >
          Contratos
        </a>
        .
      </p>
    </div>
  );
}
