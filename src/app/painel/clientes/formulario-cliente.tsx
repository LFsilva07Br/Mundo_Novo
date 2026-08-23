"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  atualizarCliente,
  criarCliente,
  type EstadoAcao,
} from "@/lib/carteira/acoes";
import { ROTULO_FASE, type Cliente, type Grupo } from "@/lib/carteira/tipos";

/**
 * Dialog de criação/edição de cliente.
 * Sem `cliente`, cria (fase inicial sempre "implantação" — regra do produto);
 * com `cliente`, edita os dados cadastrais, inclusive a fase.
 */
export function FormularioCliente({
  grupos,
  cliente,
  abertoInicialmente = false,
}: {
  grupos: Grupo[];
  cliente?: Cliente;
  abertoInicialmente?: boolean;
}) {
  const editando = Boolean(cliente);
  const [aberto, setAberto] = useState(abertoInicialmente);
  const [estado, enviar, pendente] = useActionState<EstadoAcao, FormData>(
    async (estadoAnterior, formData) => {
      const acao = editando ? atualizarCliente : criarCliente;
      const resultado = await acao(estadoAnterior, formData);
      if (resultado?.ok) {
        toast.success(resultado.mensagem);
        setAberto(false);
      }
      return resultado;
    },
    null,
  );

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      {editando ? (
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          <Pencil className="size-3.5" />
          Editar dados
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <Plus className="size-4" />
          Novo cliente
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editando ? `Editar ${cliente?.nome}` : "Novo cliente"}
          </DialogTitle>
          <DialogDescription>
            {editando
              ? "Atualize os dados cadastrais do cliente."
              : "Todo cliente novo entra na fase de implantação antes de habilitar avaliações."}
          </DialogDescription>
        </DialogHeader>

        <form action={enviar} className="space-y-4">
          {editando ? (
            <input type="hidden" name="id" value={cliente?.id} />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="cliente-nome">Nome do cliente</Label>
            <Input
              id="cliente-nome"
              name="nome"
              defaultValue={cliente?.nome}
              placeholder="Fazenda Boa Esperança"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cliente-tipo">Tipo</Label>
              <SelectNativo
                id="cliente-tipo"
                name="tipo"
                defaultValue={cliente?.tipo ?? "fazenda"}
              >
                <option value="fazenda">Fazenda</option>
                <option value="cadeia_suprimentos">
                  Cadeia de Suprimentos
                </option>
              </SelectNativo>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cliente-grupo">Grupo</Label>
              <SelectNativo
                id="cliente-grupo"
                name="grupoId"
                defaultValue={cliente?.grupoId ?? ""}
              >
                <option value="">Sem grupo (cliente direto)</option>
                {grupos.map((grupo) => (
                  <option key={grupo.id} value={grupo.id}>
                    {grupo.nome}
                  </option>
                ))}
              </SelectNativo>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cliente-produtor">Produtor (opcional)</Label>
            <Input
              id="cliente-produtor"
              name="produtor"
              defaultValue={cliente?.produtor}
              placeholder="Nome do produtor responsável"
            />
          </div>

          <div className="grid grid-cols-[1fr_5rem] gap-3">
            <div className="space-y-2">
              <Label htmlFor="cliente-cidade">Cidade</Label>
              <Input
                id="cliente-cidade"
                name="cidade"
                defaultValue={cliente?.cidade}
                placeholder="Patrocínio"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cliente-uf">UF</Label>
              <Input
                id="cliente-uf"
                name="uf"
                defaultValue={cliente?.uf}
                placeholder="MG"
                maxLength={2}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cliente-regiao">Região</Label>
            <Input
              id="cliente-regiao"
              name="regiao"
              defaultValue={cliente?.regiao}
              placeholder="Cerrado Mineiro"
              required
            />
          </div>

          {editando ? (
            <div className="space-y-2">
              <Label htmlFor="cliente-fase">Fase</Label>
              <SelectNativo
                id="cliente-fase"
                name="fase"
                defaultValue={cliente?.fase}
              >
                {(
                  Object.entries(ROTULO_FASE) as [
                    keyof typeof ROTULO_FASE,
                    string,
                  ][]
                ).map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>
                    {rotulo}
                  </option>
                ))}
              </SelectNativo>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Fase inicial: <strong>Implantação</strong> — a fazenda só habilita
              avaliações depois dessa etapa.
            </p>
          )}

          {estado && !estado.ok ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {estado.erro}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={pendente}>
              {pendente
                ? "Salvando…"
                : editando
                  ? "Salvar alterações"
                  : "Criar cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
