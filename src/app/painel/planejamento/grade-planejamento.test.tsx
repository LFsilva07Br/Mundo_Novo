import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/planejamento/acoes", () => ({
  definirPlanejamento: vi.fn(async () => ({ ok: true, mensagem: "ok" })),
  removerPlanejamento: vi.fn(async () => ({ ok: true, mensagem: "ok" })),
}));

import { vincularRealizadas } from "@/lib/planejamento/regras";
import { PLANEJAMENTOS_DEMO } from "@/lib/planejamento/dados-demo";
import { GradePlanejamento } from "./grade-planejamento";

const CLIENTES = [
  { id: "alto-da-serra", nome: "Fazenda Alto da Serra" },
  { id: "guatambu", nome: "Fazendas Guatambu" },
  { id: "cedro", nome: "Fazenda Cedro" },
  { id: "lambari", nome: "Fazenda Lambari" },
  { id: "tecoara", nome: "Tecoara" },
  { id: "bernardes", nome: "Fazenda Bernardes" },
  { id: "chapadao-de-ferro", nome: "Chapadão de Ferro" },
  { id: "lagoinha", nome: "Fazenda Lagoinha" },
];

const PLANEJAMENTOS = vincularRealizadas(PLANEJAMENTOS_DEMO, [
  { id: "demo-visita-1", clienteId: "alto-da-serra", concluidaEm: "2026-08-22T13:10:00Z" },
]);

function renderizar() {
  return render(
    <GradePlanejamento
      ano={2026}
      clientes={CLIENTES}
      planejamentos={PLANEJAMENTOS}
      modoDemo
    />,
  );
}

describe("GradePlanejamento", () => {
  it("mostra os 12 meses, os clientes e a cobertura do ano", () => {
    renderizar();

    expect(screen.getByText("Planejamento anual de visitas")).toBeInTheDocument();
    for (const mes of ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]) {
      expect(screen.getByText(mes)).toBeInTheDocument();
    }
    expect(screen.getByText("Fazenda Alto da Serra")).toBeInTheDocument();

    // 5 clientes planejados de 8, 1 planejamento realizado
    expect(screen.getByText("5 / 8")).toBeInTheDocument();
    expect(
      screen.getByText("clientes com visita planejada"),
    ).toBeInTheDocument();
    expect(screen.getByText("planejamentos realizados")).toBeInTheDocument();
  });

  it("alerta os clientes sem planejamento no ano", () => {
    renderizar();
    const alerta = screen.getByText(/Sem planejamento em 2026/);
    expect(alerta).toHaveTextContent("Fazenda Bernardes");
    expect(alerta).toHaveTextContent("Chapadão de Ferro");
    expect(alerta).toHaveTextContent("Fazenda Lagoinha");
  });

  it("abre o dialog da célula e planeja a visita no modo demonstração", async () => {
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(
      screen.getByRole("button", { name: "Fazenda Bernardes — março" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Planejar visita" }),
    ).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Planejar visita" }));

    // A célula agora tem o selo do tipo e o alerta perde o cliente.
    expect(
      screen.getByText(/Sem planejamento em 2026/),
    ).not.toHaveTextContent("Fazenda Bernardes");
    expect(screen.getByText("6 / 8")).toBeInTheDocument();
  });

  it("permite alterar um planejamento existente", async () => {
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(
      screen.getByRole("button", { name: "Fazendas Guatambu — setembro" }),
    );
    expect(await screen.findByText("Alterar planejamento")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Remover/ }),
    ).toBeInTheDocument();
  });
});
