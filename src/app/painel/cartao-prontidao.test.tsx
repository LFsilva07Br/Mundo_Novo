import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CartaoProntidao } from "./cartao-prontidao";
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
    // Cliente pronto não entra na lista de pendências.
    expect(screen.queryByText("Fazenda Exemplo A")).not.toBeInTheDocument();
  });

  it("aparece no dashboard com os dados de demonstração", async () => {
    render(await PaginaDashboard());

    expect(screen.getByText("Prontidão para auditoria")).toBeInTheDocument();
    expect(screen.getByText(/com pendências/)).toBeInTheDocument();
  });
});
