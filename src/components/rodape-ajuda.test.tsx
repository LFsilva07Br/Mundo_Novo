import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RodapeAjuda } from "./rodape-ajuda";
import { CONTATO_PORTAL, CONTATO_QUEIXAS, linkWhatsapp } from "@/lib/portal/contato";

afterEach(cleanup);

describe("Rodapé de ajuda", () => {
  it("mostra consultor, WhatsApp, telefone e e-mail no portal", () => {
    render(<RodapeAjuda />);

    const secao = screen.getByRole("region", {
      name: /Precisa de ajuda\? Fale com a gente/,
    });
    expect(within(secao).getByText(CONTATO_PORTAL.nome)).toBeInTheDocument();
    expect(within(secao).getByText(CONTATO_PORTAL.whatsapp)).toBeInTheDocument();
    expect(within(secao).getByText(CONTATO_PORTAL.telefone)).toBeInTheDocument();
    expect(within(secao).getByText(CONTATO_PORTAL.email)).toBeInTheDocument();
  });

  it("liga WhatsApp, telefone e e-mail de verdade", () => {
    render(<RodapeAjuda />);

    expect(screen.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute(
      "href",
      linkWhatsapp(CONTATO_PORTAL.whatsapp),
    );
    expect(screen.getByRole("link", { name: /Telefone/ })).toHaveAttribute(
      "href",
      expect.stringMatching(/^tel:\+55\d+$/),
    );
    expect(screen.getByRole("link", { name: /E-mail/ })).toHaveAttribute(
      "href",
      `mailto:${CONTATO_PORTAL.email}`,
    );
  });

  it("no canal de queixas usa contato DIFERENTE do consultor da fazenda", () => {
    render(<RodapeAjuda canal="queixas" tema="escuro" />);

    const secao = screen.getByRole("region", {
      name: /Prefere falar com uma pessoa/,
    });
    expect(within(secao).getByText(CONTATO_QUEIXAS.nome)).toBeInTheDocument();
    expect(secao.textContent).not.toContain(CONTATO_PORTAL.telefone);
    expect(secao.textContent).not.toContain(CONTATO_PORTAL.whatsapp);
    expect(secao.textContent).not.toContain(CONTATO_PORTAL.email);
  });

  it("deixa explícito que o canal não é o consultor da fazenda", () => {
    render(<RodapeAjuda canal="queixas" tema="escuro" />);
    expect(
      screen.getByText(/Este contato é da certificadora/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/não é ninguém da administração dela/),
    ).toBeInTheDocument();
  });

  it("os contatos do portal e do canal de queixas nunca coincidem", () => {
    expect(CONTATO_QUEIXAS.telefone).not.toBe(CONTATO_PORTAL.telefone);
    expect(CONTATO_QUEIXAS.whatsapp).not.toBe(CONTATO_PORTAL.whatsapp);
    expect(CONTATO_QUEIXAS.email).not.toBe(CONTATO_PORTAL.email);
  });

  it("cada link é um alvo de toque de 44px", () => {
    render(<RodapeAjuda />);
    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveClass("min-h-11");
      expect(link).toHaveClass("text-base");
    }
  });
});
