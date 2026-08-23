import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import {
  GaleriaEvidencias,
  type EvidenciaExibicao,
} from "./galeria-evidencias";

afterEach(cleanup);

const ITENS: EvidenciaExibicao[] = [
  {
    id: "ev-1",
    url: "https://assinada.exemplo/visitas/v1/1-a.jpg",
    descricao: "Sinalização instalada",
    gps: "-21.1234,-45.0021",
    data: "2026-08-22T10:00:00Z",
  },
  {
    id: "ev-2",
    url: null, // assinatura falhou — mostra reserva sem quebrar
  },
];

describe("GaleriaEvidencias", () => {
  it("mostra o texto de vazio quando não há evidências", () => {
    render(<GaleriaEvidencias itens={[]} vazio="Nenhuma foto ainda." />);
    expect(screen.getByText("Nenhuma foto ainda.")).toBeInTheDocument();
  });

  it("renderiza as miniaturas com a URL assinada", () => {
    render(<GaleriaEvidencias itens={ITENS} />);

    const miniatura = screen.getByAltText("Sinalização instalada");
    expect(miniatura).toHaveAttribute(
      "src",
      "https://assinada.exemplo/visitas/v1/1-a.jpg",
    );
    // Item sem URL assinada continua clicável (reserva com ícone).
    expect(screen.getByRole("button", { name: "Ver evidência 2" })).toBeInTheDocument();
  });

  it("clicar na miniatura abre o diálogo com imagem maior e metadados", async () => {
    const usuario = userEvent.setup();
    render(<GaleriaEvidencias itens={ITENS} />);

    await usuario.click(
      screen.getByRole("button", { name: /Ver evidência 1/ }),
    );

    expect(
      await screen.findByText("Evidência fotográfica"),
    ).toBeInTheDocument();
    expect(screen.getByText("Sinalização instalada")).toBeInTheDocument();
    expect(screen.getByText(/-21\.1234,-45\.0021/)).toBeInTheDocument();
    expect(screen.getByText("Data:")).toBeInTheDocument();
  });

  it("evidência sem imagem abre o diálogo com aviso de link expirado", async () => {
    const usuario = userEvent.setup();
    render(<GaleriaEvidencias itens={ITENS} />);

    await usuario.click(screen.getByRole("button", { name: "Ver evidência 2" }));

    expect(
      await screen.findByText(/Não foi possível carregar a imagem/),
    ).toBeInTheDocument();
    expect(screen.getByText("Sem descrição registrada.")).toBeInTheDocument();
  });
});
