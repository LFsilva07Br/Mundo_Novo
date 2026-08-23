import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DialogoNovaAplicacao } from "./dialogo-nova-aplicacao";
import { DialogoNovoProduto } from "./dialogo-novo-produto";
import { DialogoRegistrarDestinacao } from "./dialogo-registrar-destinacao";

vi.mock("@/lib/agro/acoes", () => ({
  cadastrarProduto: vi.fn(),
  registrarAplicacao: vi.fn(),
  registrarDestinacao: vi.fn(),
}));

afterEach(cleanup);

const CLIENTE = "22222222-0000-4000-8000-000000000001";

describe("DialogoNovaAplicacao", () => {
  const talhoes = [
    { id: "t1", nome: "Garagem", imovelNome: "Sítio Alto da Serra (Garagem)" },
    { id: "t2", nome: "São Bento", imovelNome: "Sítio Serra da Boa Vista" },
  ];
  const produtos = [
    { id: "p1", nome: "Glifosato 480 SL", proibidoRa: false },
    { id: "p2", nome: "Paraquate 200 SL", proibidoRa: true },
  ];
  const aplicadores = [{ id: "w1", nome: "Ricardo Aparecido de Abreu" }];

  function renderizar() {
    render(
      <DialogoNovaAplicacao
        clienteId={CLIENTE}
        talhoes={talhoes}
        produtos={produtos}
        aplicadores={aplicadores}
      />,
    );
  }

  it("abre com talhão, produto, dose, data, aplicador e equipamento", async () => {
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(screen.getByRole("button", { name: /Nova aplicação/ }));

    expect(await screen.findByLabelText("Talhão")).toBeInTheDocument();
    expect(
      screen.getByRole("option", {
        name: "Garagem · Sítio Alto da Serra (Garagem)",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Produto")).toBeInTheDocument();
    expect(screen.getByLabelText("Dose (opcional)")).toBeInTheDocument();
    expect(screen.getByLabelText("Data")).toBeRequired();
    expect(screen.getByLabelText("Aplicador")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Equipamento (opcional)"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Registrar aplicação" }),
    ).toBeEnabled();
  });

  it("avisa em vermelho ao selecionar um produto proibido pela RA", async () => {
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(screen.getByRole("button", { name: /Nova aplicação/ }));
    const seletorProduto = await screen.findByLabelText("Produto");

    // Produto permitido: sem aviso.
    await usuario.selectOptions(seletorProduto, "p1");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    // Produto proibido: aviso imediato antes mesmo de enviar.
    await usuario.selectOptions(seletorProduto, "p2");
    expect(screen.getByRole("alert")).toHaveTextContent(
      /lista de banidos da Rainforest Alliance/,
    );
  });

  it("marca o produto proibido na própria lista de opções", async () => {
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(screen.getByRole("button", { name: /Nova aplicação/ }));
    expect(
      await screen.findByRole("option", {
        name: "Paraquate 200 SL — PROIBIDO PELA RA",
      }),
    ).toBeInTheDocument();
  });
});

describe("DialogoNovoProduto", () => {
  it("abre com nome, ingrediente ativo e a flag de proibido", async () => {
    const usuario = userEvent.setup();
    render(<DialogoNovoProduto />);

    await usuario.click(screen.getByRole("button", { name: /Novo produto/ }));

    expect(await screen.findByLabelText("Nome comercial")).toBeRequired();
    expect(
      screen.getByLabelText("Ingrediente ativo (opcional)"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Proibido pela Rainforest Alliance/),
    ).toBeInTheDocument();
  });

  it("avisa sobre o alerta crítico ao marcar como proibido", async () => {
    const usuario = userEvent.setup();
    render(<DialogoNovoProduto />);

    await usuario.click(screen.getByRole("button", { name: /Novo produto/ }));
    await usuario.click(
      await screen.findByLabelText(/Proibido pela Rainforest Alliance/),
    );

    expect(
      screen.getByText(/aplicação deste produto será registrada com alerta/),
    ).toBeInTheDocument();
  });
});

describe("DialogoRegistrarDestinacao", () => {
  it("abre com data, quantidade, descrição e comprovante opcional", async () => {
    const usuario = userEvent.setup();
    render(<DialogoRegistrarDestinacao clienteId={CLIENTE} />);

    await usuario.click(
      screen.getByRole("button", { name: /Registrar destinação/ }),
    );

    expect(await screen.findByLabelText("Data")).toBeRequired();
    expect(
      screen.getByLabelText("Quantidade (opcional)"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Descrição")).toBeRequired();
    expect(
      screen.getByLabelText(/Comprovante \(opcional/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Registrar destinação" }),
    ).toBeEnabled();
  });
});
