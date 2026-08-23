"use client";

import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  criarContratoFinanceiro,
  type EstadoAcao,
} from "@/lib/financeiro/acoes";
import { cn } from "@/lib/utils";

/** Opção mínima para o seletor de cliente do formulário. */
export type OpcaoCliente = { id: string; nome: string };

const CLASSE_SELECT =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

function Campo({
  rotulo,
  id,
  className,
  children,
}: {
  rotulo: string;
  id: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{rotulo}</Label>
      {children}
    </div>
  );
}

function MensagemAcao({ estado }: { estado: EstadoAcao }) {
  if (!estado) return null;
  return (
    <p
      role="alert"
      className={cn(
        "text-sm font-medium",
        estado.ok ? "text-primary" : "text-destructive",
      )}
    >
      {estado.mensagem}
    </p>
  );
}

/** Fecha o diálogo quando uma nova resposta de sucesso chega da ação. */
function useFecharAoConcluir(estado: EstadoAcao, aoConcluir?: () => void) {
  const anterior = useRef<EstadoAcao>(null);
  useEffect(() => {
    if (estado && estado !== anterior.current && estado.ok) aoConcluir?.();
    anterior.current = estado;
  }, [estado, aoConcluir]);
}

// ------------------------------------------------------------------
// Formulário de contrato financeiro
// ------------------------------------------------------------------

export function FormularioContratoFinanceiro({
  clientes,
  aoConcluir,
}: {
  clientes: OpcaoCliente[];
  aoConcluir?: () => void;
}) {
  const idBase = useId();
  const [estado, despachar, pendente] = useActionState<EstadoAcao, FormData>(
    criarContratoFinanceiro,
    null,
  );
  useFecharAoConcluir(estado, aoConcluir);

  return (
    <form action={despachar} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo
          rotulo="Cliente"
          id={`${idBase}-clienteId`}
          className="sm:col-span-2"
        >
          <select
            id={`${idBase}-clienteId`}
            name="clienteId"
            defaultValue=""
            className={CLASSE_SELECT}
            required
          >
            <option value="" disabled>
              Escolha o cliente…
            </option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo
          rotulo="Serviço contratado"
          id={`${idBase}-descricao`}
          className="sm:col-span-2"
        >
          <Input
            id={`${idBase}-descricao`}
            name="descricao"
            placeholder="Consultoria de certificação Rainforest Alliance"
            required
          />
        </Campo>
        <Campo rotulo="Valor mensal (R$)" id={`${idBase}-valorMensal`}>
          <Input
            id={`${idBase}-valorMensal`}
            name="valorMensal"
            inputMode="decimal"
            placeholder="2.500,00"
            required
          />
        </Campo>
        <Campo rotulo="Dia de vencimento" id={`${idBase}-diaVencimento`}>
          <Input
            id={`${idBase}-diaVencimento`}
            name="diaVencimento"
            type="number"
            min={1}
            max={28}
            placeholder="5"
            required
          />
          <p className="text-xs text-muted-foreground">
            Use um dia até 28 para a mensalidade existir em todo mês.
          </p>
        </Campo>
        <Campo rotulo="Início da vigência" id={`${idBase}-inicio`}>
          <Input id={`${idBase}-inicio`} name="inicio" type="date" required />
          <p className="text-xs text-muted-foreground">
            O primeiro mês é cobrado proporcional (pró-rata) aos dias a partir
            do início.
          </p>
        </Campo>
        <Campo rotulo="Fim da vigência (opcional)" id={`${idBase}-fim`}>
          <Input id={`${idBase}-fim`} name="fim" type="date" />
        </Campo>
      </div>

      <MensagemAcao estado={estado} />

      <Button type="submit" className="w-full" disabled={pendente}>
        {pendente ? "Salvando…" : "Criar contrato"}
      </Button>
    </form>
  );
}

// ------------------------------------------------------------------
// Diálogo (botão + formulário)
// ------------------------------------------------------------------

export function BotaoNovoContrato({ clientes }: { clientes: OpcaoCliente[] }) {
  const [aberto, setAberto] = useState(false);
  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus data-icon="inline-start" />
        Novo contrato
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Novo contrato de mensalidade</DialogTitle>
          <DialogDescription>
            Contrato recorrente com o cliente: as faturas são geradas mês a
            mês, com o primeiro mês proporcional à data de início.
          </DialogDescription>
        </DialogHeader>
        <FormularioContratoFinanceiro
          clientes={clientes}
          aoConcluir={() => setAberto(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
