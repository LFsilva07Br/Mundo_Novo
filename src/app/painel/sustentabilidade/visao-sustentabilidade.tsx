"use client";

import { useMemo, useState, useTransition } from "react";
import { Download, Leaf, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { registrarPagamento } from "@/lib/sustentabilidade/acoes";
import { EstadoVazioLinha } from "@/components/estado-vazio";
import type { PagamentoSustentabilidade } from "@/lib/sustentabilidade/consultas";
import {
  clientesContemplados,
  ROTULO_TIPO_PAGAMENTO,
  totaisPorClienteAno,
  totaisPorTipoAno,
} from "@/lib/sustentabilidade/regras";
import { formatarData } from "@/lib/vencimentos";
import { cn } from "@/lib/utils";

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

type ClienteOpcao = { id: string; nome: string };

type Props = {
  pagamentos: PagamentoSustentabilidade[];
  clientes: ClienteOpcao[];
  modoDemo: boolean;
};

/** Aviso de sucesso com o tipo e o valor lançado — é o que o auditor confere. */
function avisoPagamento(formData: FormData): string {
  const tipo =
    String(formData.get("tipo") ?? "diferencial") === "investimento"
      ? "Investimento (DI)"
      : "Diferencial de Sustentabilidade (DS)";
  const valor = Number(formData.get("valor") ?? 0);
  return `${tipo} de ${moeda.format(valor)} registrado para o produtor.`;
}

export function VisaoSustentabilidade({ pagamentos, clientes, modoDemo }: Props) {
  // Estado local usado apenas no modo demonstração (simulação sem gravar);
  // conectado ao banco, a revalidação do servidor atualiza as props.
  const [pagamentosLocais, setPagamentosLocais] = useState(pagamentos);
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [pendente, iniciarTransicao] = useTransition();

  const exibidos = modoDemo ? pagamentosLocais : pagamentos;

  const anoAtual = new Date().getFullYear();
  const totaisAno = useMemo(() => totaisPorTipoAno(exibidos), [exibidos]);
  const doAnoAtual = totaisAno.find((t) => t.ano === anoAtual);
  const porClienteAno = useMemo(
    () => totaisPorClienteAno(exibidos),
    [exibidos],
  );
  const contemplados = useMemo(() => clientesContemplados(exibidos), [exibidos]);

  function aoRegistrar(formData: FormData) {
    if (modoDemo) {
      const clienteId = String(formData.get("clienteId") ?? "");
      const cliente = clientes.find((c) => c.id === clienteId);
      const valor = Number(formData.get("valor") ?? 0);
      if (!cliente || !(valor > 0)) {
        toast.error("Escolha o produtor e informe um valor maior que zero.");
        return;
      }
      setPagamentosLocais((atuais) => [
        {
          id: `demo-pgto-${atuais.length + 1}`,
          clienteId,
          cliente: cliente.nome,
          tipo: String(formData.get("tipo") ?? "diferencial") as
            | "diferencial"
            | "investimento",
          valor,
          data: String(formData.get("data") ?? ""),
          descricao: String(formData.get("descricao") ?? "") || null,
          comprovanteCaminho: null,
        },
        ...atuais,
      ]);
      setDialogoAberto(false);
      toast.success(avisoPagamento(formData));
      return;
    }
    iniciarTransicao(async () => {
      const resultado = await registrarPagamento(formData);
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      setDialogoAberto(false);
      toast.success(avisoPagamento(formData));
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Rainforest Alliance
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Sustentabilidade — DS/DI
          </h1>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/sustentabilidade/csv"
            download
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Download className="size-4" />
            Baixar CSV
          </a>
          <DialogoNovoPagamento
            aberto={dialogoAberto}
            aoMudarAberto={setDialogoAberto}
            clientes={clientes}
            aoRegistrar={aoRegistrar}
            pendente={pendente}
          />
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-secondary/60 p-4">
        <Leaf className="mt-0.5 size-5 shrink-0 text-primary" />
        <p className="text-sm font-semibold text-secondary-foreground">
          A norma RA exige registrar o Diferencial de Sustentabilidade (DS) e
          os Investimentos (DI) pagos ao produtor. Registre cada pagamento com
          valor, data e comprovante — é o que o auditor confere.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">
              {moeda.format(doAnoAtual?.diferencial ?? 0)}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              DS pago em {anoAtual}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">
              {moeda.format(doAnoAtual?.investimento ?? 0)}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              DI pago em {anoAtual}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">{contemplados}</p>
            <p className="text-xs font-semibold text-muted-foreground">
              clientes contemplados
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Totais por cliente e ano</CardTitle>
          <CardDescription>
            Consolidado do que cada produtor recebeu de DS e DI por ano.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead className="text-right">Diferencial (DS)</TableHead>
                <TableHead className="text-right">Investimento (DI)</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {porClienteAno.length === 0 ? (
                <EstadoVazioLinha
                  colunas={5}
                  icone={Leaf}
                  titulo="Nenhum pagamento de DS/DI consolidado ainda."
                  descricao="Assim que o primeiro Diferencial de Sustentabilidade ou Investimento for lançado, o total por cliente e ano aparece aqui."
                />
              ) : null}
              {porClienteAno.map((linha) => (
                <TableRow key={`${linha.clienteId}-${linha.ano}`}>
                  <TableCell className="font-semibold">
                    {linha.cliente}
                  </TableCell>
                  <TableCell>{linha.ano}</TableCell>
                  <TableCell className="text-right">
                    {moeda.format(linha.diferencial)}
                  </TableCell>
                  <TableCell className="text-right">
                    {moeda.format(linha.investimento)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {moeda.format(linha.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagamentos registrados</CardTitle>
          <CardDescription>
            Cada lançamento individual, do mais recente para o mais antigo.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exibidos.length === 0 ? (
                <EstadoVazioLinha
                  colunas={5}
                  icone={Leaf}
                  titulo="Nenhum pagamento registrado com os filtros escolhidos."
                  descricao="Troque o cliente ou o ano no filtro acima, ou registre o primeiro pagamento de DS/DI."
                />
              ) : null}
              {exibidos.map((pagamento) => (
                <TableRow key={pagamento.id}>
                  <TableCell className="text-sm">
                    {formatarData(new Date(`${pagamento.data}T12:00:00`))}
                  </TableCell>
                  <TableCell className="text-sm font-semibold">
                    {pagamento.cliente}
                  </TableCell>
                  <TableCell className="text-sm">
                    {ROTULO_TIPO_PAGAMENTO[pagamento.tipo]}
                  </TableCell>
                  <TableCell className="text-right text-sm font-bold">
                    {moeda.format(pagamento.valor)}
                  </TableCell>
                  <TableCell className="max-w-72 text-xs text-muted-foreground">
                    {pagamento.descricao ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

type PropsDialogo = {
  aberto: boolean;
  aoMudarAberto: (aberto: boolean) => void;
  clientes: ClienteOpcao[];
  aoRegistrar: (formData: FormData) => void;
  pendente: boolean;
};

function DialogoNovoPagamento({
  aberto,
  aoMudarAberto,
  clientes,
  aoRegistrar,
  pendente,
}: PropsDialogo) {
  return (
    <Dialog open={aberto} onOpenChange={aoMudarAberto}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            Registrar pagamento
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pagamento DS/DI</DialogTitle>
          <DialogDescription>
            Informe o que foi pago ao produtor. O comprovante (foto) é opcional
            e fica guardado no cofre de evidências.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            aoRegistrar(new FormData(e.currentTarget));
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="pgto-cliente">Cliente (produtor)</Label>
            <SelectNativo
              id="pgto-cliente"
              name="clienteId"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Escolha o cliente…
              </option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </SelectNativo>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pgto-tipo">Tipo</Label>
              <SelectNativo
                id="pgto-tipo"
                name="tipo"
                required
                defaultValue="diferencial"
              >
                <option value="diferencial">Diferencial (DS)</option>
                <option value="investimento">Investimento (DI)</option>
              </SelectNativo>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pgto-valor">Valor (R$)</Label>
              <Input
                id="pgto-valor"
                name="valor"
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="Ex.: 1850,00"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pgto-data">Data do pagamento</Label>
            <Input id="pgto-data" name="data" type="date" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pgto-descricao">Descrição (opcional)</Label>
            <Input
              id="pgto-descricao"
              name="descricao"
              placeholder="Ex.: DS safra 2025/2026 — 370 sacas"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pgto-comprovante">Comprovante (opcional)</Label>
            <Input
              id="pgto-comprovante"
              name="comprovante"
              type="file"
              accept="image/jpeg,image/png,image/webp"
            />
          </div>
          <DialogFooter className="mt-2">
            <Button type="submit" disabled={pendente}>
              Registrar pagamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
