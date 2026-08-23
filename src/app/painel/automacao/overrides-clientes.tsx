"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNativo } from "@/components/select-nativo";
import { EstadoVazio } from "@/components/estado-vazio";
import {
  removerConfiguracao,
  salvarConfiguracaoCliente,
} from "@/lib/alertas/acoes";
import type { ConfigAlertaCliente } from "@/lib/alertas/consultas";
import {
  MAIOR_MARCO_DIAS,
  MAXIMO_MARCOS,
  MENOR_MARCO_DIAS,
  normalizarRegua,
} from "@/lib/alertas/validacao";
import { cn } from "@/lib/utils";

/** Marcos sugeridos nos chips do dialog (mesma régua da tela). */
const MARCOS_SUGERIDOS = [180, 150, 120, 90, 60, 30, 15, 7] as const;

type ClienteOpcao = { id: string; nome: string };

/**
 * Seção "Overrides por cliente": lista as réguas específicas gravadas
 * em config_alertas_cliente, com criação/edição/remoção. Em modo
 * demonstração fica somente leitura.
 */
export function OverridesClientes({
  configuracoes,
  clientes,
  modoDemo,
}: {
  configuracoes: ConfigAlertaCliente[];
  clientes: ClienteOpcao[];
  modoDemo: boolean;
}) {
  const [editando, setEditando] = useState<ConfigAlertaCliente | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [, iniciarRemocao] = useTransition();

  function abrirNovo() {
    setEditando(null);
    setDialogAberto(true);
  }

  function abrirEdicao(config: ConfigAlertaCliente) {
    setEditando(config);
    setDialogAberto(true);
  }

  function remover(config: ConfigAlertaCliente) {
    iniciarRemocao(async () => {
      const resultado = await removerConfiguracao(config.clienteId);
      if (resultado?.ok) toast.success(resultado.mensagem);
      else if (resultado) toast.error(resultado.erro);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-primary" />
          Overrides por cliente
        </CardTitle>
        <CardDescription>
          Clientes com régua de disparos própria — sobrepõe o padrão global do
          motor por data. Opcionalmente, o administrador do grupo recebe cópia
          dos alertas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {modoDemo ? (
          <p
            role="status"
            className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm"
          >
            Modo demonstração: o banco ainda não foi conectado — os overrides
            abaixo são um exemplo e ficam somente leitura.
          </p>
        ) : null}

        {configuracoes.length === 0 ? (
          <EstadoVazio
            icone={SlidersHorizontal}
            titulo="Nenhum override cadastrado — todos os clientes seguem a régua padrão."
          />
        ) : (
          <ul className="space-y-2">
            {configuracoes.map((config) => (
              <li
                key={config.clienteId}
                className="flex flex-wrap items-center gap-2 rounded-xl border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{config.clienteNome}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Régua: {config.dias.join(" · ")} dias
                  </p>
                </div>
                {config.copiaAdminGrupo ? (
                  <Badge variant="outline">Cópia ao admin do grupo</Badge>
                ) : null}
                {modoDemo ? null : (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Editar override de ${config.clienteNome}`}
                      onClick={() => abrirEdicao(config)}
                    >
                      <Pencil className="size-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Remover override de ${config.clienteNome}`}
                      onClick={() => remover(config)}
                    >
                      <Trash2 className="size-3.5" />
                      Remover
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {modoDemo ? null : (
          <Button onClick={abrirNovo}>
            <Plus className="size-4" />
            Novo override
          </Button>
        )}

        <DialogOverride
          key={`${dialogAberto}-${editando?.clienteId ?? "novo"}`}
          aberto={dialogAberto}
          aoMudar={setDialogAberto}
          config={editando}
          clientes={clientes}
          clientesComOverride={configuracoes.map((c) => c.clienteId)}
        />
      </CardContent>
    </Card>
  );
}

function DialogOverride({
  aberto,
  aoMudar,
  config,
  clientes,
  clientesComOverride,
}: {
  aberto: boolean;
  aoMudar: (aberto: boolean) => void;
  config: ConfigAlertaCliente | null;
  clientes: ClienteOpcao[];
  clientesComOverride: string[];
}) {
  const editando = Boolean(config);
  const [clienteId, setClienteId] = useState(config?.clienteId ?? "");
  const [marcos, setMarcos] = useState<number[]>(config?.dias ?? [90, 60, 30, 15, 7]);
  const [copiaAdmin, setCopiaAdmin] = useState(config?.copiaAdminGrupo ?? false);
  const [personalizado, setPersonalizado] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciarEnvio] = useTransition();

  // Ao criar, oferece só clientes sem override; ao editar, o cliente é fixo.
  const opcoes = editando
    ? clientes
    : clientes.filter((c) => !clientesComOverride.includes(c.id));

  function alternarMarco(dias: number) {
    setMarcos((atuais) =>
      atuais.includes(dias)
        ? atuais.filter((m) => m !== dias)
        : normalizarRegua([...atuais, dias]),
    );
  }

  function adicionarPersonalizado() {
    const valor = Number(personalizado);
    if (
      !Number.isInteger(valor) ||
      valor < MENOR_MARCO_DIAS ||
      valor > MAIOR_MARCO_DIAS
    ) {
      setErro(
        `O marco personalizado deve ser um número inteiro entre ${MENOR_MARCO_DIAS} e ${MAIOR_MARCO_DIAS} dias.`,
      );
      return;
    }
    setErro(null);
    setMarcos((atuais) => normalizarRegua([...atuais, valor]));
    setPersonalizado("");
  }

  function salvar() {
    iniciarEnvio(async () => {
      const resultado = await salvarConfiguracaoCliente(
        clienteId,
        marcos,
        copiaAdmin,
      );
      if (resultado?.ok) {
        toast.success(resultado.mensagem);
        aoMudar(false);
      } else if (resultado) {
        setErro(resultado.erro);
      }
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudar}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editando
              ? `Editar override — ${config?.clienteNome}`
              : "Novo override de régua"}
          </DialogTitle>
          <DialogDescription>
            Escolha os marcos de disparo (em dias antes do vencimento) que
            valem só para este cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="override-cliente">Cliente</Label>
            {editando ? (
              <Input
                id="override-cliente"
                value={config?.clienteNome ?? ""}
                readOnly
                disabled
              />
            ) : (
              <SelectNativo
                id="override-cliente"
                value={clienteId}
                onChange={(evento) => setClienteId(evento.target.value)}
              >
                <option value="">Escolha o cliente…</option>
                {opcoes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </SelectNativo>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              Marcos de disparo ({marcos.length} de {MAXIMO_MARCOS})
            </p>
            <div className="flex flex-wrap gap-2">
              {MARCOS_SUGERIDOS.map((dias) => (
                <button
                  key={dias}
                  type="button"
                  aria-pressed={marcos.includes(dias)}
                  onClick={() => alternarMarco(dias)}
                  className={cn(
                    "rounded-xl border px-3 py-1.5 text-sm font-bold transition-colors",
                    marcos.includes(dias)
                      ? "border-primary bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {dias} dias
                </button>
              ))}
              {marcos
                .filter((m) => !MARCOS_SUGERIDOS.includes(m as never))
                .map((dias) => (
                  <button
                    key={dias}
                    type="button"
                    aria-pressed
                    onClick={() => alternarMarco(dias)}
                    className="rounded-xl border border-primary bg-secondary px-3 py-1.5 text-sm font-bold text-secondary-foreground"
                  >
                    {dias} dias
                  </button>
                ))}
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="override-personalizado">
                  Marco personalizado (dias)
                </Label>
                <Input
                  id="override-personalizado"
                  type="number"
                  min={MENOR_MARCO_DIAS}
                  max={MAIOR_MARCO_DIAS}
                  value={personalizado}
                  onChange={(evento) => setPersonalizado(evento.target.value)}
                  placeholder="Ex.: 45"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={adicionarPersonalizado}
                disabled={!personalizado}
              >
                Adicionar
              </Button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={copiaAdmin}
              onChange={(evento) => setCopiaAdmin(evento.target.checked)}
            />
            Enviar cópia dos alertas ao administrador do grupo
          </label>

          {erro ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {erro}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              onClick={salvar}
              disabled={pendente || !clienteId || marcos.length === 0}
            >
              {pendente
                ? "Salvando…"
                : editando
                  ? "Salvar alterações"
                  : "Criar override"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
