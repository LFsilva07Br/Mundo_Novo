"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { iniciarVisita } from "@/lib/checklists/acoes";
import {
  ROTULO_ORIGEM,
  ROTULO_STATUS_VISITA,
  type OrigemVisita,
  type VisitaResumo,
} from "@/lib/checklists/tipos";
import { formatarData } from "@/lib/vencimentos";

type ClienteOpcao = { id: string; nome: string };

type Props = {
  visitas: VisitaResumo[];
  clientes: ClienteOpcao[];
};

export function VisaoVisitas({ visitas, clientes }: Props) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Trabalho realizado
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Visitas & Ações
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visitas de campo <b>e</b> auditorias do escritório, sempre com o
            checklist da versão publicada — toda NC abre uma CAPA
            automaticamente.
          </p>
        </div>
        <DialogNovaVisita clientes={clientes} />
      </div>

      {visitas.length === 0 ? (
        <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
          Nenhuma visita registrada ainda — comece por “Nova visita/auditoria”.
        </div>
      ) : (
        <div className="space-y-3">
          {visitas.map((v) => (
            <Link
              key={v.id}
              href={`/painel/visitas/${v.id}`}
              className="block rounded-xl border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{v.titulo}</p>
                <span className="flex flex-wrap gap-1.5">
                  <Badge
                    variant={v.origem === "campo" ? "secondary" : "outline"}
                  >
                    {v.origem === "campo" ? "🌱" : "🏢"}{" "}
                    {ROTULO_ORIGEM[v.origem]}
                  </Badge>
                  <Badge
                    variant={v.status === "em_andamento" ? "outline" : "secondary"}
                    className={
                      v.status === "em_andamento"
                        ? "border-warning/40 text-warning"
                        : undefined
                    }
                  >
                    {ROTULO_STATUS_VISITA[v.status]}
                  </Badge>
                </span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {v.clienteNome} ·{" "}
                {formatarData(new Date(v.iniciadaEm))}
              </p>
              <p className="mt-1.5 text-sm">
                {v.respondidos}/{v.totalItens} itens respondidos
                {v.naoConformes > 0
                  ? ` · ${v.naoConformes} NC${v.naoConformes > 1 ? "s" : ""} (CAPA automática)`
                  : " · sem NCs"}
                {v.conformidade !== null ? (
                  <span className="font-bold text-primary">
                    {" "}
                    · {v.conformidade}% de conformidade
                  </span>
                ) : null}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function DialogNovaVisita({ clientes }: { clientes: ClienteOpcao[] }) {
  const roteador = useRouter();
  const [aberto, setAberto] = useState(false);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [origem, setOrigem] = useState<OrigemVisita>("campo");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciarTransicao] = useTransition();

  const valido = clienteId !== null && titulo.trim().length >= 3;

  function submeter() {
    if (!clienteId) return;
    setErro(null);
    iniciarTransicao(async () => {
      const resultado = await iniciarVisita({
        clienteId,
        titulo: titulo.trim(),
        origem,
      });
      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }
      setAberto(false);
      if (resultado.id) roteador.push(`/painel/visitas/${resultado.id}`);
    });
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(abrir) => {
        setAberto(abrir);
        if (abrir) {
          setClienteId(null);
          setTitulo("");
          setOrigem("campo");
          setErro(null);
        }
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus />
        Nova visita/auditoria
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova visita/auditoria</DialogTitle>
          <DialogDescription>
            A visita usa a versão publicada do checklist. Escolha o cliente e a
            origem do registro.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="nova-visita-cliente">Cliente</Label>
            <Select
              value={clienteId}
              onValueChange={(valor) => setClienteId(valor as string | null)}
              items={clientes.map((c) => ({ value: c.id, label: c.nome }))}
            >
              <SelectTrigger id="nova-visita-cliente" className="w-full">
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nova-visita-titulo">Título</Label>
            <Input
              id="nova-visita-titulo"
              placeholder="Ex.: Auditoria interna RA 1.4"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nova-visita-origem">Origem</Label>
            <Select
              value={origem}
              onValueChange={(valor) => setOrigem(valor as OrigemVisita)}
              items={[
                { value: "campo", label: "🌱 Campo" },
                { value: "escritorio", label: "🏢 Escritório" },
              ]}
            >
              <SelectTrigger id="nova-visita-origem" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="campo">🌱 Campo</SelectItem>
                <SelectItem value="escritorio">🏢 Escritório</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {erro ? (
            <p
              role="alert"
              className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm font-semibold text-destructive"
            >
              <AlertTriangle className="size-4 shrink-0" />
              {erro}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancelar
          </DialogClose>
          <Button disabled={pendente || !valido} onClick={submeter}>
            Iniciar visita
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
