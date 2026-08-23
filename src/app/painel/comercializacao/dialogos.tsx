"use client";

import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Pencil, Plus } from "lucide-react";
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
  atualizarLote,
  criarLote,
  criarNegociacao,
  type EstadoAcao,
} from "@/lib/comercializacao/acoes";
import type { Lote, OpcaoSafra } from "@/lib/comercializacao/consultas";
import { formatarSacas } from "@/lib/comercializacao/regras";
import { cn } from "@/lib/utils";

/** Opções mínimas para os seletores dos formulários. */
export type OpcaoCliente = { id: string; nome: string };
export type OpcaoLote = {
  id: string;
  identificacao: string;
  clienteNome: string;
  saldoDisponivel: number;
};

const CLASSE_SELECT =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

function numeroParaTexto(valor?: number): string | undefined {
  return valor === undefined ? undefined : String(valor).replace(".", ",");
}

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
// Formulário de lote (criação e edição)
// ------------------------------------------------------------------

export function FormularioLote({
  clientes,
  safras,
  lote,
  aoConcluir,
}: {
  clientes: OpcaoCliente[];
  safras: OpcaoSafra[];
  lote?: Lote;
  aoConcluir?: () => void;
}) {
  const idBase = useId();
  const [estado, despachar, pendente] = useActionState<EstadoAcao, FormData>(
    lote ? atualizarLote : criarLote,
    null,
  );
  useFecharAoConcluir(estado, aoConcluir);

  return (
    <form action={despachar} className="space-y-4">
      {lote ? <input type="hidden" name="id" value={lote.id} /> : null}
      {lote ? (
        <input type="hidden" name="clienteId" value={lote.clienteId} />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {lote ? null : (
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
        )}
        <Campo rotulo="Identificação do lote" id={`${idBase}-identificacao`}>
          <Input
            id={`${idBase}-identificacao`}
            name="identificacao"
            defaultValue={lote?.identificacao}
            placeholder="LOTE-2026-001"
            required
          />
        </Campo>
        <Campo rotulo="Safra" id={`${idBase}-safraId`}>
          <select
            id={`${idBase}-safraId`}
            name="safraId"
            defaultValue={lote?.safraId ?? ""}
            className={CLASSE_SELECT}
          >
            <option value="">Sem safra definida</option>
            {safras.map((safra) => (
              <option key={safra.id} value={safra.id}>
                {safra.rotulo}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Sacas" id={`${idBase}-sacas`}>
          <Input
            id={`${idBase}-sacas`}
            name="sacas"
            inputMode="decimal"
            defaultValue={numeroParaTexto(lote?.sacas)}
            placeholder="350"
            required
          />
        </Campo>
        <Campo rotulo="Peneira" id={`${idBase}-peneira`}>
          <Input
            id={`${idBase}-peneira`}
            name="peneira"
            defaultValue={lote?.peneira}
            placeholder="16 acima"
          />
        </Campo>
        <Campo rotulo="Bebida" id={`${idBase}-bebida`}>
          <Input
            id={`${idBase}-bebida`}
            name="bebida"
            defaultValue={lote?.bebida}
            placeholder="dura"
          />
        </Campo>
        <Campo
          rotulo="Talhões de origem"
          id={`${idBase}-origemTalhoes`}
          className="sm:col-span-2"
        >
          <Input
            id={`${idBase}-origemTalhoes`}
            name="origemTalhoes"
            defaultValue={lote?.origemTalhoes}
            placeholder="T-01, T-02, T-05"
          />
          <p className="text-xs text-muted-foreground">
            Rastreabilidade: liste os talhões que formaram o lote (ex.: T-01,
            T-02…). A Rainforest exige a separação do café certificado.
          </p>
        </Campo>
        <Campo
          rotulo="Observação"
          id={`${idBase}-observacao`}
          className="sm:col-span-2"
        >
          <Input
            id={`${idBase}-observacao`}
            name="observacao"
            defaultValue={lote?.observacao}
            placeholder="Ex.: café certificado, armazenado na cooperativa"
          />
        </Campo>
      </div>

      <MensagemAcao estado={estado} />

      <Button type="submit" className="w-full" disabled={pendente}>
        {pendente
          ? "Salvando…"
          : lote
            ? "Salvar alterações"
            : "Cadastrar lote"}
      </Button>
    </form>
  );
}

// ------------------------------------------------------------------
// Formulário de negociação
// ------------------------------------------------------------------

export function FormularioNegociacao({
  lotes,
  loteId,
  aoConcluir,
}: {
  lotes: OpcaoLote[];
  loteId?: string;
  aoConcluir?: () => void;
}) {
  const idBase = useId();
  const [estado, despachar, pendente] = useActionState<EstadoAcao, FormData>(
    criarNegociacao,
    null,
  );
  useFecharAoConcluir(estado, aoConcluir);

  return (
    <form action={despachar} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Lote" id={`${idBase}-loteId`} className="sm:col-span-2">
          <select
            id={`${idBase}-loteId`}
            name="loteId"
            defaultValue={loteId ?? ""}
            className={CLASSE_SELECT}
            required
          >
            <option value="" disabled>
              Escolha o lote…
            </option>
            {lotes.map((lote) => (
              <option key={lote.id} value={lote.id}>
                {lote.identificacao} — {lote.clienteNome} (saldo{" "}
                {formatarSacas(lote.saldoDisponivel)} sc)
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Comprador" id={`${idBase}-comprador`}>
          <Input
            id={`${idBase}-comprador`}
            name="comprador"
            placeholder="Cooxupé"
            required
          />
        </Campo>
        <Campo rotulo="Sacas" id={`${idBase}-sacas`}>
          <Input
            id={`${idBase}-sacas`}
            name="sacas"
            inputMode="decimal"
            placeholder="100"
            required
          />
        </Campo>
        <Campo rotulo="Preço por saca (R$)" id={`${idBase}-precoPorSaca`}>
          <Input
            id={`${idBase}-precoPorSaca`}
            name="precoPorSaca"
            inputMode="decimal"
            placeholder="2.450,00"
            required
          />
        </Campo>
        <Campo rotulo="Data da negociação" id={`${idBase}-data`}>
          <Input id={`${idBase}-data`} name="data" type="date" />
        </Campo>
        <Campo rotulo="Contrato" id={`${idBase}-contrato`}>
          <Input
            id={`${idBase}-contrato`}
            name="contrato"
            placeholder="CT-2026-045"
          />
        </Campo>
        <Campo rotulo="Situação" id={`${idBase}-status`}>
          <select
            id={`${idBase}-status`}
            name="status"
            defaultValue="proposta"
            className={CLASSE_SELECT}
          >
            <option value="proposta">Proposta em análise</option>
            <option value="fechada">Fechada (abate o saldo do lote)</option>
          </select>
        </Campo>
        <Campo
          rotulo="Observação"
          id={`${idBase}-observacao`}
          className="sm:col-span-2"
        >
          <Input
            id={`${idBase}-observacao`}
            name="observacao"
            placeholder="Ex.: aguardando classificação da amostra"
          />
        </Campo>
      </div>

      <MensagemAcao estado={estado} />

      <Button type="submit" className="w-full" disabled={pendente}>
        {pendente ? "Salvando…" : "Registrar negociação"}
      </Button>
    </form>
  );
}

// ------------------------------------------------------------------
// Diálogos (botão + formulário)
// ------------------------------------------------------------------

function DialogoAcao({
  titulo,
  descricao,
  botao,
  children,
}: {
  titulo: string;
  descricao: string;
  botao: ReactNode;
  children: (fechar: () => void) => ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      {botao}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>
        {children(() => setAberto(false))}
      </DialogContent>
    </Dialog>
  );
}

export function BotaoNovoLote({
  clientes,
  safras,
}: {
  clientes: OpcaoCliente[];
  safras: OpcaoSafra[];
}) {
  return (
    <DialogoAcao
      titulo="Novo lote"
      descricao="O lote entra no estoque com a rastreabilidade dos talhões de origem."
      botao={
        <DialogTrigger render={<Button size="sm" />}>
          <Plus data-icon="inline-start" />
          Novo lote
        </DialogTrigger>
      }
    >
      {(fechar) => (
        <FormularioLote clientes={clientes} safras={safras} aoConcluir={fechar} />
      )}
    </DialogoAcao>
  );
}

export function BotaoEditarLote({
  lote,
  clientes,
  safras,
}: {
  lote: Lote;
  clientes: OpcaoCliente[];
  safras: OpcaoSafra[];
}) {
  return (
    <DialogoAcao
      titulo={`Editar ${lote.identificacao}`}
      descricao="As sacas do lote nunca ficam abaixo do total já fechado em negociações."
      botao={
        <DialogTrigger
          render={<Button variant="ghost" size="icon-sm" />}
          aria-label={`Editar lote ${lote.identificacao}`}
        >
          <Pencil />
        </DialogTrigger>
      }
    >
      {(fechar) => (
        <FormularioLote
          clientes={clientes}
          safras={safras}
          lote={lote}
          aoConcluir={fechar}
        />
      )}
    </DialogoAcao>
  );
}

export function BotaoNovaNegociacao({
  lotes,
  loteId,
}: {
  lotes: OpcaoLote[];
  loteId?: string;
}) {
  return (
    <DialogoAcao
      titulo="Nova negociação"
      descricao="A negociação nunca passa do saldo disponível do lote; ao fechar a venda que zera o saldo, o lote vira negociado."
      botao={
        <DialogTrigger render={<Button size="sm" variant="outline" />}>
          <Plus data-icon="inline-start" />
          Nova negociação
        </DialogTrigger>
      }
    >
      {(fechar) => (
        <FormularioNegociacao lotes={lotes} loteId={loteId} aoConcluir={fechar} />
      )}
    </DialogoAcao>
  );
}
