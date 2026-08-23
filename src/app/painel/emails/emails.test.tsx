import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { VisaoEmails, type EnvioEmailLinha } from "./visao-emails";

afterEach(cleanup);

const ENVIOS: EnvioEmailLinha[] = [
  {
    id: "1",
    criado_em: "2026-08-17T09:00:00Z",
    destinatario: "maria@fazenda.com",
    assunto: "Certificado vence em 30 dias — Fazenda Alto da Serra",
    origem: "gatilho",
    status: "enviado",
    erro: null,
  },
  {
    id: "2",
    criado_em: "2026-08-17T09:00:05Z",
    destinatario: "gestor@mn.br",
    assunto: "Resumo semanal da carteira — semana de 2026-08-17",
    origem: "resumo-semanal",
    status: "pendente",
    erro: "SMTP não configurado",
  },
  {
    id: "3",
    criado_em: "2026-08-18T09:00:00Z",
    destinatario: "jose@fazenda.com",
    assunto: "Outorga/captação a vencer — Sítio Boa Vista",
    origem: "gatilho",
    status: "falha",
    erro: "credenciais recusadas",
  },
];

describe("Página E-mails enviados", () => {
  it("lista os envios com destinatário, origem traduzida, status e erro", () => {
    render(<VisaoEmails envios={ENVIOS} modoDemo={false} />);

    expect(screen.getByText("maria@fazenda.com")).toBeInTheDocument();
    expect(screen.getByText("gestor@mn.br")).toBeInTheDocument();
    expect(screen.getAllByText("Alerta de vencimento")).toHaveLength(2);
    expect(screen.getByText("Resumo semanal")).toBeInTheDocument();
    expect(screen.getByText("Enviado")).toBeInTheDocument();
    expect(screen.getByText("Pendente")).toBeInTheDocument();
    expect(screen.getByText("Falha")).toBeInTheDocument();
    expect(screen.getByText("SMTP não configurado")).toBeInTheDocument();
    expect(screen.getByText("credenciais recusadas")).toBeInTheDocument();
  });

  it("sem registros, mostra o aviso de lista vazia", () => {
    render(<VisaoEmails envios={[]} modoDemo={false} />);
    expect(
      screen.getByText(/Nenhum e-mail registrado ainda/),
    ).toBeInTheDocument();
  });

  it("mostra o guia de configuração gratuita com as 5 variáveis", () => {
    render(<VisaoEmails envios={[]} modoDemo={true} />);

    expect(
      screen.getByText("Como configurar o envio gratuito"),
    ).toBeInTheDocument();
    for (const variavel of [
      "SMTP_HOST",
      "SMTP_PORT",
      "SMTP_USER",
      "SMTP_PASS",
      "SMTP_FROM",
    ]) {
      expect(screen.getByText(variavel)).toBeInTheDocument();
    }
    expect(screen.getAllByText(/Senhas de app/).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Modo demonstração — sem banco conectado/),
    ).toBeInTheDocument();
  });
});
