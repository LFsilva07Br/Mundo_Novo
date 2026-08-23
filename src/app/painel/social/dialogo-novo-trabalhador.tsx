"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { criarTrabalhador, type EstadoAcao } from "@/lib/social/acoes";

const FUNCOES_HABILITADAS = [
  "Trator",
  "Colhedeira",
  "Abastecimento",
  "Aplicação de defensivos",
  "Lavador",
  "Benefício",
  "Outros",
];

const BENEFICIOS = [
  { campo: "moradia", rotulo: "Moradia" },
  { campo: "alimentacao", rotulo: "Alimentação" },
  { campo: "transporte", rotulo: "Transporte" },
  { campo: "cestaBasica", rotulo: "Cesta básica" },
  { campo: "gratificacoes", rotulo: "Gratificações" },
];

const ADICIONAIS = [
  { campo: "insalubridade", rotulo: "Insalubridade" },
  { campo: "periculosidade", rotulo: "Periculosidade" },
];

const CLASSE_SELECT =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/** Botão + formulário de cadastro de colaborador (Server Action com zod). */
export function DialogoNovoTrabalhador({ clienteId }: { clienteId: string }) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao, pendente] = useActionState<EstadoAcao, FormData>(
    criarTrabalhador,
    null,
  );

  return (
    <>
      <Button onClick={() => setAberto(true)}>
        <Plus className="size-4" />
        Novo trabalhador
      </Button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo trabalhador</DialogTitle>
            <DialogDescription>
              Cadastro completo do colaborador — base da conformidade
              social/trabalhista da norma.
            </DialogDescription>
          </DialogHeader>

          <form action={acao} className="space-y-4">
            <input type="hidden" name="clienteId" value={clienteId} />

            <div className="space-y-2">
              <Label htmlFor="trabalhador-nome">Nome completo</Label>
              <Input
                id="trabalhador-nome"
                name="nome"
                placeholder="Nome do colaborador"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="trabalhador-vinculo">Vínculo</Label>
                <select
                  id="trabalhador-vinculo"
                  name="vinculo"
                  defaultValue="fixo"
                  className={CLASSE_SELECT}
                >
                  <option value="fixo">Fixo</option>
                  <option value="temporario">Temporário</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trabalhador-genero">Gênero</Label>
                <select
                  id="trabalhador-genero"
                  name="genero"
                  defaultValue=""
                  className={CLASSE_SELECT}
                >
                  <option value="">Não informar</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="trabalhador-funcao">Função</Label>
                <Input
                  id="trabalhador-funcao"
                  name="funcao"
                  placeholder="Ex.: Tratorista Agrícola"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trabalhador-cbo">CBO</Label>
                <Input
                  id="trabalhador-cbo"
                  name="cbo"
                  placeholder="Ex.: 641015"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="trabalhador-salario">Salário (R$)</Label>
                <Input
                  id="trabalhador-salario"
                  name="salario"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1890,00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trabalhador-admissao">Admissão</Label>
                <Input id="trabalhador-admissao" name="admissao" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trabalhador-nascimento">Nascimento</Label>
                <Input
                  id="trabalhador-nascimento"
                  name="nascimento"
                  type="date"
                />
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Benefícios</legend>
              <div className="grid grid-cols-2 gap-1.5">
                {BENEFICIOS.map((b) => (
                  <label
                    key={b.campo}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input type="checkbox" name={b.campo} className="size-4" />
                    {b.rotulo}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Adicionais</legend>
              <div className="grid grid-cols-2 gap-1.5">
                {ADICIONAIS.map((a) => (
                  <label
                    key={a.campo}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input type="checkbox" name={a.campo} className="size-4" />
                    {a.rotulo}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">
                Funções habilitadas
              </legend>
              <div className="grid grid-cols-2 gap-1.5">
                {FUNCOES_HABILITADAS.map((f) => (
                  <label key={f} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="funcoesHabilitadas"
                      value={f}
                      className="size-4"
                    />
                    {f}
                  </label>
                ))}
              </div>
            </fieldset>

            {estado && !estado.ok ? (
              <p role="alert" className="text-sm font-medium text-destructive">
                {estado.erro}
              </p>
            ) : null}
            {estado?.ok ? (
              <p role="status" className="text-sm font-medium text-primary">
                {estado.mensagem}
              </p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAberto(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pendente}>
                {pendente ? "Salvando…" : "Salvar colaborador"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
