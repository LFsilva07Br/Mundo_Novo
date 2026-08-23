"use client";

import { useCallback, useEffect, useState } from "react";
import { Fingerprint, HardDrive, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { limparVisitasSincronizadas } from "@/lib/campo/banco-local";
import {
  biometriaAtivada,
  biometriaDisponivel,
  desativarBiometria,
  marcarDesbloqueado,
  registrarBiometria,
} from "@/lib/campo/biometria";
import { formatarBytes } from "@/lib/campo/regras";

/**
 * Ajustes do aparelho: trava por biometria (opcional, local) e manutenção
 * do espaço usado pelo app no aparelho.
 */

type EspacoAparelho = { usado: number; total: number };

/** Estimativa do espaço usado pelo app (quando o navegador informa). */
async function estimarEspaco(): Promise<EspacoAparelho | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    return null;
  }
  try {
    const estimativa = await navigator.storage.estimate();
    return { usado: estimativa.usage ?? 0, total: estimativa.quota ?? 0 };
  } catch {
    return null;
  }
}

export default function PaginaAjustesCampo() {
  const [disponivel, setDisponivel] = useState<boolean | null>(null);
  const [ativada, setAtivada] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [espaco, setEspaco] = useState<EspacoAparelho | null>(null);
  const [limpando, setLimpando] = useState(false);

  const carregar = useCallback(
    () =>
      Promise.all([biometriaDisponivel(), biometriaAtivada(), estimarEspaco()]).then(
        ([suporte, estado, estimativa]) => {
          setDisponivel(suporte);
          setAtivada(estado);
          setEspaco(estimativa);
        },
      ),
    [],
  );

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function alternarBiometria() {
    setProcessando(true);
    try {
      if (ativada) {
        await desativarBiometria();
        setAtivada(false);
        toast.success("Desbloqueio por biometria desativado.");
      } else {
        await registrarBiometria();
        // Quem acabou de registrar já provou que é a própria pessoa.
        marcarDesbloqueado();
        setAtivada(true);
        toast.success(
          "Biometria ativada! Na próxima abertura, o app pedirá sua digital ou rosto.",
        );
      }
    } catch (excecao) {
      toast.error(
        excecao instanceof Error
          ? excecao.message
          : "Não foi possível alterar a biometria.",
      );
    } finally {
      setProcessando(false);
    }
  }

  async function limparAgora() {
    setLimpando(true);
    try {
      const removidas = await limparVisitasSincronizadas(0);
      toast.success(
        removidas === 0
          ? "Nada para limpar — nenhuma visita sincronizada no aparelho."
          : `${removidas} visita${removidas === 1 ? "" : "s"} sincronizada${removidas === 1 ? "" : "s"} removida${removidas === 1 ? "" : "s"} do aparelho.`,
      );
      await carregar();
    } catch {
      toast.error("Não foi possível limpar as visitas. Tente de novo.");
    } finally {
      setLimpando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Ajustes</h1>
        <p className="text-sm text-muted-foreground">
          Preferências deste aparelho — nada aqui altera seus dados no
          escritório.
        </p>
      </div>

      <Card className="rounded-3xl">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <Fingerprint className="size-4 text-primary" />
            <h2 className="text-sm font-extrabold">Desbloqueio por biometria</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Peça a digital ou o rosto ao abrir o app. É só uma trava do
            aparelho — sua senha continua valendo normalmente.
          </p>
          {disponivel === false ? (
            <p className="text-sm font-semibold text-warning">
              Este aparelho ou navegador não oferece biometria. Você pode
              continuar usando o app com a sua senha.
            </p>
          ) : (
            <Button
              onClick={alternarBiometria}
              disabled={processando || disponivel === null}
              variant={ativada ? "outline" : "default"}
              className="w-full gap-2"
            >
              <Fingerprint className="size-4" />
              {processando
                ? "Aguarde…"
                : ativada
                  ? "Desativar biometria"
                  : "Ativar biometria"}
            </Button>
          )}
          {ativada ? (
            <p className="text-xs font-semibold text-primary">
              Biometria ativada neste aparelho.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <HardDrive className="size-4 text-primary" />
            <h2 className="text-sm font-extrabold">Espaço no aparelho</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {espaco
              ? `O app usa ${formatarBytes(espaco.usado)} de ${formatarBytes(espaco.total)} disponíveis.`
              : "Estimativa de espaço indisponível neste navegador."}
          </p>
          <p className="text-sm text-muted-foreground">
            Visitas já enviadas ao escritório são apagadas do aparelho
            automaticamente após 30 dias. Se precisar de espaço agora:
          </p>
          <Button
            onClick={limparAgora}
            disabled={limpando}
            variant="outline"
            className="w-full gap-2"
          >
            <Trash2 className="size-4" />
            {limpando ? "Limpando…" : "Limpar visitas já sincronizadas"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
