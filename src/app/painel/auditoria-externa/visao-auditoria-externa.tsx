"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, ClipboardCheck, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BadgeVencimento } from "@/components/badge-vencimento";
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
import { registrarAchado } from "@/lib/auditoria-externa/acoes";
import type { AchadoExterno } from "@/lib/auditoria-externa/consultas";
import {
  CERTIFICADORA_PADRAO,
  compararComInterna,
  contarPrazos,
  ROTULO_SEVERIDADE_ACHADO,
  ROTULO_STATUS_ACHADO,
  sugerirPrazo,
} from "@/lib/auditoria-externa/regras";
import type { DadosAchado } from "@/lib/auditoria-externa/validacao";
import { ITENS_CHECKLIST_RA } from "@/lib/certificacao/dados-demo";
import { formatarData } from "@/lib/vencimentos";
import { cn } from "@/lib/utils";

const COR_SEVERIDADE: Record<AchadoExterno["severidade"], string> = {
  critica: "bg-destructive/10 text-destructive",
  maior: "bg-destructive/10 text-destructive",
  menor: "bg-warning/10 text-warning",
};

type ClienteOpcao = { id: string; nome: string };

type Props = {
  achados: AchadoExterno[];
  clientes: ClienteOpcao[];
  modoDemo: boolean;
};

