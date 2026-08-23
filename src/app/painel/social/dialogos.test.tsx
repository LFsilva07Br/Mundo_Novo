import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DialogoEntregarEpi } from "./dialogo-entregar-epi";
import { DialogoNovoTrabalhador } from "./dialogo-novo-trabalhador";
import { DialogoRegistrarTreinamento } from "./dialogo-registrar-treinamento";

vi.mock("@/lib/social/acoes", () => ({
  criarTrabalhador: vi.fn(),
  registrarParticipacaoTreinamento: vi.fn(),
}));

vi.mock("@/lib/social/epis", () => ({
  entregarEpi: vi.fn(),
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

  it("permite colher a assinatura de um participante marcado", async () => {
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

    // Sem participante marcado, não há botão de assinar.
    expect(
      screen.queryByRole("button", { name: /Assinar/ }),
    ).not.toBeInTheDocument();

    await usuario.click(screen.getByLabelText("Antonio Sales Ferreira"));
    const assinar = screen.getByRole("button", { name: /^Assinar$/ });
    await usuario.click(assinar);

    expect(
      screen.getByText(/Assinatura de Antonio Sales Ferreira/),
    ).toBeInTheDocument();
    expect(screen.getByTestId("canvas-assinatura")).toBeInTheDocument();

    await usuario.click(
      screen.getByRole("button", { name: "Concluir assinatura" }),
    );
    expect(
      screen.queryByTestId("canvas-assinatura"),
    ).not.toBeInTheDocument();
  });
});

describe("DialogoEntregarEpi", () => {
  const trabalhadores = [
    { id: "w1", nome: "Antonio Sales Ferreira" },
    { id: "w2", nome: "Delorme de Abreu" },
  ];

  it("abre a ficha de entrega com EPIs sugeridos e quadro de assinatura", async () => {
    const usuario = userEvent.setup();
    render(<DialogoEntregarEpi trabalhadores={trabalhadores} />);

    await usuario.click(screen.getByRole("button", { name: /Entregar EPI/ }));

    expect(await screen.findByLabelText("Colaborador(a)")).toBeInTheDocument();
    expect(screen.getByLabelText("EPI entregue")).toBeRequired();
    expect(screen.getByLabelText("CA (opcional)")).toBeInTheDocument();
    expect(screen.getByLabelText("Quantidade")).toHaveValue(1);
    expect(screen.getByLabelText("Data da entrega")).toBeRequired();
    // Quadro de assinatura reutilizado do app de campo.
    expect(screen.getByTestId("canvas-assinatura")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Registrar entrega" }),
    ).toBeEnabled();
  });

  it("oferece os colaboradores do cliente na ficha", async () => {
    const usuario = userEvent.setup();
    render(<DialogoEntregarEpi trabalhadores={trabalhadores} />);
    await usuario.click(screen.getByRole("button", { name: /Entregar EPI/ }));

    expect(
      screen.getByRole("option", { name: "Antonio Sales Ferreira" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Delorme de Abreu" }),
    ).toBeInTheDocument();
  });
});
