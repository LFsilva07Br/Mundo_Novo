import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogoConfirmar } from "./dialogo-confirmar";

afterEach(cleanup);

describe("DialogoConfirmar", () => {
  it("só confirma depois que a pessoa abre o diálogo e aperta a ação", async () => {
    const usuario = userEvent.setup();
    const aoConfirmar = vi.fn();

    render(
      <DialogoConfirmar
        gatilho={<Button>Desativar acesso</Button>}
        titulo="Desativar o acesso de Maria?"
        oQueMuda="Maria deixa de entrar no sistema a partir de agora."
        oQueNaoMuda="O histórico de visitas e os laudos assinados por ela continuam no sistema."
        rotuloAcao="Desativar acesso"
        destrutivo
        aoConfirmar={aoConfirmar}
      />,
    );

    // Nada acontece só de existir o botão na tela.
    expect(
      screen.queryByText("Desativar o acesso de Maria?"),
    ).not.toBeInTheDocument();
    expect(aoConfirmar).not.toHaveBeenCalled();

    await usuario.click(screen.getByRole("button", { name: "Desativar acesso" }));

    expect(screen.getByText("Desativar o acesso de Maria?")).toBeInTheDocument();
    expect(aoConfirmar).not.toHaveBeenCalled();

    await usuario.click(
      screen.getByRole("button", { name: "Desativar acesso" }),
    );
    expect(aoConfirmar).toHaveBeenCalledTimes(1);
  });

  it("diz o que muda e o que não muda antes de confirmar", async () => {
    const usuario = userEvent.setup();

    render(
      <DialogoConfirmar
        gatilho={<Button>Avançar</Button>}
        titulo="Avançar a Fazenda Alto da Serra para Auditoria?"
        oQueMuda="O processo sai de Pré-auditoria e entra em Auditoria."
        oQueNaoMuda="As CAPAs abertas e o histórico do cliente continuam como estão."
        rotuloAcao="Avançar etapa"
        aoConfirmar={vi.fn()}
      />,
    );

    await usuario.click(screen.getByRole("button", { name: "Avançar" }));

    expect(
      screen.getByText(/O processo sai de Pré-auditoria/),
    ).toBeInTheDocument();
    expect(screen.getByText("O que não muda:")).toBeInTheDocument();
    expect(
      screen.getByText(/As CAPAs abertas e o histórico do cliente/),
    ).toBeInTheDocument();
  });

  it("cancelar fecha o diálogo sem executar a ação", async () => {
    const usuario = userEvent.setup();
    const aoConfirmar = vi.fn();

    render(
      <DialogoConfirmar
        gatilho={<Button>Remover mapa</Button>}
        titulo="Remover o mapa Talhões 2024?"
        oQueMuda="O mapa sai do painel do imóvel."
        rotuloAcao="Remover mapa"
        destrutivo
        aoConfirmar={aoConfirmar}
      />,
    );

    await usuario.click(screen.getByRole("button", { name: "Remover mapa" }));
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(aoConfirmar).not.toHaveBeenCalled();
    expect(
      screen.queryByText("Remover o mapa Talhões 2024?"),
    ).not.toBeInTheDocument();
  });

  it("não deixa confirmar duas vezes enquanto a ação está em andamento", async () => {
    const usuario = userEvent.setup();
    const aoConfirmar = vi.fn();

    render(
      <DialogoConfirmar
        aberto
        gatilho={<Button>Fechar CAPA</Button>}
        titulo="Fechar a CAPA #131?"
        oQueMuda="A CAPA passa para o status Fechada."
        rotuloAcao="Fechar CAPA"
        pendente
        aoConfirmar={aoConfirmar}
      />,
    );

    const confirmar = screen.getAllByRole("button", { name: "Fechar CAPA" });
    const dentroDoDialogo = confirmar[confirmar.length - 1];
    expect(dentroDoDialogo).toBeDisabled();
    await usuario.click(dentroDoDialogo);
    expect(aoConfirmar).not.toHaveBeenCalled();
  });

  it("no modo controlado avisa quem chama quando o diálogo fecha", async () => {
    const usuario = userEvent.setup();
    const aoConfirmar = vi.fn();

    function Hospedeiro() {
      const [aberto, setAberto] = useState(true);
      return (
        <>
          <p>{aberto ? "diálogo aberto" : "diálogo fechado"}</p>
          <DialogoConfirmar
            aberto={aberto}
            aoMudarAberto={setAberto}
            titulo="Remover o planejamento de julho?"
            oQueMuda="O mês previsto sai da grade do ano."
            rotuloAcao="Remover"
            destrutivo
            aoConfirmar={aoConfirmar}
          />
        </>
      );
    }

    render(<Hospedeiro />);
    expect(screen.getByText("diálogo aberto")).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Remover" }));

    expect(aoConfirmar).toHaveBeenCalledTimes(1);
    expect(screen.getByText("diálogo fechado")).toBeInTheDocument();
  });
});
