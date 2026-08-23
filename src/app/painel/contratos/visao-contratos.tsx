"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Eye, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { decidirContrato } from "@/lib/certificacao/acoes";
import type {
  ContratoAlcada,
  PerfilAtual,
} from "@/lib/certificacao/consultas";
import { contratoEscalonado } from "@/lib/certificacao/regras";
import { EQUIPE_DEMO } from "@/lib/equipe/dados-demo";
import { formatarData } from "@/lib/vencimentos";

const ROTULO_TIPO: Record<ContratoAlcada["tipo"], string> = {
  fazenda: "Fazenda",
  cadeia_suprimentos: "Cadeia de Suprimentos",
};

type Props = {
  contratos: ContratoAlcada[];
  perfil: PerfilAtual | null;
  modoDemo: boolean;
};

export function VisaoContratos({ contratos, perfil, modoDemo }: Props) {
  // Estado local usado apenas no modo demonstração (simulação sem gravar);
  // conectado ao banco, a revalidação do servidor atualiza as props.
  const [contratosLocais, setContratosLocais] = useState(contratos);
  const [usuarioDemoId, setUsuarioDemoId] = useState(EQUIPE_DEMO[0].id);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciarTransicao] = useTransition();

  const contratosExibidos = modoDemo ? contratosLocais : contratos;

  const usuarioDemo = EQUIPE_DEMO.find((m) => m.id === usuarioDemoId)!;
  const temAlcada = modoDemo
    ? usuarioDemo.alcadaAprovacao
    : (perfil?.alcadaAprovacao ?? false);
  const nomeSemAlcada = modoDemo
    ? usuarioDemo.nome.split(" ")[0]
    : (perfil?.nome.split(" ")[0] ?? null);

  function decidir(contrato: ContratoAlcada, decisao: "aprovado" | "rejeitado") {
    setErro(null);

    if (modoDemo) {
      // Demonstração: simula a decisão localmente, nada é gravado.
      setContratosLocais((atuais) =>
        atuais.map((c) =>
          c.id === contrato.id
            ? {
                ...c,
                status: decisao,
                decididoPor: `${usuarioDemo.nome} (simulação)`,
                decididoEm: new Date().toISOString(),
                diasParado: 0,
              }
            : c,
        ),
      );
      return;
    }

    iniciarTransicao(async () => {
      const resultado = await decidirContrato(contrato.id, decisao);
      if (!resultado.ok) setErro(resultado.erro);
    });
  }

  const aguardando = contratosExibidos.filter(
    (c) => c.status === "aguardando_alcada",
  );
  const decididos = contratosExibidos
    .filter((c) => c.status !== "aguardando_alcada")
    .sort((a, b) => (b.decididoEm ?? "").localeCompare(a.decididoEm ?? ""));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Administração
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Contratos & Alçada de aprovação
          </h1>
        </div>

        {modoDemo ? (
          <label className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm font-semibold">
            <Eye className="size-4 text-muted-foreground" />
            Ver como:
            <select
              className="bg-transparent font-bold outline-none"
              value={usuarioDemoId}
              onChange={(e) => setUsuarioDemoId(e.target.value)}
            >
              {EQUIPE_DEMO.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome} {m.alcadaAprovacao ? "· com alçada" : "· sem alçada"}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="rounded-xl bg-muted px-3 py-2 text-sm font-semibold">
            {perfil
              ? `${perfil.nome} · ${temAlcada ? "com alçada" : "sem alçada"}`
              : "Entre no sistema para decidir contratos"}
          </p>
        )}
      </div>

      {erro ? (
        <p className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          {erro}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Aguardando alçada de aprovação</CardTitle>
          <CardDescription>
            A aprovação libera o cadastro do cliente. Contratos parados há mais
            de 10 dias disparam escalonamento automático à diretoria.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {aguardando.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum contrato aguardando decisão. 🎉
            </p>
          ) : null}
          {aguardando.map((contrato) => (
            <div
              key={contrato.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
            >
              <div>
                <p className="flex flex-wrap items-center gap-2 font-bold">
                  {contrato.codigo} — {contrato.clienteNome}
                  <Badge variant="outline">{ROTULO_TIPO[contrato.tipo]}</Badge>
                </p>
                <p className="text-sm text-muted-foreground">
                  Solicitado
                  {contrato.solicitadoPor
                    ? ` por ${contrato.solicitadoPor}`
                    : null}{" "}
                  em {formatarData(new Date(`${contrato.solicitadoEm}T12:00:00`))}
                </p>
                {contratoEscalonado(contrato.diasParado) ? (
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-warning">
                    <AlertTriangle className="size-3.5" />
                    Parado há {contrato.diasParado} dias — escalonamento
                    disparado ({">"} 10 dias)
                  </p>
                ) : null}
              </div>

              {temAlcada ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={pendente}
                    onClick={() => decidir(contrato, "aprovado")}
                  >
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pendente}
                    onClick={() => decidir(contrato, "rejeitado")}
                  >
                    Rejeitar
                  </Button>
                </div>
              ) : (
                <p className="text-xs font-semibold text-muted-foreground">
                  Somente leitura —{" "}
                  {nomeSemAlcada
                    ? `${nomeSemAlcada} não possui alçada`
                    : "sem alçada"}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {decididos.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Decididos</CardTitle>
            <CardDescription>
              Toda decisão fica registrada com quem decidiu e quando.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {decididos.map((contrato) => (
              <div
                key={contrato.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
              >
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-bold">
                    {contrato.codigo} — {contrato.clienteNome}
                    <Badge variant="outline">{ROTULO_TIPO[contrato.tipo]}</Badge>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {contrato.status === "aprovado" ? "Aprovado" : "Rejeitado"}
                    {contrato.decididoPor ? ` por ${contrato.decididoPor}` : null}
                    {contrato.decididoEm
                      ? ` em ${formatarData(new Date(contrato.decididoEm))}`
                      : null}
                  </p>
                </div>
                {contrato.status === "aprovado" ? (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="size-3.5" /> Aprovado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-destructive">
                    <XCircle className="size-3.5" /> Rejeitado
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <p className="text-sm text-muted-foreground">
        {modoDemo
          ? "Use o seletor “Ver como” para conferir a regra na prática: sem a permissão de alçada, os botões Aprovar/Rejeitar não aparecem. As decisões aqui são simulações — nada é gravado."
          : "Alçada é permissão, não etapa: sem a flag, os botões não aparecem e o servidor recusa a decisão mesmo que alguém tente por fora da tela."}
      </p>
    </div>
  );
}
