import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FormularioCaptacao,
  FormularioDocumento,
  FormularioImovel,
  FormularioLancamentoSafra,
  FormularioTalhao,
} from "./dialogos";

vi.mock("@/lib/carteira/acoes-imoveis", () => ({
  criarImovel: vi.fn(),
  atualizarImovel: vi.fn(),
  criarTalhao: vi.fn(),
  atualizarTalhao: vi.fn(),
  lancarSafraTalhao: vi.fn(),
  adicionarDocumentoImovel: vi.fn(),
  adicionarCaptacao: vi.fn(),
}));

afterEach(cleanup);

const imoveis = [
  { id: "imovel-1", nome: "Sítio Alto da Serra" },
  { id: "imovel-2", nome: "Sítio Santa Luzia" },
];

describe("FormularioImovel", () => {
  it("exibe a ficha do imóvel com nome e área total obrigatórios", () => {
    render(<FormularioImovel clienteId="cliente-1" />);

    expect(screen.getByLabelText("Nome do imóvel")).toBeRequired();
    expect(screen.getByLabelText("Área total (ha)")).toBeRequired();
    expect(screen.getByLabelText("CAR")).toBeInTheDocument();
    expect(screen.getByLabelText("Matrículas")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", {
        name: /possui captação de água/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cadastrar imóvel" }),
    ).toBeEnabled();
  });

  it("na edição, preenche a ficha e troca o rótulo do botão", () => {
    render(
      <FormularioImovel
        clienteId="cliente-1"
        imovel={{
          id: "imovel-1",
          nome: "Sítio Alto da Serra (Garagem)",
          proprietarios: "Silvio Dutra",
          areaTotalHa: 24.5757,
          areaCafeHa: 13.47,
          areaAppHa: 0.6815,
          areaReservaHa: 6.7477,
          possuiCaptacaoAgua: true,
          documentos: [],
          captacoes: [],
        }}
      />,
    );

    expect(screen.getByLabelText("Nome do imóvel")).toHaveValue(
      "Sítio Alto da Serra (Garagem)",
    );
    expect(screen.getByLabelText("Área total (ha)")).toHaveValue("24,5757");
    expect(
      screen.getByRole("button", { name: "Salvar alterações" }),
    ).toBeInTheDocument();
  });
});

describe("FormularioTalhao", () => {
  it("exibe a ficha completa com os imóveis disponíveis", () => {
    render(<FormularioTalhao clienteId="cliente-1" imoveis={imoveis} />);

    expect(screen.getByLabelText("Imóvel rural")).toBeRequired();
    expect(
      screen.getByRole("option", { name: "Sítio Santa Luzia" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nome do talhão")).toBeRequired();
    expect(screen.getByLabelText("Área (ha)")).toBeRequired();
    expect(screen.getByLabelText("Variedade")).toBeRequired();
    expect(screen.getByLabelText("Ano de plantio")).toBeRequired();
    expect(screen.getByLabelText("Plantas por hectare")).toBeInTheDocument();
    expect(screen.getByLabelText("Espaçamento")).toBeInTheDocument();
  });
});

describe("FormularioLancamentoSafra", () => {
  it("lista talhões e safras, com a safra atual pré-selecionada", () => {
    render(
      <FormularioLancamentoSafra
        clienteId="cliente-1"
        talhoes={[
          { id: "talhao-1", nome: "Garagem", imovelNome: "Sítio Alto da Serra" },
        ]}
        safras={["2024/25", "2025/26", "2026/27"]}
        safraPadrao="2025/26"
      />,
    );

    expect(screen.getByLabelText("Talhão")).toBeRequired();
    expect(
      screen.getByRole("option", { name: "Garagem — Sítio Alto da Serra" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Safra")).toHaveValue("2025/26");
    expect(screen.getByLabelText("Previsão (sacas)")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Colheita efetiva (sacas)"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Estado da lavoura")).toBeInTheDocument();
  });
});

describe("FormularioDocumento", () => {
  it("exibe tipos de documento em linguagem de negócio", () => {
    render(
      <FormularioDocumento
        clienteId="cliente-1"
        imoveis={imoveis}
        imovelId="imovel-2"
      />,
    );

    expect(screen.getByLabelText("Imóvel rural")).toHaveValue("imovel-2");
    expect(
      screen.getByRole("option", { name: "Licença ambiental" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Dispensa de licença" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Vence em")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toHaveValue("ok");
  });
});

describe("FormularioCaptacao", () => {
  it("exige a descrição da captação e mostra processo e classificação", () => {
    render(<FormularioCaptacao clienteId="cliente-1" imoveis={imoveis} />);

    expect(screen.getByLabelText("Tipo de captação")).toBeRequired();
    expect(screen.getByLabelText("Processo")).toBeInTheDocument();
    expect(screen.getByLabelText("Classificação")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cadastrar captação" }),
    ).toBeEnabled();
  });
});
