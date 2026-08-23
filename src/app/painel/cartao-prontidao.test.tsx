import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CartaoProntidao, destinoDaPendencia } from "./cartao-prontidao";
import PaginaDashboard from "./page";
import type { ProntidaoCliente } from "@/lib/prontidao/consultas";

const CARTEIRA: ProntidaoCliente[] = [
  {
    clienteId: "cliente-a",
    clienteNome: "Fazenda Exemplo A",
    conformidade: 90,
    pronta: true,
    nota: 100,
    pendencias: [],
  },
  {
    clienteId: "cliente-b",
    clienteNome: "Fazenda Exemplo B",
    conformidade: 70,
    pronta: false,
    nota: 35,
    pendencias: [
      "Certificação Rainforest Alliance vencida em 14 de ago. de 2026",
      "CAPA MAIOR em aberto: depósito sem sinalização",
      "Sem auditoria interna concluída nos últimos 12 meses",
    ],
  },
];

describe("CartaoProntidao", () => {
  it("mostra o semáforo da carteira: prontas × com pendências", () => {
    render(<CartaoProntidao carteira={CARTEIRA} />);

    expect(screen.getByText("Prontidão para auditoria")).toBeInTheDocument();
    expect(screen.getByText("1 pronta(s)")).toBeInTheDocument();
    expect(screen.getByText("1 com pendências")).toBeInTheDocument();
  });

  it("diz QUAIS fazendas estão prontas, com a nota, e leva à ficha", () => {
    render(<CartaoProntidao carteira={CARTEIRA} />);

    expect(
      screen.getByText("Prontas para a auditoria externa"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Fazenda Exemplo A" }),
    ).toHaveAttribute("href", "/painel/clientes/cliente-a");
    expect(screen.getByText("nota 100")).toBeInTheDocument();
  });

  it("esconde o bloco de prontas quando não há nenhuma", () => {
    render(<CartaoProntidao carteira={[CARTEIRA[1]]} />);
    expect(
      screen.queryByText("Prontas para a auditoria externa"),
    ).not.toBeInTheDocument();
  });

  it("lista o cliente não pronto com as 2 principais pendências", () => {
    render(<CartaoProntidao carteira={CARTEIRA} />);

    expect(screen.getByText("Fazenda Exemplo B")).toBeInTheDocument();
    expect(screen.getByText("nota 35")).toBeInTheDocument();
    expect(
      screen.getByText(/Certificação Rainforest Alliance vencida/),
    ).toBeInTheDocument();
    expect(screen.getByText(/CAPA MAIOR em aberto/)).toBeInTheDocument();
    // A terceira pendência fica resumida no contador.
    expect(
      screen.queryByText(/Sem auditoria interna concluída/),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/\+ 1 outra\(s\) pendência\(s\)/),
    ).toBeInTheDocument();
  });

  it("torna cada pendência clicável para a tela que a resolve", () => {
    render(<CartaoProntidao carteira={CARTEIRA} />);

    expect(
      screen.getByRole("link", { name: /CAPA MAIOR em aberto/ }),
    ).toHaveAttribute("href", "/painel/capas");
    expect(
      screen.getByRole("link", {
        name: /Certificação Rainforest Alliance vencida/,
      }),
    ).toHaveAttribute("href", "/painel/clientes/cliente-b");
  });

  it("aparece no dashboard com os dados de demonstração", async () => {
    render(await PaginaDashboard());

    expect(screen.getByText("Prontidão para auditoria")).toBeInTheDocument();
    expect(screen.getByText(/com pendências/)).toBeInTheDocument();
  });
});

describe("destinoDaPendencia", () => {
  it("manda CAPA para a tela de CAPAs", () => {
    expect(destinoDaPendencia("CAPA CRÍTICA em aberto", "cedro").href).toBe(
      "/painel/capas",
    );
  });

  it("manda treinamento para Social já com o cliente selecionado", () => {
    expect(
      destinoDaPendencia("Treinamento vencido: NR-31", "sao jose").href,
    ).toBe("/painel/social?cliente=sao%20jose");
  });

  it("manda documento de imóvel para Imóveis com o cliente selecionado", () => {
    expect(
      destinoDaPendencia("Documento do imóvel vencido: Outorga", "cedro").href,
    ).toBe("/painel/imoveis?cliente=cedro");
  });

  it("manda a falta de auditoria interna para Visitas", () => {
    expect(
      destinoDaPendencia(
        "Sem auditoria interna concluída nos últimos 12 meses",
        "cedro",
      ).href,
    ).toBe("/painel/visitas");
  });

  it("manda certificado (vencido, a vencer ou suspenso) para a ficha", () => {
    expect(
      destinoDaPendencia("Certificação 4C vencida em 01/01/2026", "cedro").href,
    ).toBe("/painel/clientes/cedro");
    expect(
      destinoDaPendencia("Certificação 4C suspensa", "cedro").href,
    ).toBe("/painel/clientes/cedro");
  });

  it("descreve a ação para leitor de tela", () => {
    expect(destinoDaPendencia("CAPA menor em aberto", "cedro").acao).toBe(
      "Abrir CAPAs",
    );
  });
});
