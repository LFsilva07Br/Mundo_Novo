import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { VisitaResumo } from "@/lib/checklists/tipos";
import { AuditoriasCliente } from "./auditorias-cliente";

const VISITAS: VisitaResumo[] = [
  {
    id: "v1",
    titulo: "Auditoria interna RA 1.4",
    clienteNome: "Fazenda Alto da Serra",
    origem: "campo",
    status: "concluida",
    iniciadaEm: "2026-08-22T10:30:00Z",
    concluidaEm: "2026-08-22T13:10:00Z",
    totalItens: 10,
    respondidos: 10,
    naoConformes: 1,
    conformidade: 89,
  },
  {
    id: "v2",
    titulo: "Checklist documental",
    clienteNome: "Fazenda Alto da Serra",
    origem: "escritorio",
    status: "concluida",
    iniciadaEm: "2026-07-10T09:00:00Z",
    concluidaEm: "2026-07-10T11:00:00Z",
    totalItens: 10,
    respondidos: 10,
    naoConformes: 0,
    conformidade: null,
  },
];

describe("AuditoriasCliente", () => {
  it("lista as auditorias concluídas com título, origem e conformidade", () => {
    render(<AuditoriasCliente visitas={VISITAS} />);

    expect(screen.getByText("Auditorias realizadas")).toBeInTheDocument();
    const tabela = within(screen.getByRole("table"));
    expect(tabela.getByText("Auditoria interna RA 1.4")).toBeInTheDocument();
    expect(tabela.getByText("Campo")).toBeInTheDocument();
    expect(tabela.getByText("89%")).toBeInTheDocument();
  });

  it("visita sem base de cálculo mostra travessão na conformidade", () => {
    render(<AuditoriasCliente visitas={VISITAS} />);

    const tabela = within(screen.getByRole("table"));
    expect(tabela.getByText("Checklist documental")).toBeInTheDocument();
    expect(tabela.getByText("Escritório")).toBeInTheDocument();
    expect(tabela.getByText("—")).toBeInTheDocument();
  });

  it("sem auditorias, explica que as visitas concluídas aparecerão ali", () => {
    render(<AuditoriasCliente visitas={[]} />);
    expect(
      screen.getByText(/nenhuma auditoria concluída ainda/i),
    ).toBeInTheDocument();
  });
});
