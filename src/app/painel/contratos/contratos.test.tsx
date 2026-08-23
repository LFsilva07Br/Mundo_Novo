import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { VisaoContratos } from "./visao-contratos";

afterEach(cleanup);
import { listarContratos } from "@/lib/certificacao/consultas";
import type { ContratoAlcada } from "@/lib/certificacao/consultas";

describe("Contratos & Alçada — modo demonstração", () => {
  it("mantém o seletor 'Ver como' e mostra os botões só para quem tem alçada", async () => {
    const usuario = userEvent.setup();
    const contratos = await listarContratos();
    render(
      <VisaoContratos contratos={contratos} perfil={null} modoDemo={true} />,
    );

    // Tâmara (com alçada) é a visão inicial → botões visíveis.
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Aprovar" })).toHaveLength(2);

    // Winicius não tem alçada → botões somem.
    await usuario.selectOptions(screen.getByRole("combobox"), "winicius");
    expect(
      screen.queryByRole("button", { name: "Aprovar" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText(/não possui alçada/)).not.toHaveLength(0);
  });

  it("mostra o escalonamento de contrato parado há mais de 10 dias", async () => {
    const contratos = await listarContratos();
    render(
      <VisaoContratos contratos={contratos} perfil={null} modoDemo={true} />,
    );

    expect(screen.getAllByText(/escalonamento\s+disparado/)).toHaveLength(2);
  });
});

describe("Contratos & Alçada — conectado ao banco", () => {
  const contrato: ContratoAlcada = {
    id: "11111111-1111-4111-8111-111111111111",
    codigo: "2026-041",
    clienteNome: "Fazenda Rio Verde (novo cadastro)",
    tipo: "fazenda",
    status: "aguardando_alcada",
    solicitadoPor: "Adriano Carvalho",
    solicitadoEm: "2026-07-15",
    diasParado: 38,
    decididoPor: null,
    decididoEm: null,
  };

  it("sem seletor 'Ver como': usa o perfil logado; sem alçada não há botões", () => {
    render(
      <VisaoContratos
        contratos={[contrato]}
        perfil={{
          id: "u1",
          nome: "Winicius Baquião Dutra",
          papel: "consultor",
          alcadaAprovacao: false,
        }}
        modoDemo={false}
      />,
    );

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Aprovar" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Winicius não possui alçada/)).toBeInTheDocument();
  });

  it("perfil com alçada vê Aprovar/Rejeitar", () => {
    render(
      <VisaoContratos
        contratos={[contrato]}
        perfil={{
          id: "u2",
          nome: "Tâmara Isa da Silva",
          papel: "gestor",
          alcadaAprovacao: true,
        }}
        modoDemo={false}
      />,
    );

    expect(screen.getByRole("button", { name: "Aprovar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Rejeitar" })).toBeEnabled();
  });

  it("contrato decidido mostra quem decidiu e quando", () => {
    render(
      <VisaoContratos
        contratos={[
          {
            ...contrato,
            status: "aprovado",
            diasParado: 0,
            decididoPor: "Tâmara Isa da Silva",
            decididoEm: "2026-08-22T10:00:00Z",
          },
        ]}
        perfil={null}
        modoDemo={false}
      />,
    );

    expect(
      screen.getByText(/Aprovado por Tâmara Isa da Silva em/),
    ).toBeInTheDocument();
  });
});
