"use client";

import { useActionState, useRef, useTransition } from "react";
import { MessageCircle, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNativo } from "@/components/select-nativo";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adicionarContato,
  removerContato,
  type EstadoAcao,
} from "@/lib/carteira/acoes";
import {
  ROTULO_AREA_CONTATO,
  type ContatoCliente as Contato,
} from "@/lib/carteira/tipos";
import { linkWhatsApp, mensagemContatoPadrao } from "@/lib/whatsapp";

/** Gerência de contatos por área: lista, adiciona e remove. */
export function ContatosCliente({
  clienteId,
  clienteNome,
  contatos,
}: {
  clienteId: string;
  clienteNome: string;
  contatos: Contato[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [estado, enviar, pendente] = useActionState<EstadoAcao, FormData>(
    async (estadoAnterior, formData) => {
      const resultado = await adicionarContato(estadoAnterior, formData);
      if (resultado?.ok) {
        toast.success(resultado.mensagem);
        formRef.current?.reset();
      }
      return resultado;
    },
    null,
  );
  const [removendo, iniciarRemocao] = useTransition();

  function remover(contato: Contato) {
    iniciarRemocao(async () => {
      const resultado = await removerContato(
        clienteId,
        contato.nome,
        contato.area,
      );
      if (resultado?.ok) toast.success(resultado.mensagem);
      else if (resultado) toast.error(resultado.erro);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contatos por área</CardTitle>
        <CardDescription>
          Os avisos automáticos do sistema usam o contato da área responsável.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {contatos.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contato</TableHead>
                <TableHead>Área</TableHead>
                <TableHead className="w-20">
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contatos.map((contato) => (
                <TableRow key={`${contato.nome}-${contato.area}`}>
                  <TableCell className="font-semibold">
                    {contato.nome}
                    {contato.telefone || contato.email ? (
                      <p className="text-xs font-normal text-muted-foreground">
                        {[contato.telefone, contato.email]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>{ROTULO_AREA_CONTATO[contato.area]}</TableCell>
                  <TableCell>
                    {(() => {
                      const link = contato.telefone
                        ? linkWhatsApp(
                            contato.telefone,
                            mensagemContatoPadrao({
                              contato: contato.nome,
                              cliente: clienteNome,
                            }),
                          )
                        : null;
                      return link ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Chamar ${contato.nome} no WhatsApp`}
                          render={
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                          }
                        >
                          <MessageCircle className="size-3.5 text-success" />
                        </Button>
                      ) : null;
                    })()}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remover contato ${contato.nome}`}
                      disabled={removendo}
                      onClick={() => remover(contato)}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum contato cadastrado ainda — adicione o primeiro abaixo.
          </p>
        )}

        <form
          ref={formRef}
          action={enviar}
          className="space-y-3 rounded-xl border border-dashed p-4"
        >
          <p className="flex items-center gap-2 text-sm font-bold">
            <UserPlus className="size-4 text-primary" />
            Adicionar contato
          </p>
          <input type="hidden" name="clienteId" value={clienteId} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contato-nome">Nome</Label>
              <Input
                id="contato-nome"
                name="nome"
                placeholder="Nome do contato"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contato-area">Área</Label>
              <SelectNativo id="contato-area" name="area" defaultValue="outro">
                {(
                  Object.entries(ROTULO_AREA_CONTATO) as [
                    Contato["area"],
                    string,
                  ][]
                ).map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>
                    {rotulo}
                  </option>
                ))}
              </SelectNativo>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contato-telefone">Telefone (opcional)</Label>
              <Input
                id="contato-telefone"
                name="telefone"
                placeholder="(34) 99999-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contato-email">E-mail (opcional)</Label>
              <Input
                id="contato-email"
                name="email"
                type="email"
                placeholder="contato@fazenda.com.br"
              />
            </div>
          </div>

          {estado && !estado.ok ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {estado.erro}
            </p>
          ) : null}

          <Button type="submit" size="sm" disabled={pendente}>
            {pendente ? "Adicionando…" : "Adicionar contato"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
