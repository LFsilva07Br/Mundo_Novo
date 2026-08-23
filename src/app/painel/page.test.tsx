import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PaginaDashboard from "./page";
import { listarClientes } from "@/lib/carteira/consultas";
import { resumoVencimentos } from "./indicadores";

/** Texto do valor (número grande) de um cartão de indicador. */
function valorDoCartao(rotulo: string): string {
  const titulo = screen.getByText(rotulo);
  const cartao = titulo.parentElement!;
  return cartao.firstElementChild!.textContent ?? "";
}

describe("Dashboard — cartões de indicador", () => {
  it("separa 'vencidas' de 'vencem em 90 dias' em vez de esconder as vencidas", async () => {
    const clientes = await listarClientes();
    const esperado = resumoVencimentos(
      clientes.flatMap((c) => c.certificacoes).filter((c) => c.venceEm),
    );

    render(await PaginaDashboard());

    expect(valorDoCartao("Certificações vencidas")).toBe(
      String(esperado.vencidas),
    );
    expect(valorDoCartao("Vencem em 90 dias")).toBe(
      String(esperado.vencendo90),
    );
    // O rótulo antigo somava mal os dois grupos e sumiu do painel.
    expect(screen.queryByText("Vencendo em 90 dias")).toBeNull();
  });

  it("deriva a composição da carteira dos dados, sem texto fixo", async () => {
    const clientes = await listarClientes();
    const grupos = new Set(
      clientes.map((c) => c.grupoId).filter(Boolean),
    ).size;
    const diretos = clientes.filter((c) => !c.grupoId).length;

    render(await PaginaDashboard());

    expect(valorDoCartao("Clientes ativos")).toBe(String(clientes.length));
    expect(
      screen.getByText(`${grupos} grupos + ${diretos} cliente direto`),
    ).toBeInTheDocument();
  });

  it("não vende mais o Social como novidade permanente", async () => {
    render(await PaginaDashboard());
    expect(screen.getByText("Social & Colaboradores")).toBeInTheDocument();
    expect(screen.queryByText("novo")).toBeNull();
  });
});
