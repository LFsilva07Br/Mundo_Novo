"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search, Users } from "lucide-react";
import { EstadoVazio } from "@/components/estado-vazio";
import { Badge } from "@/components/ui/badge";
import { BadgeVencimento } from "@/components/badge-vencimento";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROTULO_NORMA, type Cliente, type Grupo } from "@/lib/carteira/tipos";
import { gravarClienteSelecionado } from "@/lib/cliente-selecionado";
import { useOrdenacao, type ValorOrdenavel } from "@/lib/tabela/ordenacao";
import { cn } from "@/lib/utils";

type Filtro = "todos" | "fazenda" | "cadeia_suprimentos" | "sem_grupo";
type FiltroProntidao = "qualquer" | "pronta" | "pendencias";

const FILTROS: { id: Filtro; rotulo: string }[] = [
  { id: "todos", rotulo: "Todos" },
  { id: "fazenda", rotulo: "Fazendas" },
  { id: "cadeia_suprimentos", rotulo: "Cadeia de Suprimentos" },
  { id: "sem_grupo", rotulo: "Sem grupo" },
];

const FILTROS_PRONTIDAO: { id: FiltroProntidao; rotulo: string }[] = [
  { id: "qualquer", rotulo: "Qualquer prontidão" },
  { id: "pronta", rotulo: "Prontas para auditoria" },
  { id: "pendencias", rotulo: "Com pendências" },
];

type Coluna =
  | "nome"
  | "local"
  | "grupo"
  | "prontidao"
  | "conformidade"
  | "vencimento";

/** Situação de prontidão de cada cliente, vinda de `avaliarCarteira()`. */
export type ProntidaoResumo = {
  clienteId: string;
  pronta: boolean;
  nota: number;
  pendencias: string[];
};

