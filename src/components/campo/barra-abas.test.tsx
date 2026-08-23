import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/** Barra inferior: alvos de toque grandes para dedo com luva, em pé. */

vi.mock("next/navigation", () => ({
  usePathname: () => "/campo",
}));

import { BarraAbas } from "./barra-abas";

describe("BarraAbas", () => {
  it("dá 56px de altura mínima a cada aba", () => {
    render(<BarraAbas />);
    const abas = screen.getAllByRole("link");
    expect(abas).toHaveLength(4);
    for (const aba of abas) {
      expect(aba.className).toContain("min-h-14");
    }
  });

  it("marca a aba atual para quem chega pela navegação", () => {
    render(<BarraAbas />);
    expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
