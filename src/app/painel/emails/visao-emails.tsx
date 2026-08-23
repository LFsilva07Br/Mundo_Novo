import { Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { EstadoVazio } from "@/components/estado-vazio";

/**
 * Histórico dos e-mails automáticos (tabela envios_email) + guia de
 * configuração do envio gratuito por SMTP (Gmail com senha de app).
 * Componente de apresentação puro — a página busca os dados.
 */

export type EnvioEmailLinha = {
  id: string;
  criado_em: string | null;
  destinatario: string;
  assunto: string;
  origem: string;
  status: string;
  erro: string | null;
};

const ROTULO_STATUS: Record<string, string> = {
  pendente: "Pendente",
  enviado: "Enviado",
  falha: "Falha",
};

const VARIANTE_STATUS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pendente: "secondary",
  enviado: "default",
  falha: "destructive",
};

const ROTULO_ORIGEM: Record<string, string> = {
  gatilho: "Alerta de vencimento",
  "resumo-semanal": "Resumo semanal",
};

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const VARIAVEIS_SMTP: { nome: string; descricao: string }[] = [
  { nome: "SMTP_HOST", descricao: "servidor de envio — no Gmail: smtp.gmail.com" },
  { nome: "SMTP_PORT", descricao: "porta de envio — 587 (padrão do sistema)" },
  { nome: "SMTP_USER", descricao: "e-mail da conta que envia (ex.: alertas@mundonovo…)" },
  { nome: "SMTP_PASS", descricao: "senha de app gerada no Google (não é a senha normal)" },
  { nome: "SMTP_FROM", descricao: "remetente exibido (opcional — se vazio, usa o SMTP_USER)" },
];

export function VisaoEmails({
  envios,
  modoDemo,
}: {
  envios: EnvioEmailLinha[];
  modoDemo: boolean;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Automação
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            E-mails enviados
          </h1>
        </div>
        {modoDemo ? (
          <Badge variant="outline">Modo demonstração — sem banco conectado</Badge>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos envios</CardTitle>
          <CardDescription>
            Todo e-mail automático (alertas de vencimento e resumo semanal)
            fica registrado aqui, mesmo quando o envio falha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {envios.length === 0 ? (
            <EstadoVazio
              icone={Mail}
              titulo="Nenhum e-mail registrado ainda."
              descricao="Os registros aparecem quando os alertas automáticos começarem a disparar."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {envios.map((envio) => (
                  <TableRow key={envio.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatarData(envio.criado_em)}
                    </TableCell>
                    <TableCell>{envio.destinatario}</TableCell>
                    <TableCell className="max-w-[280px] truncate">
                      {envio.assunto}
                    </TableCell>
                    <TableCell>
                      {ROTULO_ORIGEM[envio.origem] ?? envio.origem}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={VARIANTE_STATUS[envio.status] ?? "outline"}
                      >
                        {ROTULO_STATUS[envio.status] ?? envio.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-muted-foreground">
                      {envio.erro ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como configurar o envio gratuito</CardTitle>
          <CardDescription>
            O sistema envia por SMTP — funciona com qualquer provedor; o
            caminho gratuito recomendado é uma conta do Gmail com senha de app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Crie (ou escolha) uma conta do Gmail que será a remetente dos
              avisos — ex.: uma conta só para o sistema.
            </li>
            <li>
              Nessa conta, ative a <strong>verificação em duas etapas</strong>{" "}
              em <em>Conta Google → Segurança</em>.
            </li>
            <li>
              Ainda em Segurança, procure por <strong>Senhas de app</strong> e
              gere uma senha nova (nome sugerido: “Mundo Novo Café”). O Google
              mostra um código de 16 letras — copie esse código.
            </li>
            <li>
              No painel da Vercel (projeto → Settings → Environment Variables),
              cadastre as 5 variáveis abaixo e faça um novo deploy.
            </li>
            <li>
              Pronto: os próximos alertas saem por e-mail e aparecem nesta tela
              como “Enviado”. Envios anteriores ficam como “Pendente” com o
              aviso “SMTP não configurado”.
            </li>
          </ol>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variável</TableHead>
                  <TableHead>O que colocar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {VARIAVEIS_SMTP.map((v) => (
                  <TableRow key={v.nome}>
                    <TableCell className="font-mono text-xs">{v.nome}</TableCell>
                    <TableCell>{v.descricao}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground">
            O Gmail gratuito comporta o volume do sistema (limite do Google:
            centenas de mensagens por dia). A senha de app pode ser revogada a
            qualquer momento em Conta Google → Segurança → Senhas de app.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