function normalizar(texto: string): string {
  return texto
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function IconeOrdenacao({
  direcao,
}: {
  direcao: "ascending" | "descending" | "none";
}) {
  if (direcao === "ascending") return <ArrowUp className="size-3" aria-hidden />;
  if (direcao === "descending") return <ArrowDown className="size-3" aria-hidden />;
  return (
    <ChevronsUpDown className="size-3 opacity-40" aria-hidden />
  );
}

/**
 * Lista de clientes em tabela ordenável, com busca por nome, filtro por
 * tipo/grupo e — o que faltava — a prontidão para auditoria de cada cliente.
 * Antes era preciso ir ao dashboard para descobrir quem estava pronto, e
 * lá só apareciam os que tinham pendência.
 */
export function ListaClientes({
  clientes,
  grupos,
  prontidao = [],
}: {
  clientes: Cliente[];
  grupos: Grupo[];
  prontidao?: ProntidaoResumo[];
}) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [filtroProntidao, setFiltroProntidao] =
    useState<FiltroProntidao>("qualquer");

  const nomeGrupo = new Map(grupos.map((g) => [g.id, g.nome]));
  const prontidaoPorCliente = new Map(prontidao.map((p) => [p.clienteId, p]));

  const filtrados = clientes.filter((cliente) => {
    if (busca && !normalizar(cliente.nome).includes(normalizar(busca))) {
      return false;
    }
    const situacao = prontidaoPorCliente.get(cliente.id);
    if (filtroProntidao === "pronta" && !situacao?.pronta) return false;
    if (filtroProntidao === "pendencias" && situacao?.pronta !== false) {
      return false;
    }
    if (filtro === "todos") return true;
    if (filtro === "sem_grupo") return cliente.grupoId === null;
    return cliente.tipo === filtro;
  });

  const valorDaColuna = (cliente: Cliente, coluna: Coluna): ValorOrdenavel => {
    switch (coluna) {
      case "nome":
        return cliente.nome;
      case "local":
        return `${cliente.cidade} ${cliente.uf}`;
      case "grupo":
        return cliente.grupoId ? nomeGrupo.get(cliente.grupoId) : null;
      case "prontidao":
        return prontidaoPorCliente.get(cliente.id)?.nota ?? null;
      case "conformidade":
        return cliente.conformidade ?? null;
      case "vencimento":
        return cliente.certificacoes.find((c) => c.principal)?.venceEm ?? null;
    }
  };

  const tabela = useOrdenacao<Cliente, Coluna>(
    filtrados,
    valorDaColuna,
    { coluna: "nome", direcao: "asc" },
    // Nota e conformidade: quem abre a coluna quer ver o pior caso primeiro.
    { prontidao: "asc", conformidade: "asc" },
  );

  const colunas: { id: Coluna; titulo: string; classe?: string }[] = [
    { id: "nome", titulo: "Cliente" },
    { id: "local", titulo: "Cidade / UF" },
    { id: "grupo", titulo: "Grupo" },
    { id: "prontidao", titulo: "Prontidão" },
    { id: "conformidade", titulo: "Conformidade", classe: "text-right" },
    { id: "vencimento", titulo: "Certificado principal" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Buscar cliente por nome"
            placeholder="Buscar cliente por nome…"
            className="pl-8"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar clientes">
          {FILTROS.map((opcao) => (
            <Button
              key={opcao.id}
              size="sm"
              variant={filtro === opcao.id ? "default" : "outline"}
              aria-pressed={filtro === opcao.id}
              onClick={() => setFiltro(opcao.id)}
            >
              {opcao.rotulo}
            </Button>
          ))}
        </div>
      </div>

      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="Filtrar por prontidão para auditoria"
      >
        {FILTROS_PRONTIDAO.map((opcao) => (
          <Button
            key={opcao.id}
            size="sm"
            variant={filtroProntidao === opcao.id ? "default" : "outline"}
            aria-pressed={filtroProntidao === opcao.id}
            onClick={() => setFiltroProntidao(opcao.id)}
          >
            {opcao.rotulo}
          </Button>
        ))}
      </div>

      {tabela.itens.length === 0 ? (
        <EstadoVazio
          icone={Users}
          titulo="Nenhum cliente encontrado com a busca e os filtros atuais."
        />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                {colunas.map((coluna) => (
                  <TableHead
                    key={coluna.id}
                    {...tabela.propsColuna(coluna.id)}
                    className={cn("whitespace-normal align-bottom", coluna.classe)}
                  >
                    <button
                      {...tabela.propsBotao(coluna.id, coluna.titulo)}
                      className={cn(
                        "inline-flex items-center gap-1 font-bold hover:text-primary",
                        coluna.classe === "text-right" && "flex-row-reverse",
                      )}
                    >
                      {coluna.titulo}
                      <IconeOrdenacao direcao={tabela.ariaSort(coluna.id)} />
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tabela.itens.map((cliente) => {
                const principal = cliente.certificacoes.find((c) => c.principal);
                const situacao = prontidaoPorCliente.get(cliente.id);
                return (
                  <TableRow key={cliente.id}>
                    <TableCell>
                      <Link
                        href={`/painel/clientes/${cliente.id}`}
                        onClick={() => gravarClienteSelecionado(cliente.id)}
                        className="font-bold hover:text-primary"
                      >
                        {cliente.nome}
                      </Link>
                      <p className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <Badge variant="outline">
                          {cliente.tipo === "cadeia_suprimentos"
                            ? "Cadeia de Suprimentos"
                            : "Fazenda"}
                        </Badge>
                        {cliente.certificacoes.map((cert) => (
                          <Badge key={cert.norma} variant="secondary">
                            {ROTULO_NORMA[cert.norma]}
                          </Badge>
                        ))}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm whitespace-normal">
                      {cliente.cidade} - {cliente.uf}
                      {cliente.produtor ? (
                        <p className="text-xs text-muted-foreground">
                          {cliente.produtor}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm whitespace-normal">
                      {cliente.grupoId
                        ? nomeGrupo.get(cliente.grupoId)
                        : "Sem grupo (cliente direto)"}
                    </TableCell>
                    <TableCell>
                      {situacao ? (
                        <span
                          className={cn(
                            "inline-flex rounded-lg px-2.5 py-1 text-xs font-bold",
                            situacao.pronta
                              ? "bg-success/10 text-success"
                              : "bg-destructive/10 text-destructive",
                          )}
                        >
                          {situacao.pronta
                            ? `Pronta · nota ${situacao.nota}`
                            : `${situacao.pendencias.length} pendência(s) · nota ${situacao.nota}`}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Não avaliado
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm font-extrabold text-success">
                      {typeof cliente.conformidade === "number"
                        ? `${cliente.conformidade}%`
                        : "—"}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <BadgeVencimento venceEm={principal?.venceEm} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
