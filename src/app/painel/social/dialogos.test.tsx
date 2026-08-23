import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DialogoNovoTrabalhador } from "./dialogo-novo-trabalhador";
import { DialogoRegistrarTreinamento } from "./dialogo-registrar-treinamento";

vi.mock("@/lib/social/acoes", () => ({
  criarTrabalhador: vi.fn(),
  registrarParticipacaoTreinamento: vi.fn(),
}));

afterEach(cleanup);

const CLIENTE = "22222222-0000-4000-8000-000000000001";

describe("DialogoNovoTrabalhador", () => {
  it("abre o formulário completo de cadastro", async () => {
    const usuario = userEvent.setup();
    render(<DialogoNovoTrabalhador clienteId={CLIENTE} />);

    await usuario.click(
      screen.getByRole("button", { name: /Novo trabalhador/ }),
    );

    expect(await screen.findByLabelText("Nome completo")).toBeInTheDocument();
    expect(screen.getByLabelText("Vínculo")).toBeInTheDocument();
    expect(screen.getByLabelText("Função")).toBeInTheDocument();
    expect(screen.getByLabelText("CBO")).toBeInTheDocument();
    expect(screen.getByLabelText("Salário (R$)")).toBeInTheDocument();
    expect(screen.getByLabelText("Admissão")).toBeInTheDocument();
    expect(screen.getByLabelText("Nascimento")).toBeInTheDocument();
    expect(screen.getByLabelText("Gênero")).toBeInTheDocument();
    // Benefícios, adicionais e funções habilitadas como caixas de seleção.
    expect(screen.getByLabelText("Cesta básica")).toBeInTheDocument();
    expect(screen.getByLabelText("Insalubridade")).toBeInTheDocument();
    expect(screen.getByLabelText("Colhedeira")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Salvar colaborador" }),
    ).toBeEnabled();
  });

  it("o vínculo oferece fixo e temporário", async () => {
    const usuario = userEvent.setup();
    render(<DialogoNovoTrabalhador clienteId={CLIENTE} />);
    await usuario.click(
      screen.getByRole("button", { name: /Novo trabalhador/ }),
    );

    const vinculo = await screen.findByLabelText("Vínculo");
    expect(vinculo).toHaveValue("fixo");
    expect(
      screen.getByRole("option", { name: "Temporário" }),
    ).toBeInTheDocument();
  });
});

describe("DialogoRegistrarTreinamento", () => {
  const treinamentos = [
    { id: "t1", nome: "Defensivos", periodicidadeMeses: 12 },
    { id: "t2", nome: "Colhedeira", periodicidadeMeses: 24 },
  ];
  const trabalhadores = [
    { id: "w1", nome: "Antonio Sales Ferreira" },
    { id: "w2", nome: "Delorme de Abreu" },
  ];

  it("abre com treinamentos, colaboradores e data", async () => {
    const usuario = userEvent.setup();
    render(
      <DialogoRegistrarTreinamento
        treinamentos={treinamentos}
        trabalhadores={trabalhadores}
      />,
    );

    await usuario.click(
      screen.getByRole("button", { name: /Registrar treinamento/ }),
    );

    expect(screen.getByLabelText("Treinamento")).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /Defensivos \(a cada 12 meses\)/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Antonio Sales Ferreira"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Delorme de Abreu")).toBeInTheDocument();
    expect(screen.getByLabelText("Data de realização")).toBeRequired();
    expect(
      screen.getByRole("button", { name: "Registrar turma" }),
    ).toBeEnabled();
  });
});
