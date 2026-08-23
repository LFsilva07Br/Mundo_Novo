import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ConfigAlertaCliente } from "@/lib/alertas/consultas";
import { OverridesClientes } from "./overrides-clientes";

vi.mock("@/lib/alertas/acoes", () => ({
  salvarConfiguracaoCliente: vi.fn(),
  removerConfiguracao: vi.fn(),
}));

const CONFIGS: ConfigAlertaCliente[] = [
  {
    clienteId: "alto-da-serra",
    clienteNome: "Fazenda Alto da Serra",
    dias: [180, 90, 30, 7],
    copiaAdminGrupo: true,
    atualizadoEm: null,
  },
  {
    clienteId: "cedro",
    clienteNome: "Fazenda Cedro",
    dias: [60, 30],
    copiaAdminGrupo: false,
    atualizadoEm: null,
  },
];

const CLIENTES = [
  { id: "alto-da-serra", nome: "Fazenda Alto da Serra" },
  { id: "cedro", nome: "Fazenda Cedro" },
  { id: "lagoinha", nome: "Fazenda Lagoinha" },
];

describe("OverridesClientes", () => {
  it("lista os clientes com régua própria e a cópia ao admin do grupo", () => {
    render(
      <OverridesClientes
        configuracoes={CONFIGS}
        clientes={CLIENTES}
        modoDemo={false}
      />,
    );

    expect(screen.getByText("Fazenda Alto da Serra")).toBeInTheDocument();
    expect(screen.getByText("Régua: 180 · 90 · 30 · 7 dias")).toBeInTheDocument();
    expect(screen.getByText("Fazenda Cedro")).toBeInTheDocument();
    expect(screen.getByText("Régua: 60 · 30 dias")).toBeInTheDocument();
    expect(screen.getAllByText("Cópia ao admin do grupo")).toHaveLength(1);
  });

  it("oferece novo override, edição e remoção com o banco conectado", () => {
    render(
      <OverridesClientes
        configuracoes={CONFIGS}
        clientes={CLIENTES}
        modoDemo={false}
      />,
    );

    expect(
      screen.getByRole("button", { name: /novo override/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Editar override de Fazenda Alto da Serra",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Remover override de Fazenda Cedro",
      }),
    ).toBeInTheDocument();
  });

  it("mostra o texto de vazio quando não há override cadastrado", () => {
    render(
      <OverridesClientes configuracoes={[]} clientes={CLIENTES} modoDemo={false} />,
    );

    expect(
      screen.getByText(/nenhum override cadastrado/i),
    ).toBeInTheDocument();
  });

  it("em modo demonstração avisa e fica somente leitura", () => {
    render(
      <OverridesClientes
        configuracoes={CONFIGS}
        clientes={CLIENTES}
        modoDemo
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      /modo demonstração/i,
    );
    expect(
      screen.queryByRole("button", { name: /novo override/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /editar/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /remover/i })).toBeNull();
  });
});
