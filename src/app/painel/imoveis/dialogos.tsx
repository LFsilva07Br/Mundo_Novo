"use client";

import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Pencil, Plus, Sprout } from "lucide-react";
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
  adicionarCaptacao,
  adicionarDocumentoImovel,
  atualizarImovel,
  atualizarTalhao,
  criarImovel,
  criarTalhao,
  lancarSafraTalhao,
  type EstadoAcao,
} from "@/lib/carteira/acoes-imoveis";
import {
  ESTADOS_LAVOURA,
  ROTULO_STATUS_DOCUMENTO,
  ROTULO_TIPO_DOCUMENTO,
  STATUS_DOCUMENTO,
  TIPOS_DOCUMENTO_IMOVEL,
} from "@/lib/carteira/imoveis-esquemas";
import type {
  ImovelDetalhado,
  TalhaoDetalhado,
} from "@/lib/carteira/imoveis-consultas";
import { cn } from "@/lib/utils";

/** Opções mínimas para os seletores dos formulários. */
export type OpcaoImovel = { id: string; nome: string };
export type OpcaoTalhao = { id: string; nome: string; imovelNome: string };

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
// Formulário de imóvel rural (criação e edição)
// ------------------------------------------------------------------

export function FormularioImovel({
  clienteId,
  imovel,
  aoConcluir,
}: {
  clienteId: string;
  imovel?: ImovelDetalhado;
  aoConcluir?: () => void;
}) {
  const idBase = useId();
  const [estado, despachar, pendente] = useActionState<EstadoAcao, FormData>(
    imovel ? atualizarImovel : criarImovel,
    null,
  );
  useFecharAoConcluir(estado, aoConcluir);

  return (
    <form action={despachar} className="space-y-4">
      <input type="hidden" name="clienteId" value={clienteId} />
      {imovel ? <input type="hidden" name="id" value={imovel.id} /> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Nome do imóvel" id={`${idBase}-nome`}>
          <Input
            id={`${idBase}-nome`}
            name="nome"
            defaultValue={imovel?.nome}
            placeholder="Sítio Alto da Serra"
            required
          />
        </Campo>
        <Campo rotulo="Proprietários" id={`${idBase}-proprietarios`}>
          <Input
            id={`${idBase}-proprietarios`}
            name="proprietarios"
            defaultValue={imovel?.proprietarios}
            placeholder="Silvio Dutra"
          />
        </Campo>
        <Campo rotulo="Cidade" id={`${idBase}-cidade`}>
          <Input
            id={`${idBase}-cidade`}
            name="cidade"
            defaultValue={imovel?.cidade}
          />
        </Campo>
        <Campo rotulo="UF" id={`${idBase}-uf`}>
          <Input
            id={`${idBase}-uf`}
            name="uf"
            defaultValue={imovel?.uf}
            maxLength={2}
            placeholder="MG"
          />
        </Campo>
        <Campo rotulo="CAR" id={`${idBase}-car`} className="sm:col-span-2">
          <Input
            id={`${idBase}-car`}
            name="car"
            defaultValue={imovel?.car}
            placeholder="MG-3164704-…"
          />
        </Campo>
        <Campo rotulo="Matrículas" id={`${idBase}-matriculas`}>
          <Input
            id={`${idBase}-matriculas`}
            name="matriculas"
            defaultValue={imovel?.matriculas}
            placeholder="37.624 / 40.734"
          />
        </Campo>
        <Campo rotulo="Área total (ha)" id={`${idBase}-areaTotalHa`}>
          <Input
            id={`${idBase}-areaTotalHa`}
            name="areaTotalHa"
            inputMode="decimal"
            defaultValue={numeroParaTexto(imovel?.areaTotalHa)}
            placeholder="24,57"
            required
          />
        </Campo>
        <Campo rotulo="Área de café (ha)" id={`${idBase}-areaCafeHa`}>
          <Input
            id={`${idBase}-areaCafeHa`}
            name="areaCafeHa"
            inputMode="decimal"
            defaultValue={numeroParaTexto(imovel?.areaCafeHa)}
            placeholder="13,47"
          />
        </Campo>
        <Campo rotulo="Área de APP (ha)" id={`${idBase}-areaAppHa`}>
          <Input
            id={`${idBase}-areaAppHa`}
            name="areaAppHa"
            inputMode="decimal"
            defaultValue={numeroParaTexto(imovel?.areaAppHa)}
          />
        </Campo>
        <Campo rotulo="Área de reserva (ha)" id={`${idBase}-areaReservaHa`}>
          <Input
            id={`${idBase}-areaReservaHa`}
            name="areaReservaHa"
            inputMode="decimal"
            defaultValue={numeroParaTexto(imovel?.areaReservaHa)}
          />
        </Campo>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="possuiCaptacaoAgua"
          defaultChecked={imovel?.possuiCaptacaoAgua}
          className="size-4 accent-primary"
        />
        Possui captação de água (outorga / uso insignificante)
      </label>

      <MensagemAcao estado={estado} />

      <Button type="submit" className="w-full" disabled={pendente}>
        {pendente
          ? "Salvando…"
          : imovel
            ? "Salvar alterações"
            : "Cadastrar imóvel"}
      </Button>
    </form>
  );
}

// ------------------------------------------------------------------
// Formulário de talhão (criação e edição)
// ------------------------------------------------------------------

export function FormularioTalhao({
  clienteId,
  imoveis,
  talhao,
  aoConcluir,
}: {
  clienteId: string;
  imoveis: OpcaoImovel[];
  talhao?: TalhaoDetalhado;
  aoConcluir?: () => void;
}) {
  const idBase = useId();
  const [estado, despachar, pendente] = useActionState<EstadoAcao, FormData>(
    talhao ? atualizarTalhao : criarTalhao,
    null,
  );
  useFecharAoConcluir(estado, aoConcluir);

  return (
    <form action={despachar} className="space-y-4">
      <input type="hidden" name="clienteId" value={clienteId} />
      {talhao ? <input type="hidden" name="id" value={talhao.id} /> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Campo
          rotulo="Imóvel rural"
          id={`${idBase}-imovelId`}
          className="sm:col-span-2"
        >
          <select
            id={`${idBase}-imovelId`}
            name="imovelId"
            defaultValue={talhao?.imovelId ?? ""}
            className={CLASSE_SELECT}
            required
          >
            <option value="" disabled>
              Escolha o imóvel…
            </option>
            {imoveis.map((imovel) => (
              <option key={imovel.id} value={imovel.id}>
                {imovel.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Nome do talhão" id={`${idBase}-nome`}>
          <Input
            id={`${idBase}-nome`}
            name="nome"
            defaultValue={talhao?.nome}
            placeholder="Santa Luzia 1"
            required
          />
        </Campo>
        <Campo rotulo="Área (ha)" id={`${idBase}-areaHa`}>
          <Input
            id={`${idBase}-areaHa`}
            name="areaHa"
            inputMode="decimal"
            defaultValue={numeroParaTexto(talhao?.areaHa)}
            placeholder="5,34"
            required
          />
        </Campo>
        <Campo rotulo="Plantas por hectare" id={`${idBase}-plantasPorHa`}>
          <Input
            id={`${idBase}-plantasPorHa`}
            name="plantasPorHa"
            inputMode="numeric"
            defaultValue={talhao?.plantasPorHa}
            placeholder="4081"
          />
        </Campo>
        <Campo rotulo="Espaçamento" id={`${idBase}-espacamento`}>
          <Input
            id={`${idBase}-espacamento`}
            name="espacamento"
            defaultValue={talhao?.espacamento}
            placeholder="3,50 x 0,70"
          />
        </Campo>
        <Campo rotulo="Variedade" id={`${idBase}-variedade`}>
          <Input
            id={`${idBase}-variedade`}
            name="variedade"
            defaultValue={talhao?.variedade}
            placeholder="M. Novo 376-4"
            required
          />
        </Campo>
        <Campo rotulo="Ano de plantio" id={`${idBase}-anoPlantio`}>
          <Input
            id={`${idBase}-anoPlantio`}
            name="anoPlantio"
            inputMode="numeric"
            defaultValue={talhao?.anoPlantio}
            placeholder="2016"
            required
          />
        </Campo>
      </div>

      <MensagemAcao estado={estado} />

      <Button type="submit" className="w-full" disabled={pendente}>
        {pendente
          ? "Salvando…"
          : talhao
            ? "Salvar alterações"
            : "Cadastrar talhão"}
      </Button>
    </form>
  );
}

// ------------------------------------------------------------------
// Formulário de lançamento por safra
// ------------------------------------------------------------------

export function FormularioLancamentoSafra({
  clienteId,
  talhoes,
  safras,
  safraPadrao,
  aoConcluir,
}: {
  clienteId: string;
  talhoes: OpcaoTalhao[];
  safras: string[];
  safraPadrao?: string;
  aoConcluir?: () => void;
}) {
  const idBase = useId();
  const [estado, despachar, pendente] = useActionState<EstadoAcao, FormData>(
    lancarSafraTalhao,
    null,
  );
  useFecharAoConcluir(estado, aoConcluir);

  return (
    <form action={despachar} className="space-y-4">
      <input type="hidden" name="clienteId" value={clienteId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Campo
          rotulo="Talhão"
          id={`${idBase}-talhaoId`}
          className="sm:col-span-2"
        >
          <select
            id={`${idBase}-talhaoId`}
            name="talhaoId"
            defaultValue=""
            className={CLASSE_SELECT}
            required
          >
            <option value="" disabled>
              Escolha o talhão…
            </option>
            {talhoes.map((talhao) => (
              <option key={talhao.id} value={talhao.id}>
                {talhao.nome} — {talhao.imovelNome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Safra" id={`${idBase}-safra`}>
          <select
            id={`${idBase}-safra`}
            name="safra"
            defaultValue={safraPadrao ?? safras[safras.length - 1] ?? ""}
            className={CLASSE_SELECT}
            required
          >
            {safras.map((rotulo) => (
              <option key={rotulo} value={rotulo}>
                {rotulo}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Estado da lavoura" id={`${idBase}-estadoLavoura`}>
          <select
            id={`${idBase}-estadoLavoura`}
            name="estadoLavoura"
            defaultValue=""
            className={CLASSE_SELECT}
          >
            <option value="">Não informar</option>
            {ESTADOS_LAVOURA.map((estadoLavoura) => (
              <option key={estadoLavoura} value={estadoLavoura}>
                {estadoLavoura}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Previsão (sacas)" id={`${idBase}-previsaoSacas`}>
          <Input
            id={`${idBase}-previsaoSacas`}
            name="previsaoSacas"
            inputMode="decimal"
            placeholder="373,8"
          />
        </Campo>
        <Campo
          rotulo="Colheita efetiva (sacas)"
          id={`${idBase}-colheitaEfetivaSacas`}
        >
          <Input
            id={`${idBase}-colheitaEfetivaSacas`}
            name="colheitaEfetivaSacas"
            inputMode="decimal"
            placeholder="51"
          />
        </Campo>
        <Campo
          rotulo="Previsão de poda / renovação"
          id={`${idBase}-previsaoPodaRenovacao`}
          className="sm:col-span-2"
        >
          <Input
            id={`${idBase}-previsaoPodaRenovacao`}
            name="previsaoPodaRenovacao"
            placeholder="Poda e esqueletamento"
          />
        </Campo>
      </div>

      <MensagemAcao estado={estado} />

      <Button type="submit" className="w-full" disabled={pendente}>
        {pendente ? "Salvando…" : "Registrar lançamento"}
      </Button>
    </form>
  );
}

// ------------------------------------------------------------------
// Formulário de documento do imóvel
// ------------------------------------------------------------------

export function FormularioDocumento({
  clienteId,
  imoveis,
  imovelId,
  aoConcluir,
}: {
  clienteId: string;
  imoveis: OpcaoImovel[];
  imovelId?: string;
  aoConcluir?: () => void;
}) {
  const idBase = useId();
  const [estado, despachar, pendente] = useActionState<EstadoAcao, FormData>(
    adicionarDocumentoImovel,
    null,
  );
  useFecharAoConcluir(estado, aoConcluir);

  return (
    <form action={despachar} className="space-y-4">
      <input type="hidden" name="clienteId" value={clienteId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Campo
          rotulo="Imóvel rural"
          id={`${idBase}-imovelId`}
          className="sm:col-span-2"
        >
          <select
            id={`${idBase}-imovelId`}
            name="imovelId"
            defaultValue={imovelId ?? ""}
            className={CLASSE_SELECT}
            required
          >
            <option value="" disabled>
              Escolha o imóvel…
            </option>
            {imoveis.map((imovel) => (
              <option key={imovel.id} value={imovel.id}>
                {imovel.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Tipo de documento" id={`${idBase}-tipo`}>
          <select
            id={`${idBase}-tipo`}
            name="tipo"
            defaultValue=""
            className={CLASSE_SELECT}
            required
          >
            <option value="" disabled>
              Escolha o tipo…
            </option>
            {TIPOS_DOCUMENTO_IMOVEL.map((tipo) => (
              <option key={tipo} value={tipo}>
                {ROTULO_TIPO_DOCUMENTO[tipo]}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Identificação" id={`${idBase}-identificacao`}>
          <Input
            id={`${idBase}-identificacao`}
            name="identificacao"
            placeholder="Número / protocolo"
          />
        </Campo>
        <Campo rotulo="Vence em" id={`${idBase}-venceEm`}>
          <Input id={`${idBase}-venceEm`} name="venceEm" type="date" />
        </Campo>
        <Campo rotulo="Status" id={`${idBase}-status`}>
          <select
            id={`${idBase}-status`}
            name="status"
            defaultValue="ok"
            className={CLASSE_SELECT}
          >
            {STATUS_DOCUMENTO.map((status) => (
              <option key={status} value={status}>
                {ROTULO_STATUS_DOCUMENTO[status]}
              </option>
            ))}
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
            placeholder="Ex.: regularização pendente"
          />
        </Campo>
      </div>

      <MensagemAcao estado={estado} />

      <Button type="submit" className="w-full" disabled={pendente}>
        {pendente ? "Salvando…" : "Cadastrar documento"}
      </Button>
    </form>
  );
}

// ------------------------------------------------------------------
// Formulário de captação de água
// ------------------------------------------------------------------

export function FormularioCaptacao({
  clienteId,
  imoveis,
  imovelId,
  aoConcluir,
}: {
  clienteId: string;
  imoveis: OpcaoImovel[];
  imovelId?: string;
  aoConcluir?: () => void;
}) {
  const idBase = useId();
  const [estado, despachar, pendente] = useActionState<EstadoAcao, FormData>(
    adicionarCaptacao,
    null,
  );
  useFecharAoConcluir(estado, aoConcluir);

  return (
    <form action={despachar} className="space-y-4">
      <input type="hidden" name="clienteId" value={clienteId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Campo
          rotulo="Imóvel rural"
          id={`${idBase}-imovelId`}
          className="sm:col-span-2"
        >
          <select
            id={`${idBase}-imovelId`}
            name="imovelId"
            defaultValue={imovelId ?? ""}
            className={CLASSE_SELECT}
            required
          >
            <option value="" disabled>
              Escolha o imóvel…
            </option>
            {imoveis.map((imovel) => (
              <option key={imovel.id} value={imovel.id}>
                {imovel.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo
          rotulo="Tipo de captação"
          id={`${idBase}-tipoCaptacao`}
          className="sm:col-span-2"
        >
          <Input
            id={`${idBase}-tipoCaptacao`}
            name="tipoCaptacao"
            placeholder="Captação de água em surgência (nascente)"
            required
          />
        </Campo>
        <Campo rotulo="Processo" id={`${idBase}-processo`}>
          <Input
            id={`${idBase}-processo`}
            name="processo"
            placeholder="Nº 0000001119/2024"
          />
        </Campo>
        <Campo rotulo="Classificação" id={`${idBase}-classificacao`}>
          <Input
            id={`${idBase}-classificacao`}
            name="classificacao"
            placeholder="Uso insignificante"
          />
        </Campo>
        <Campo rotulo="Vence em" id={`${idBase}-venceEm`}>
          <Input id={`${idBase}-venceEm`} name="venceEm" type="date" />
        </Campo>
        <Campo rotulo="Status" id={`${idBase}-status`}>
          <select
            id={`${idBase}-status`}
            name="status"
            defaultValue="ok"
            className={CLASSE_SELECT}
          >
            {STATUS_DOCUMENTO.map((status) => (
              <option key={status} value={status}>
                {ROTULO_STATUS_DOCUMENTO[status]}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <MensagemAcao estado={estado} />

      <Button type="submit" className="w-full" disabled={pendente}>
        {pendente ? "Salvando…" : "Cadastrar captação"}
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

export function BotaoNovoImovel({ clienteId }: { clienteId: string }) {
  return (
    <DialogoAcao
      titulo="Novo imóvel rural"
      descricao="CAR, matrícula, licenças e outorgas pertencem ao imóvel, não à fazenda."
      botao={
        <DialogTrigger render={<Button size="sm" />}>
          <Plus data-icon="inline-start" />
          Novo imóvel
        </DialogTrigger>
      }
    >
      {(fechar) => <FormularioImovel clienteId={clienteId} aoConcluir={fechar} />}
    </DialogoAcao>
  );
}

export function BotaoEditarImovel({
  clienteId,
  imovel,
}: {
  clienteId: string;
  imovel: ImovelDetalhado;
}) {
  return (
    <DialogoAcao
      titulo={`Editar ${imovel.nome}`}
      descricao="Atualize a ficha do imóvel rural."
      botao={
        <DialogTrigger
          render={<Button variant="ghost" size="icon-sm" />}
          aria-label={`Editar imóvel ${imovel.nome}`}
        >
          <Pencil />
        </DialogTrigger>
      }
    >
      {(fechar) => (
        <FormularioImovel
          clienteId={clienteId}
          imovel={imovel}
          aoConcluir={fechar}
        />
      )}
    </DialogoAcao>
  );
}

export function BotaoNovoTalhao({
  clienteId,
  imoveis,
}: {
  clienteId: string;
  imoveis: OpcaoImovel[];
}) {
  return (
    <DialogoAcao
      titulo="Novo talhão"
      descricao="O talhão pertence a um imóvel rural e carrega a ficha da lavoura."
      botao={
        <DialogTrigger render={<Button size="sm" variant="outline" />}>
          <Plus data-icon="inline-start" />
          Novo talhão
        </DialogTrigger>
      }
    >
      {(fechar) => (
        <FormularioTalhao
          clienteId={clienteId}
          imoveis={imoveis}
          aoConcluir={fechar}
        />
      )}
    </DialogoAcao>
  );
}

export function BotaoEditarTalhao({
  clienteId,
  imoveis,
  talhao,
}: {
  clienteId: string;
  imoveis: OpcaoImovel[];
  talhao: TalhaoDetalhado;
}) {
  return (
    <DialogoAcao
      titulo={`Editar talhão ${talhao.nome}`}
      descricao="Atualize a ficha da lavoura deste talhão."
      botao={
        <DialogTrigger
          render={<Button variant="ghost" size="icon-sm" />}
          aria-label={`Editar talhão ${talhao.nome}`}
        >
          <Pencil />
        </DialogTrigger>
      }
    >
      {(fechar) => (
        <FormularioTalhao
          clienteId={clienteId}
          imoveis={imoveis}
          talhao={talhao}
          aoConcluir={fechar}
        />
      )}
    </DialogoAcao>
  );
}

export function BotaoLancarSafra({
  clienteId,
  talhoes,
  safras,
  safraPadrao,
}: {
  clienteId: string;
  talhoes: OpcaoTalhao[];
  safras: string[];
  safraPadrao?: string;
}) {
  return (
    <DialogoAcao
      titulo="Lançar safra"
      descricao="Previsão × colheita efetiva por talhão — um lançamento por safra (o registro é atualizado se já existir)."
      botao={
        <DialogTrigger render={<Button size="sm" variant="outline" />}>
          <Sprout data-icon="inline-start" />
          Lançar safra
        </DialogTrigger>
      }
    >
      {(fechar) => (
        <FormularioLancamentoSafra
          clienteId={clienteId}
          talhoes={talhoes}
          safras={safras}
          safraPadrao={safraPadrao}
          aoConcluir={fechar}
        />
      )}
    </DialogoAcao>
  );
}

export function BotaoNovoDocumento({
  clienteId,
  imoveis,
  imovelId,
}: {
  clienteId: string;
  imoveis: OpcaoImovel[];
  imovelId?: string;
}) {
  return (
    <DialogoAcao
      titulo="Novo documento do imóvel"
      descricao="CAR, matrícula, licença, ITR e demais documentos com status e vencimento."
      botao={
        <DialogTrigger
          render={<Button variant="ghost" size="sm" />}
          aria-label="Adicionar documento ao imóvel"
        >
          <Plus data-icon="inline-start" />
          Documento
        </DialogTrigger>
      }
    >
      {(fechar) => (
        <FormularioDocumento
          clienteId={clienteId}
          imoveis={imoveis}
          imovelId={imovelId}
          aoConcluir={fechar}
        />
      )}
    </DialogoAcao>
  );
}

export function BotaoNovaCaptacao({
  clienteId,
  imoveis,
  imovelId,
}: {
  clienteId: string;
  imoveis: OpcaoImovel[];
  imovelId?: string;
}) {
  return (
    <DialogoAcao
      titulo="Nova captação de água"
      descricao="Outorgas e usos insignificantes de água por imóvel rural."
      botao={
        <DialogTrigger
          render={<Button variant="ghost" size="sm" />}
          aria-label="Adicionar captação de água ao imóvel"
        >
          <Plus data-icon="inline-start" />
          Captação
        </DialogTrigger>
      }
    >
      {(fechar) => (
        <FormularioCaptacao
          clienteId={clienteId}
          imoveis={imoveis}
          imovelId={imovelId}
          aoConcluir={fechar}
        />
      )}
    </DialogoAcao>
  );
}