function hojeIso(): string {
  const hoje = new Date();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${hoje.getFullYear()}-${mes}-${dia}`;
}

export function VisaoAuditoriaExterna({ achados, clientes, modoDemo }: Props) {
  // Estado local usado apenas no modo demonstração (simulação sem gravar);
  // conectado ao banco, a revalidação do servidor atualiza as props.
  const [achadosLocais, setAchadosLocais] = useState(achados);
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [pendente, iniciarTransicao] = useTransition();

  const todos = modoDemo ? achadosLocais : achados;

  const exibidos = useMemo(
    () =>
      todos.filter(
        (a) =>
          (filtroCliente === "" || a.clienteId === filtroCliente) &&
          (filtroStatus === "" || a.status === filtroStatus),
      ),
    [todos, filtroCliente, filtroStatus],
  );

  const prazos = useMemo(() => contarPrazos(todos), [todos]);
  const comparativo = useMemo(() => compararComInterna(todos), [todos]);

  const clientesComAchado = useMemo(() => {
    const vistos = new Map<string, string>();
    for (const a of todos) vistos.set(a.clienteId, a.cliente);
    return [...vistos.entries()].map(([id, nome]) => ({ id, nome }));
  }, [todos]);

  function aoRegistrar(dados: DadosAchado) {
    setErro(null);
    if (modoDemo) {
      const cliente = clientes.find((c) => c.id === dados.clienteId);
      setAchadosLocais((atuais) => [
        {
          id: `demo-achado-${atuais.length + 1}`,
          clienteId: dados.clienteId,
          cliente: cliente?.nome ?? "Cliente",
          certificadora: dados.certificadora ?? CERTIFICADORA_PADRAO,
          codigo: dados.codigo,
          itemNorma: dados.itemNorma || null,
          descricao: dados.descricao,
          severidade: dados.severidade,
          prazo: dados.prazo,
          status: "aberta" as const,
          capaId: dados.criarCapa ? `demo-capa-${atuais.length + 1}` : null,
          capaNumero: dados.criarCapa ? 132 + atuais.length : null,
          capaStatus: dados.criarCapa ? ("aberta" as const) : null,
          encontradoEm: dados.encontradoEm,
        },
        ...atuais,
      ]);
      setDialogoAberto(false);
      return;
    }
    iniciarTransicao(async () => {
      const resultado = await registrarAchado(dados);
      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }
      setDialogoAberto(false);
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Certificadora
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Auditoria externa — achados
          </h1>
        </div>
        <DialogoNovoAchado
          aberto={dialogoAberto}
          aoMudarAberto={setDialogoAberto}
          clientes={clientes}
          aoRegistrar={aoRegistrar}
          pendente={pendente}
        />
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-secondary/60 p-4">
        <ClipboardCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <p className="text-sm font-semibold text-secondary-foreground">
          Regra do sistema: achado com CAPA interna vinculada só fecha quando a
          CAPA estiver fechada. A certificadora costuma dar ~10 semanas de
          prazo — o sistema já sugere a data.
        </p>
      </div>

      {erro ? (
        <p className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          {erro}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">{prazos.abertos}</p>
            <p className="text-xs font-semibold text-muted-foreground">
              achados em aberto
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">
              {prazos.noPrazo}
              <span className="text-muted-foreground"> / </span>
              <span className={prazos.estourados > 0 ? "text-destructive" : ""}>
                {prazos.estourados}
              </span>
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              no prazo / estourados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xl font-extrabold">
              {comparativo.percentualPegoInternamente}%
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              pego internamente antes ({comparativo.pegosSoPelaExterna} só pela
              externa)
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Achados da certificadora</CardTitle>
          <CardDescription>
            Achado sem CAPA vinculada é o que a auditoria interna não pegou —
            use o indicador para calibrar os checklists internos.
          </CardDescription>
          <div className="flex flex-wrap gap-3 pt-2">
            <div className="w-56 space-y-1">
              <Label htmlFor="filtro-cliente">Cliente</Label>
              <SelectNativo
                id="filtro-cliente"
                value={filtroCliente}
                onChange={(e) => setFiltroCliente(e.target.value)}
              >
                <option value="">Todos os clientes</option>
                {clientesComAchado.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </SelectNativo>
            </div>
            <div className="w-56 space-y-1">
              <Label htmlFor="filtro-status">Status</Label>
              <SelectNativo
                id="filtro-status"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <option value="">Todos os status</option>
                <option value="aberta">Aberto</option>
                <option value="em_correcao">Em correção</option>
                <option value="aguardando_evidencia">
                  Aguardando evidência
                </option>
                <option value="fechada">Fechado</option>
              </SelectNativo>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Item da norma</TableHead>
                <TableHead>Sev.</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>CAPA vinculada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exibidos.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    Nenhum achado com os filtros escolhidos.
                  </TableCell>
                </TableRow>
              ) : (
                exibidos.map((achado) => (
                  <TableRow key={achado.id}>
                    <TableCell>
                      <p className="font-semibold">{achado.codigo ?? "—"}</p>
                      <p className="max-w-64 text-xs text-muted-foreground">
                        {achado.descricao}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">{achado.cliente}</TableCell>
                    <TableCell className="text-sm">
                      {achado.itemNorma ?? "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-lg px-2 py-0.5 text-xs font-bold",
                          COR_SEVERIDADE[achado.severidade],
                        )}
                      >
                        {ROTULO_SEVERIDADE_ACHADO[achado.severidade]}
                      </span>
                    </TableCell>
                    <TableCell>
                      {achado.status === "fechada" ? (
                        <span className="text-sm text-muted-foreground">
                          {achado.prazo
                            ? formatarData(new Date(`${achado.prazo}T12:00:00`))
                            : "—"}
                        </span>
                      ) : (
                        <BadgeVencimento venceEm={achado.prazo ?? undefined} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          achado.status === "fechada" ? "secondary" : "outline"
                        }
                      >
                        {ROTULO_STATUS_ACHADO[achado.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {achado.capaNumero !== null ? (
                        <Link
                          href="/painel/capas"
                          className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
                        >
                          CAPA #{achado.capaNumero}
                        </Link>
                      ) : (
                        <span className="text-xs font-semibold text-warning">
                          Só pela externa
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
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
  aoRegistrar: (dados: DadosAchado) => void;
  pendente: boolean;
};

function DialogoNovoAchado({
  aberto,
  aoMudarAberto,
  clientes,
  aoRegistrar,
  pendente,
}: PropsDialogo) {
  const [encontradoEm, setEncontradoEm] = useState(hojeIso());
  const [prazo, setPrazo] = useState(sugerirPrazo(hojeIso()));
  const [criarCapa, setCriarCapa] = useState(false);

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAberto}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            Registrar achado
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar achado da certificadora</DialogTitle>
          <DialogDescription>
            A certificadora costuma dar ~10 semanas para a correção — o prazo
            já vem sugerido com +70 dias da data do achado.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const dados = new FormData(e.currentTarget);
            aoRegistrar({
              clienteId: String(dados.get("clienteId") ?? ""),
              certificadora: String(
                dados.get("certificadora") ?? CERTIFICADORA_PADRAO,
              ),
              codigo: String(dados.get("codigo") ?? ""),
              itemNorma: String(dados.get("itemNorma") ?? ""),
              descricao: String(dados.get("descricao") ?? ""),
              severidade: String(
                dados.get("severidade") ?? "menor",
              ) as DadosAchado["severidade"],
              encontradoEm: String(dados.get("encontradoEm") ?? ""),
              prazo: String(dados.get("prazo") ?? ""),
              criarCapa,
              responsavelCapa: String(dados.get("responsavelCapa") ?? ""),
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="achado-cliente">Cliente</Label>
            <SelectNativo
              id="achado-cliente"
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
              <Label htmlFor="achado-certificadora">Certificadora</Label>
              <Input
                id="achado-certificadora"
                name="certificadora"
                required
                defaultValue={CERTIFICADORA_PADRAO}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="achado-codigo">Código do achado</Label>
              <Input
                id="achado-codigo"
                name="codigo"
                required
                placeholder="Ex.: NC-2026-042"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="achado-item">Item da norma</Label>
              <SelectNativo id="achado-item" name="itemNorma">
                <option value="">Sem item específico</option>
                {ITENS_CHECKLIST_RA.map((item) => (
                  <option key={item.codigo} value={item.codigo}>
                    {item.codigo} · {item.capitulo}
                  </option>
                ))}
              </SelectNativo>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="achado-severidade">Severidade</Label>
              <SelectNativo
                id="achado-severidade"
                name="severidade"
                required
                defaultValue="menor"
              >
                <option value="menor">Menor</option>
                <option value="maior">Maior</option>
                <option value="critica">Crítica</option>
              </SelectNativo>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="achado-descricao">Descrição do achado</Label>
            <Input
              id="achado-descricao"
              name="descricao"
              required
              minLength={10}
              placeholder="O que a certificadora encontrou?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="achado-encontrado">Data do achado</Label>
              <Input
                id="achado-encontrado"
                name="encontradoEm"
                type="date"
                required
                value={encontradoEm}
                onChange={(e) => {
                  setEncontradoEm(e.target.value);
                  if (e.target.value) setPrazo(sugerirPrazo(e.target.value));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="achado-prazo">Prazo (sugerido +70 dias)</Label>
              <Input
                id="achado-prazo"
                name="prazo"
                type="date"
                required
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2 rounded-xl border border-input p-3">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={criarCapa}
                onChange={(e) => setCriarCapa(e.target.checked)}
              />
              Criar CAPA interna vinculada
            </label>
            {criarCapa ? (
              <div className="space-y-1.5">
                <Label htmlFor="achado-responsavel">
                  Responsável pelo plano de ação
                </Label>
                <Input
                  id="achado-responsavel"
                  name="responsavelCapa"
                  required
                  minLength={3}
                  placeholder="Quem corrige"
                />
              </div>
            ) : null}
          </div>
          <DialogFooter className="mt-2">
            <Button type="submit" disabled={pendente}>
              Registrar achado
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
