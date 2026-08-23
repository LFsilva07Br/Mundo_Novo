import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarClock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listarImoveisDoCliente,
  listarTalhoes,
} from "@/lib/carteira/imoveis-consultas";
import { proximaVisitaAgendada } from "@/lib/portal/consultas";
import { perfilPortal } from "@/lib/portal/sessao";
import { formatarArea, formatarData } from "@/lib/vencimentos";

export const metadata: Metadata = {
  title: "Minha fazenda",
};

export default async function PaginaMinhaFazenda() {
  const perfil = await perfilPortal();
  if (!perfil) redirect("/painel");

  const [imoveis, panorama, proximaVisita] = await Promise.all([
    listarImoveisDoCliente(perfil.clienteId),
    listarTalhoes(perfil.clienteId),
    proximaVisitaAgendada(perfil.clienteId),
  ]);

  const somar = (valores: number[]) => valores.reduce((s, v) => s + v, 0);
  const areas = [
    { rotulo: "área total", valor: somar(imoveis.map((i) => i.areaTotalHa)) },
    { rotulo: "área de café", valor: somar(imoveis.map((i) => i.areaCafeHa)) },
    { rotulo: "área de APP", valor: somar(imoveis.map((i) => i.areaAppHa)) },
    {
      rotulo: "reserva legal",
      valor: somar(imoveis.map((i) => i.areaReservaHa)),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Minha fazenda</h2>
        <p className="mt-1 text-base text-muted-foreground">
          As áreas e os talhões da sua fazenda, do jeito que estão no cadastro
          da consultoria.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {areas.map((area) => (
          <Card key={area.rotulo}>
            <CardContent className="py-4">
              <p className="text-xl font-extrabold">
                {formatarArea(area.valor)}
              </p>
              <p className="text-xs font-semibold text-muted-foreground">
                {area.rotulo}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarClock className="size-5 text-primary" />
            Próxima visita
          </CardTitle>
        </CardHeader>
        <CardContent>
          {proximaVisita ? (
            <div className="text-base leading-relaxed">
              <p className="font-bold">{proximaVisita.titulo}</p>
              {proximaVisita.detalhe ? (
                <p className="text-muted-foreground">{proximaVisita.detalhe}</p>
              ) : null}
              {proximaVisita.venceEm ? (
                <p className="mt-1 font-semibold text-primary">
                  {formatarData(new Date(`${proximaVisita.venceEm}T12:00:00`))}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-base text-muted-foreground">
              Nenhuma visita agendada por enquanto — o consultor avisa quando
              marcar a próxima.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Talhões de café</CardTitle>
          <CardDescription className="text-sm">
            Resumo dos talhões cadastrados, com área e variedade.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {panorama.talhoes.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Talhão</TableHead>
                  <TableHead>Imóvel</TableHead>
                  <TableHead className="text-right">Área</TableHead>
                  <TableHead>Variedade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {panorama.talhoes.map((talhao) => (
                  <TableRow key={talhao.id}>
                    <TableCell className="text-base font-semibold">
                      {talhao.nome}
                    </TableCell>
                    <TableCell className="max-w-44 truncate text-sm">
                      {talhao.imovelNome}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatarArea(talhao.areaHa)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {talhao.variedade ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-base text-muted-foreground">
              Os talhões da sua fazenda aparecerão aqui assim que forem
              cadastrados pela equipe.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
