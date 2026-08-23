import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { IndicadorConexao } from "./indicador-conexao";

/**
 * Sob sol forte, o estado da conexão precisa ser lido de relance — e o
 * OFFLINE (o que muda o comportamento do app) tem que gritar mais.
 */

function definirConexao(online: boolean) {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: online,
  });
}

afterEach(() => {
  definirConexao(true);
});

describe("IndicadorConexao", () => {
  it("usa fundo sólido e texto branco quando offline (contraste alto)", () => {
    definirConexao(false);
    render(<IndicadorConexao />);

    const aviso = screen.getByRole("status");
    expect(aviso.className).toContain("bg-destructive");
    expect(aviso.className).toContain("text-white");
    // Nada de fundo translúcido de 15% como antes.
    expect(aviso.className).not.toContain("/15");
    expect(aviso).toHaveTextContent("Offline");
    expect(aviso).toHaveTextContent("salvo no aparelho");
    expect(aviso).toHaveAccessibleName(/ficam guardados no aparelho/);
  });

  it("deixa o OFFLINE mais proeminente que o online", () => {
    definirConexao(false);
    const { unmount } = render(<IndicadorConexao />);
    const offline = screen.getByText("Offline");
    expect(offline.className).toContain("text-sm");
    expect(offline.className).toContain("font-extrabold");
    expect(offline.className).toContain("uppercase");
    unmount();

    definirConexao(true);
    render(<IndicadorConexao />);
    const online = screen.getByText("online");
    expect(online.className).toContain("bg-success");
    expect(online.className).toContain("text-white");
    // Discreto: menor e sem caixa alta.
    expect(online.className).toContain("text-[11px]");
    expect(online.className).not.toContain("uppercase");
  });
});
