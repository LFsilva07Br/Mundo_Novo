"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SelectNativo } from "@/components/select-nativo";
import { salvarPlanoGestao, type EstadoAcao } from "@/lib/compliance/acoes";
import {
  NIVEIS_RISCO,
  ROTULOS_NIVEL_RISCO,
  type MetaPlano,
  type RiscoPlano,
} from "@/lib/compliance/validacao";

export type OpcaoClientePlano = { id: string; nome: string };

const RISCO_VAZIO: RiscoPlano = {
  area: "",
  risco: "",
  probabilidade: "medio",
  impacto: "medio",
  mitigacao: "",
};

const META_VAZIA: MetaPlano = { meta: "", concluida: false };

/**
 * Editor do plano de gestão anual (cap. 1.3): avaliação de riscos
 * (probabilidade × impacto, com mitigação) e metas com prazo e
 * responsável. Linhas dinâmicas; upsert por cliente + ano.
 */
export function EditorPlano({
  clientes,
  clienteId,
  clienteIdFormulario,
  ano,
  riscosIniciais,
  metasIniciais,
  observacaoInicial,
}: {
  clientes: OpcaoClientePlano[];
  clienteId: string;
  /** Id real (uuid) usado na gravação — no demo os ids são apelidos. */
  clienteIdFormulario: string;
  ano: number;
  riscosIniciais: RiscoPlano[];
  metasIniciais: MetaPlano[];
  observacaoInicial?: string;
}) {
  const router = useRouter();
  const [riscos, setRiscos] = useState<RiscoPlano[]>(riscosIniciais);
  const [metas, setMetas] = useState<MetaPlano[]>(metasIniciais);
  const [estado, acao, pendente] = useActionState<EstadoAcao, FormData>(
    salvarPlanoGestao,
    null,
  );

  const anoAtual = new Date().getFullYear();
  const anos = [anoAtual - 1, anoAtual, anoAtual + 1];
  if (!anos.includes(ano)) anos.unshift(ano);

  function navegar(novoCliente: string, novoAno: number) {
    router.push(`/painel/compliance?cliente=${novoCliente}&ano=${novoAno}&aba=plano`);
  }

  function mudarRisco(indice: number, campo: keyof RiscoPlano, valor: string) {
    setRiscos((atuais) =>
      atuais.map((r, i) => (i === indice ? { ...r, [campo]: valor } : r)),
    );
  }

  function mudarMeta(
    indice: number,
    campo: keyof MetaPlano,
    valor: string | boolean,
  ) {
    setMetas((atuais) =>
      atuais.map((m, i) => (i === indice ? { ...m, [campo]: valor } : m)),
    );
  }

  return (
    <form action={acao} className="space-y-6">
      <input type="hidden" name="clienteId" value={clienteIdFormulario} />
      <input type="hidden" name="ano" value={ano} />
      <input
        type="hidden"
        name="riscos"
        value={JSON.stringify(
          riscos.map((r) => ({ ...r, mitigacao: r.mitigacao.trim() })),
        )}
      />
      <input
        type="hidden"
        name="metas"
        value={JSON.stringify(
          metas.map((m) => ({
            meta: m.meta,
            prazo: m.prazo || undefined,
            responsavel: m.responsavel?.trim() || undefined,
            concluida: m.concluida,
          })),
        )}
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-muted-foreground">Cliente</span>
          <SelectNativo
            aria-label="Cliente do plano"
            className="w-auto"
            value={clienteId}
            onChange={(evento) => navegar(evento.target.value, ano)}
          >
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </SelectNativo>
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-muted-foreground">Ano</span>
          <SelectNativo
            aria-label="Ano do plano"
            className="w-auto"
            value={ano}
            onChange={(evento) => navegar(clienteId, Number(evento.target.value))}
          >
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </SelectNativo>
        </label>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Avaliação de riscos</CardTitle>
          <CardDescription>
            Para cada risco: área, probabilidade × impacto e a mitigação
            prevista no plano.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {riscos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum risco listado ainda — comece adicionando o primeiro.
            </p>
          ) : null}
          {riscos.map((risco, indice) => (
            <div
              key={indice}
              className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_2fr_auto_auto_2fr_auto]"
            >
              <Input
                aria-label={`Área do risco ${indice + 1}`}
                placeholder="Área (ex.: Social)"
                value={risco.area}
                onChange={(e) => mudarRisco(indice, "area", e.target.value)}
              />
              <Input
                aria-label={`Descrição do risco ${indice + 1}`}
                placeholder="Risco identificado"
                value={risco.risco}
                onChange={(e) => mudarRisco(indice, "risco", e.target.value)}
              />
              <SelectNativo
                aria-label={`Probabilidade do risco ${indice + 1}`}
                className="w-auto"
                value={risco.probabilidade}
                onChange={(e) =>
                  mudarRisco(indice, "probabilidade", e.target.value)
                }
              >
                {NIVEIS_RISCO.map((nivel) => (
                  <option key={nivel} value={nivel}>
                    Prob. {ROTULOS_NIVEL_RISCO[nivel].toLowerCase()}
                  </option>
                ))}
              </SelectNativo>
              <SelectNativo
                aria-label={`Impacto do risco ${indice + 1}`}
                className="w-auto"
                value={risco.impacto}
                onChange={(e) => mudarRisco(indice, "impacto", e.target.value)}
              >
                {NIVEIS_RISCO.map((nivel) => (
                  <option key={nivel} value={nivel}>
                    Impacto {ROTULOS_NIVEL_RISCO[nivel].toLowerCase()}
                  </option>
                ))}
              </SelectNativo>
              <Input
                aria-label={`Mitigação do risco ${indice + 1}`}
                placeholder="Mitigação prevista"
                value={risco.mitigacao}
                onChange={(e) => mudarRisco(indice, "mitigacao", e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remover risco ${indice + 1}`}
                onClick={() =>
                  setRiscos((atuais) => atuais.filter((_, i) => i !== indice))
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRiscos((atuais) => [...atuais, { ...RISCO_VAZIO }])}
          >
            <Plus className="size-4" />
            Adicionar risco
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metas do ano</CardTitle>
          <CardDescription>
            Metas com prazo e responsável — marque a caixinha quando a meta
            for concluída.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {metas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma meta cadastrada ainda para este ano.
            </p>
          ) : null}
          {metas.map((meta, indice) => (
            <div
              key={indice}
              className="grid items-center gap-2 rounded-xl border p-3 sm:grid-cols-[auto_2fr_auto_1fr_auto]"
            >
              <input
                type="checkbox"
                className="size-4"
                aria-label={`Meta ${indice + 1} concluída`}
                checked={meta.concluida}
                onChange={(e) => mudarMeta(indice, "concluida", e.target.checked)}
              />
              <Input
                aria-label={`Descrição da meta ${indice + 1}`}
                placeholder="Meta (ex.: divulgar o canal de queixas)"
                value={meta.meta}
                onChange={(e) => mudarMeta(indice, "meta", e.target.value)}
              />
              <Input
                type="date"
                aria-label={`Prazo da meta ${indice + 1}`}
                className="w-auto"
                value={meta.prazo ?? ""}
                onChange={(e) => mudarMeta(indice, "prazo", e.target.value)}
              />
              <Input
                aria-label={`Responsável pela meta ${indice + 1}`}
                placeholder="Responsável"
                value={meta.responsavel ?? ""}
                onChange={(e) => mudarMeta(indice, "responsavel", e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remover meta ${indice + 1}`}
                onClick={() =>
                  setMetas((atuais) => atuais.filter((_, i) => i !== indice))
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMetas((atuais) => [...atuais, { ...META_VAZIA }])}
          >
            <Plus className="size-4" />
            Adicionar meta
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <label
          htmlFor="plano-observacao"
          className="text-sm font-medium"
        >
          Observações do plano (opcional)
        </label>
        <textarea
          id="plano-observacao"
          name="observacao"
          rows={2}
          defaultValue={observacaoInicial}
          placeholder="Contexto do plano, combinados com a família, próximos passos…"
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
        />
      </div>

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

      <Button type="submit" disabled={pendente}>
        {pendente ? "Salvando…" : `Salvar plano ${ano}`}
      </Button>
    </form>
  );
}
