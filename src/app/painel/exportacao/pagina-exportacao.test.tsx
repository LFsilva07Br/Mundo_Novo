import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import PaginaExportacao from "./page";

async function renderizarPagina() {
  render(await PaginaExportacao());
}

describe("Página Exportação completa / backup", () => {
  it("explica a portabilidade e lista o conteúdo do pacote", async () => {
    await renderizarPagina();
    expect(
      screen.getByRole("heading", { name: "Exportação completa / backup" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/portabilidade da LGPD/)).toBeInTheDocument();
    expect(
      screen.getByText(/Visitas de checklist com todas as respostas/),
    ).toBeInTheDocument();
  });

  it("tem o botão da carteira completa apontando para o handler", async () => {
    await renderizarPagina();
    expect(
      screen.getByRole("link", { name: /Baixar carteira completa/ }),
    ).toHaveAttribute("href", "/api/exportacao");
  });

  it("o download por cliente segue o cliente escolhido", async () => {
    const usuario = userEvent.setup();
    await renderizarPagina();

    const link = screen.getByRole("link", { name: /Baixar este cliente/ });
    expect(link.getAttribute("href")).toMatch(/^\/api\/exportacao\?cliente=/);

    await usuario.selectOptions(
      screen.getByRole("combobox", { name: "Cliente da exportação" }),
      "cedro",
    );
    expect(
      screen.getByRole("link", { name: /Baixar este cliente/ }),
    ).toHaveAttribute("href", "/api/exportacao?cliente=cedro");
  });

  it("avisa que o pacote contém dados sensíveis", async () => {
    await renderizarPagina();
    expect(screen.getByText("Dados sensíveis.")).toBeInTheDocument();
    expect(
      screen.getByText(/restrito à gestão \(gestor e diretoria\)/),
    ).toBeInTheDocument();
  });
});
