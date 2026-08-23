import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SeletorCliente } from "./seletor-cliente";
import {
  COOKIE_CLIENTE_SELECIONADO,
  lerCookie,
} from "@/lib/cliente-selecionado";

const empurrar = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: empurrar }),
}));

const CLIENTES = [
  { id: "cedro", nome: "Fazenda Cedro" },
  { id: "sao jose", nome: "Fazenda São José" },
];

beforeEach(() => {
  empurrar.mockClear();
  document.cookie = `${COOKIE_CLIENTE_SELECIONADO}=; path=/; max-age=0`;
});

describe("SeletorCliente", () => {
  it("tem legenda visível ligada ao campo", () => {
    render(
      <SeletorCliente
        clientes={CLIENTES}
        clienteSelecionadoId="cedro"
        rota="/painel/eudr"
      />,
    );
    const campo = screen.getByLabelText("Cliente");
    expect(campo).toHaveValue("cedro");
    expect(screen.getByText("Cliente")).toBeInTheDocument();
  });

  it("navega para a rota com o id escapado na URL", async () => {
    const usuario = userEvent.setup();
    render(
      <SeletorCliente
        clientes={CLIENTES}
        clienteSelecionadoId="cedro"
        rota="/painel/imoveis"
      />,
    );

    await usuario.selectOptions(screen.getByLabelText("Cliente"), "sao jose");

    expect(empurrar).toHaveBeenCalledWith("/painel/imoveis?cliente=sao%20jose");
  });

  it("guarda o cliente ativo no cookie ao trocar", async () => {
    const usuario = userEvent.setup();
    render(
      <SeletorCliente
        clientes={CLIENTES}
        clienteSelecionadoId="cedro"
        rota="/painel/social"
      />,
    );

    await usuario.selectOptions(screen.getByLabelText("Cliente"), "sao jose");

    expect(lerCookie(document.cookie)).toBe("sao jose");
  });

  it("aceita outra legenda e outro parâmetro de URL", async () => {
    const usuario = userEvent.setup();
    render(
      <SeletorCliente
        clientes={CLIENTES}
        clienteSelecionadoId="cedro"
        rota="/painel/agro"
        parametro="fazenda"
        legenda="Fazenda"
      />,
    );

    await usuario.selectOptions(screen.getByLabelText("Fazenda"), "sao jose");

    expect(empurrar).toHaveBeenCalledWith("/painel/agro?fazenda=sao%20jose");
  });
});
