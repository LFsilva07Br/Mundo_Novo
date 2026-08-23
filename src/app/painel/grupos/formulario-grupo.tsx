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
  atualizarGrupo,
  criarGrupo,
  type EstadoAcao,
} from "@/lib/carteira/acoes";
import type { Grupo } from "@/lib/carteira/tipos";

/** Dialog de criação/edição de grupo. Sem `grupo`, cria; com `grupo`, edita. */
export function FormularioGrupo({
  grupo,
  abertoInicialmente = false,
}: {
  grupo?: Grupo;
  abertoInicialmente?: boolean;
}) {
  const editando = Boolean(grupo);
  const [aberto, setAberto] = useState(abertoInicialmente);
  const [estado, enviar, pendente] = useActionState<EstadoAcao, FormData>(
    async (estadoAnterior, formData) => {
      const acao = editando ? atualizarGrupo : criarGrupo;
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
        <DialogTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Editar ${grupo?.nome}`}
            />
          }
        >
          <Pencil className="size-3.5" />
          Editar
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <Plus className="size-4" />
          Novo grupo
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editando ? `Editar ${grupo?.nome}` : "Novo grupo"}
          </DialogTitle>
          <DialogDescription>
            Grupos reúnem clientes administrados juntos — pela Mundo Novo ou
            por um terceiro, como uma cooperativa.
          </DialogDescription>
        </DialogHeader>

        <form action={enviar} className="space-y-4">
          {editando ? <input type="hidden" name="id" value={grupo?.id} /> : null}

          <div className="space-y-2">
            <Label htmlFor="grupo-nome">Nome do grupo</Label>
            <Input
              id="grupo-nome"
              name="nome"
              defaultValue={grupo?.nome}
              placeholder="Grupo Alta Mogiana"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="grupo-administracao">Administração</Label>
            <SelectNativo
              id="grupo-administracao"
              name="administracao"
              defaultValue={grupo?.administracao ?? "mundo_novo"}
            >
              <option value="mundo_novo">Administrado pela Mundo Novo</option>
              <option value="terceiro">Administrado por terceiro</option>
            </SelectNativo>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grupo-administrador">
              Nome do administrador (se terceiro)
            </Label>
            <Input
              id="grupo-administrador"
              name="nomeAdministrador"
              defaultValue={grupo?.nomeAdministrador}
              placeholder="Expocaccer (cooperativa)"
            />
          </div>

          <div className="grid grid-cols-[1fr_5rem] gap-3">
            <div className="space-y-2">
              <Label htmlFor="grupo-cidade">Cidade</Label>
              <Input
                id="grupo-cidade"
                name="cidade"
                defaultValue={grupo?.cidade}
                placeholder="Patrocínio"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grupo-uf">UF</Label>
              <Input
                id="grupo-uf"
                name="uf"
                defaultValue={grupo?.uf}
                placeholder="MG"
                maxLength={2}
              />
            </div>
          </div>

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
                  : "Criar grupo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
