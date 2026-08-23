import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NavPortal } from "./nav-portal";

vi.mock("next/navigation", () => ({
  usePathname: () => "/portal",
}));

describe("Navegação do portal", () => {
  it("mostra os quatro destinos — Relatórios não fica escondido", () => {
    render(<NavPortal />);
    for (const rotulo of [
      "Meu certificado",
      "Pendências",
      "Minha fazenda",
      "Relatórios",
    ]) {
      expect(screen.getByRole("link", { name: rotulo })).toBeInTheDocument();
    }
  });

  it("no celular é grade 2×2, não fila rolando de lado", () => {
    render(<NavPortal />);
    const nav = screen.getByRole("navigation", { name: "Navegação do portal" });

    expect(nav).toHaveClass("grid");
    expect(nav).toHaveClass("grid-cols-2");
    expect(nav.className).not.toContain("overflow-x-auto");
  });

  it("cada destino é um alvo de toque de 44px", () => {
    render(<NavPortal />);
    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveClass("min-h-11");
      expect(link).toHaveClass("text-base");
    }
  });

  it("destaca a página atual", () => {
    render(<NavPortal />);
    expect(screen.getByRole("link", { name: "Meu certificado" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "Relatórios" }),
    ).not.toHaveAttribute("aria-current");
  });
});
