import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MapPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EstadoVazio, EstadoVazioLinha } from "./estado-vazio";

afterEach(cleanup);

describe("EstadoVazio", () => {
  it("mostra o que falta e explica como sair do vazio", () => {
    render(
      <EstadoVazio
        titulo="Nenhum mapa enviado para este imóvel ainda."
        descricao="Exporte o KML do imóvel no site do CAR e envie aqui."
        icone={MapPlus}
      />,
    );

    expect(
      screen.getByText("Nenhum mapa enviado para este imóvel ainda."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Exporte o KML do imóvel no site do CAR/),
    ).toBeInTheDocument();
  });

  it("aceita uma ação que resolve o vazio", () => {
    render(
      <EstadoVazio
        titulo="Nenhum cliente cadastrado ainda."
        acao={<Button>Cadastrar cliente</Button>}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Cadastrar cliente" }),
    ).toBeEnabled();
  });

  it("funciona sem descrição e sem ação", () => {
    render(<EstadoVazio titulo="Nada por aqui." />);

    expect(screen.getByText("Nada por aqui.")).toBeInTheDocument();
  });

  it("como linha de tabela, ocupa todas as colunas e preserva o cabeçalho", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Certificação</TableHead>
            <TableHead>Situação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <EstadoVazioLinha
            colunas={3}
            titulo="Nenhum certificado com vencimento cadastrado."
            descricao="Cadastre a data de vencimento na ficha do cliente."
          />
        </TableBody>
      </Table>,
    );

    // O cabeçalho continua visível: a pessoa entende o que apareceria ali.
    expect(screen.getByText("Certificação")).toBeInTheDocument();

    const celula = screen
      .getByText("Nenhum certificado com vencimento cadastrado.")
      .closest("td");
    expect(celula).toHaveAttribute("colspan", "3");
    expect(
      screen.getByText(/Cadastre a data de vencimento na ficha do cliente./),
    ).toBeInTheDocument();
  });
});
