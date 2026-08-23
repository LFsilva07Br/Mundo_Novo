import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { listarAchados } from "@/lib/auditoria-externa/consultas";
import type { AchadoExterno } from "@/lib/auditoria-externa/consultas";
import { VisaoAuditoriaExterna } from "./visao-auditoria-externa";

const CLIENTES = [
  { id: "55555555-1111-4111-8111-111111111111", nome: "Fazenda Alto da Serra" },
];

let achados: AchadoExterno[];

beforeEach(async () => {
  achados = await listarAchados();
});

describe("Auditoria externa — achados", () => {
  it("mostra os KPIs, a tabela e o botão de registrar", () => {
    render(
      <VisaoAuditoriaExterna
        achados={achados}
        clientes={CLIENTES}
        modoDemo={true}
      />,
    );

    expect(screen.getByText("achados em aberto")).toBeInTheDocument();
    expect(screen.getByText("no prazo / estourados")).toBeInTheDocument();
    expect(screen.getByText(/pego internamente antes/)).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("NC-2026-041")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Registrar achado/ }),
    ).toBeEnabled();
  });

  it("mostra a CAPA vinculada com link e marca o achado pego só pela externa", () => {
    render(
      <VisaoAuditoriaExterna
        achados={achados}
        clientes={CLIENTES}
        modoDemo={true}
      />,
    );

    const linkCapa = screen.getByRole("link", { name: "CAPA #129" });
    expect(linkCapa).toHaveAttribute("href", "/painel/capas");
    expect(screen.getAllByText("Só pela externa")).toHaveLength(2);
  });

  it("filtra os achados por cliente e por status", async () => {
    const usuario = userEvent.setup();
    render(
      <VisaoAuditoriaExterna
        achados={achados}
        clientes={CLIENTES}
        modoDemo={true}
      />,
    );

    await usuario.selectOptions(
      screen.getByLabelText("Cliente"),
      "chapadao-de-ferro",
    );
    expect(screen.getByText("NC-2026-038")).toBeInTheDocument();
    expect(screen.queryByText("NC-2026-041")).not.toBeInTheDocument();

    await usuario.selectOptions(screen.getByLabelText("Cliente"), "");
    await usuario.selectOptions(screen.getByLabelText("Status"), "fechada");
    expect(screen.getByText("NC-2026-012")).toBeInTheDocument();
    expect(screen.queryByText("NC-2026-038")).not.toBeInTheDocument();
  });

  it("abre o diálogo com certificadora padrão e prazo sugerido de +70 dias", async () => {
    const usuario = userEvent.setup();
    render(
      <VisaoAuditoriaExterna
        achados={achados}
        clientes={CLIENTES}
        modoDemo={true}
      />,
    );

    await usuario.click(
      screen.getByRole("button", { name: /Registrar achado/ }),
    );

    expect(
      await screen.findByText(/~10 semanas para a correção/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Certificadora")).toHaveValue("ALAICE");

    const encontrado = screen.getByLabelText(
      "Data do achado",
    ) as HTMLInputElement;
    const prazo = screen.getByLabelText(
      /Prazo \(sugerido \+70 dias\)/,
    ) as HTMLInputElement;
    const diferencaDias =
      (new Date(`${prazo.value}T12:00:00`).getTime() -
        new Date(`${encontrado.value}T12:00:00`).getTime()) /
      (24 * 60 * 60 * 1000);
    expect(diferencaDias).toBe(70);
  });

  it("com criar CAPA vinculada marcado, exige o responsável pelo plano", async () => {
    const usuario = userEvent.setup();
    render(
      <VisaoAuditoriaExterna
        achados={achados}
        clientes={CLIENTES}
        modoDemo={true}
      />,
    );

    await usuario.click(
      screen.getByRole("button", { name: /Registrar achado/ }),
    );
    await usuario.click(
      await screen.findByRole("checkbox", {
        name: /Criar CAPA interna vinculada/,
      }),
    );

    expect(
      screen.getByLabelText("Responsável pelo plano de ação"),
    ).toBeRequired();
  });
});
