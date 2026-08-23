"use client";

import { useState, useTransition } from "react";
import { Info, MailPlus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Toaster } from "@/components/ui/sonner";
import { atualizarPerfil, reenviarConvite } from "@/lib/equipe/acoes";
import {
  PAPEIS,
  type PapelUsuario,
  type Perfil,
} from "@/lib/equipe/validacao";
import { DialogoConvidar } from "./dialogo-convidar";
import { Interruptor } from "./interruptor";

const ROTULOS_PAPEL = Object.fromEntries(
  PAPEIS.map((p) => [p.valor, p.rotulo]),
);

function iniciais(nome: string): string {
  return nome
    .split(" ")
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("");
}

export function TabelaUsuarios({
  perfis,
  bancoConectado,
  conviteDisponivel,
}: {
  perfis: Perfil[];
  bancoConectado: boolean;
  conviteDisponivel: boolean;
}) {
  const [idPendente, setIdPendente] = useState<string | null>(null);
  const [, iniciarTransicao] = useTransition();

  const podeEditar = bancoConectado;

  function executar(id: string, acao: () => Promise<void>) {
    setIdPendente(id);
    iniciarTransicao(async () => {
      try {
        await acao();
      } finally {
        setIdPendente(null);
      }
    });
  }

  function aoMudarPapel(perfil: Perfil, papel: PapelUsuario) {
    if (papel === perfil.papel) return;
    executar(perfil.id, async () => {
      const resultado = await atualizarPerfil(perfil.id, { papel });
      if (resultado.ok) toast.success(resultado.mensagem);
      else toast.error(resultado.erro);
    });
  }

  function aoMudarAlcada(perfil: Perfil, alcadaAprovacao: boolean) {
    executar(perfil.id, async () => {
      const resultado = await atualizarPerfil(perfil.id, { alcadaAprovacao });
      if (resultado.ok) toast.success(resultado.mensagem);
      else toast.error(resultado.erro);
    });
  }

  function aoMudarAtivo(perfil: Perfil) {
    executar(perfil.id, async () => {
      const resultado = await atualizarPerfil(perfil.id, {
        ativo: !perfil.ativo,
      });
      if (resultado.ok) toast.success(resultado.mensagem);
      else toast.error(resultado.erro);
    });
  }

  function aoReenviar(perfil: Perfil) {
    executar(perfil.id, async () => {
      const resultado = await reenviarConvite(perfil.email);
      if (resultado.ok) toast.success(resultado.mensagem);
      else toast.error(resultado.erro);
    });
  }

  return (
    <Card>
      <Toaster position="top-center" />
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Equipe</CardTitle>
            <CardDescription>
              Papel define o que cada pessoa vê; a alçada é a permissão de
              aprovar contratos. Quem não tem a permissão simplesmente não vê
              os botões de aprovar/rejeitar.
            </CardDescription>
          </div>
          <DialogoConvidar disponivel={conviteDisponivel} />
        </div>

        {!bancoConectado ? (
          <p className="flex items-center gap-2 rounded-xl bg-warning/10 px-3 py-2 text-xs font-semibold text-warning">
            <Info className="size-3.5 shrink-0" />
            Modo demonstração: equipe de exemplo, somente leitura. Com o banco
            conectado, papéis e alçadas passam a ser editáveis aqui.
          </p>
        ) : !conviteDisponivel ? (
          <p className="flex items-center gap-2 rounded-xl bg-warning/10 px-3 py-2 text-xs font-semibold text-warning">
            <Info className="size-3.5 shrink-0" />
            O convite por e-mail estará disponível no ambiente publicado.
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Aprova contrato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {perfis.map((perfil) => {
              const pendente = idPendente === perfil.id;
              return (
                <TableRow
                  key={perfil.id}
                  className={pendente ? "opacity-60" : undefined}
                >
                  <TableCell className="font-semibold">
                    <span className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {iniciais(perfil.nome)}
                      </span>
                      {perfil.nome || "(sem nome)"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {perfil.email}
                  </TableCell>
                  <TableCell>
                    <Select
                      items={ROTULOS_PAPEL}
                      value={perfil.papel}
                      onValueChange={(valor) =>
                        aoMudarPapel(perfil, valor as PapelUsuario)
                      }
                      disabled={!podeEditar || pendente}
                    >
                      <SelectTrigger
                        size="sm"
                        aria-label={`Papel de ${perfil.nome}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAPEIS.map((p) => (
                          <SelectItem key={p.valor} value={p.valor}>
                            {p.rotulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Interruptor
                      ligado={perfil.alcadaAprovacao}
                      aoAlternar={(valor) => aoMudarAlcada(perfil, valor)}
                      rotulo={`Alçada de aprovação de ${perfil.nome}`}
                      desabilitado={!podeEditar || pendente}
                    />
                  </TableCell>
                  <TableCell>
                    {perfil.ativo ? (
                      <Badge className="bg-secondary text-secondary-foreground">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        Inativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Reenviar convite para ${perfil.nome}`}
                        title="Reenviar convite"
                        disabled={!conviteDisponivel || pendente}
                        onClick={() => aoReenviar(perfil)}
                      >
                        <MailPlus />
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className={
                          perfil.ativo ? "text-destructive" : undefined
                        }
                        disabled={!podeEditar || pendente}
                        onClick={() => aoMudarAtivo(perfil)}
                      >
                        {perfil.ativo ? "Desativar" : "Reativar"}
                      </Button>
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
