import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "./badge";
import { Button } from "./button";
import { Input } from "./input";

/**
 * Trava as decisões de acessibilidade tomadas nos primitivos (revisão WCAG 2.2
 * de ago/2026). São verificações de contrato de API e de classe utilitária: o
 * contraste de cor em si é medido no navegador de verdade, em
 * `e2e/acessibilidade.spec.ts`, porque o jsdom não calcula cor composta.
 */

describe("Badge — variantes semânticas", () => {
  it("oferece `warning` usando o token --warning, e não uma cor inventada pela tela", () => {
    render(<Badge variant="warning">Vence em 30 dias</Badge>);
    const selo = screen.getByText("Vence em 30 dias");
    expect(selo.className).toContain("bg-warning/10");
    expect(selo.className).toContain("text-warning");
  });

  it("oferece `success` usando o token --success", () => {
    render(<Badge variant="success">Conforme</Badge>);
    const selo = screen.getByText("Conforme");
    expect(selo.className).toContain("bg-success/10");
    expect(selo.className).toContain("text-success");
  });

  it("mantém `destructive` para o que já venceu ou falhou", () => {
    render(<Badge variant="destructive">Licença vencida</Badge>);
    const selo = screen.getByText("Licença vencida");
    expect(selo.className).toContain("bg-destructive/10");
    expect(selo.className).toContain("text-destructive");
  });

  it("não carrega mais o halo de foco de 50% de opacidade (era 1,33:1)", () => {
    render(<Badge>Rótulo</Badge>);
    expect(screen.getByText("Rótulo").className).not.toContain("ring-ring/50");
  });
});

describe("Button — alvo de toque", () => {
  it("`lg` mede 44px de altura, para uso em campo", () => {
    render(<Button size="lg">Iniciar visita</Button>);
    expect(screen.getByRole("button").className).toContain("h-11");
  });

  it("`icon-lg` é o quadrado de 44px", () => {
    render(
      <Button size="icon-lg" aria-label="Sincronizar">
        <svg />
      </Button>
    );
    expect(screen.getByRole("button").className).toContain("size-11");
  });

  it("o tamanho padrão continua em 32px — nada muda no painel", () => {
    render(<Button>Salvar</Button>);
    const botao = screen.getByRole("button");
    expect(botao.className).toContain("h-8");
    expect(botao.className).not.toContain("h-11");
  });

  it("não carrega mais o halo de foco de 50% de opacidade", () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByRole("button").className).not.toContain("ring-ring/50");
  });
});

describe("Input — alvo de toque", () => {
  it("`lg` mede 44px de altura, para campo e portal", () => {
    render(<Input size="lg" aria-label="Talhão" />);
    expect(screen.getByLabelText("Talhão").className).toContain("h-11");
  });

  it("o tamanho padrão continua em 32px", () => {
    render(<Input aria-label="Nome" />);
    const campo = screen.getByLabelText("Nome");
    expect(campo.className).toContain("h-8");
    expect(campo.className).not.toContain("h-11");
  });

  it("a borda usa o token --input, que foi escurecido para 3,54:1", () => {
    render(<Input aria-label="Nome" />);
    expect(screen.getByLabelText("Nome").className).toContain("border-input");
  });

  it("aceita className extra sem perder as classes da variante", () => {
    render(<Input size="lg" className="w-40" aria-label="CEP" />);
    const campo = screen.getByLabelText("CEP");
    expect(campo.className).toContain("h-11");
    expect(campo.className).toContain("w-40");
  });
});
